// ─── Edge Function: facturar-arca ───────────────────────────────────────────
// Emite Factura C (monotributo, consumidor final) por los Web Services de ARCA.
// Etapas de prueba con ?action=... :
//   auth-test  → solo autentica en WSAA y devuelve el vencimiento del token.
//   facturar   → autentica + emite la factura del pago indicado (body {pago_id}).
//
// SECRETOS que hay que cargar en Supabase (Edge Functions → Secrets):
//   ARCA_ENV     = "homo"  (homologación) o "prod" (producción)
//   ARCA_CUIT    = "20376576834"
//   ARCA_PTOVTA  = "1"     (punto de venta de Web Services)
//   ARCA_CERT_B64 = (certificado .crt en base64)
//   ARCA_KEY_B64  = (clave privada .key en base64)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (los inyecta Supabase solos)
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import forge from "https://esm.sh/node-forge@1.3.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENV = Deno.env.get("ARCA_ENV") || "homo";
const CUIT = Deno.env.get("ARCA_CUIT") || "";
const PTOVTA = parseInt(Deno.env.get("ARCA_PTOVTA") || "1");
const CBTE_TIPO = 11; // Factura C

const URLS = ENV === "prod"
  ? { wsaa: "https://wsaa.afip.gov.ar/ws/services/LoginCms", wsfe: "https://servicios1.afip.gov.ar/wsfev1/service.asmx" }
  : { wsaa: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms", wsfe: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx" };

function pemFromB64(name: string): string {
  const b64 = Deno.env.get(name) || "";
  try { return atob(b64); } catch { return b64; } // por si lo cargan sin base64
}

// ── WSAA: crear y firmar el "ticket de acceso" (TRA) ──
function crearTRA(service: string): string {
  const now = Date.now();
  // Hora local Argentina (UTC-3) sin milisegundos: "YYYY-MM-DDTHH:MM:SS-03:00".
  const iso = (t: number) => {
    const d = new Date(t - 3 * 3600 * 1000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}-03:00`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0"><header>` +
    `<uniqueId>${Math.floor(now / 1000)}</uniqueId>` +
    `<generationTime>${iso(now - 600000)}</generationTime>` +
    `<expirationTime>${iso(now + 600000)}</expirationTime>` +
    `</header><service>${service}</service></loginTicketRequest>`;
}

function firmarCMS(traXml: string): string {
  const cert = forge.pki.certificateFromPem(pemFromB64("ARCA_CERT_B64"));
  const key = forge.pki.privateKeyFromPem(pemFromB64("ARCA_KEY_B64"));
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(traXml, "utf8");
  p7.addCertificate(cert);
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() },
    ],
  });
  p7.sign();
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return forge.util.encode64(der);
}

function unescapeXml(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

async function obtenerTA(sb: any): Promise<{ token: string; sign: string }> {
  // Cache por ambiente: el token de homologación NO sirve para producción y viceversa.
  const key = "wsfe-" + ENV;
  const { data: cache } = await sb.from("arca_tokens").select("*").eq("servicio", key).maybeSingle();
  if (cache && cache.expira && new Date(cache.expira).getTime() > Date.now() + 120000) {
    return { token: cache.token, sign: cache.sign };
  }
  const tra = crearTRA("wsfe");
  const cms = firmarCMS(tra);
  const soap = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">` +
    `<soapenv:Header/><soapenv:Body><wsaa:loginCms><wsaa:in0>${cms}</wsaa:in0></wsaa:loginCms></soapenv:Body></soapenv:Envelope>`;
  const resp = await fetch(URLS.wsaa, { method: "POST", headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "" }, body: soap });
  const xml = await resp.text();
  const ret = xml.match(/<loginCmsReturn>([\s\S]*?)<\/loginCmsReturn>/);
  if (!ret) throw new Error("WSAA sin loginCmsReturn. Respuesta: " + xml.slice(0, 600));
  const ta = unescapeXml(ret[1]);
  const token = ta.match(/<token>([\s\S]*?)<\/token>/)?.[1];
  const sign = ta.match(/<sign>([\s\S]*?)<\/sign>/)?.[1];
  const expira = ta.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/)?.[1];
  if (!token || !sign) throw new Error("WSAA no devolvió token/sign. TA: " + ta.slice(0, 600));
  await sb.from("arca_tokens").upsert({ servicio: key, token, sign, expira });
  return { token, sign };
}

// ── WSFE: llamada SOAP genérica (con reintentos ante caídas de ARCA) ──
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function wsfe(metodo: string, bodyInner: string): Promise<string> {
  const soap = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">` +
    `<soap:Body><ar:${metodo}>${bodyInner}</ar:${metodo}></soap:Body></soap:Envelope>`;
  let ultStatus = 0, ultTexto = "";
  for (let intento = 0; intento < 3; intento++) {
    try {
      const resp = await fetch(URLS.wsfe, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": `http://ar.gov.afip.dif.FEV1/${metodo}` },
        body: soap,
      });
      const txt = await resp.text();
      ultStatus = resp.status; ultTexto = txt;
      // Si vino XML (comprobante o SOAP fault), lo devolvemos para que el llamador lo procese.
      const pareceXml = txt.includes("<soap") || txt.trimStart().startsWith("<?xml") || txt.includes("Envelope");
      if (pareceXml) return txt;
    } catch (e) {
      ultStatus = 0; ultTexto = String((e as Error)?.message || e);
    }
    // No es XML (ARCA caído / 503 / gateway HTML) → esperar y reintentar.
    if (intento < 2) await dormir(1500);
  }
  const noDisp = [502, 503, 504].includes(ultStatus) || /service unavailable|<html|<h1|bad gateway|timeout/i.test(ultTexto);
  throw new Error(noDisp
    ? `El servidor de ARCA no está disponible en este momento (HTTP ${ultStatus || "sin respuesta"}). Esto es una caída temporal de ARCA, no de la app. Esperá unos minutos y volvé a intentar.`
    : `ARCA respondió algo inesperado (HTTP ${ultStatus}). ${String(ultTexto).slice(0, 300)}`);
}

function authXml(token: string, sign: string): string {
  return `<ar:Auth><ar:Token>${token}</ar:Token><ar:Sign>${sign}</ar:Sign><ar:Cuit>${CUIT}</ar:Cuit></ar:Auth>`;
}

async function ultimoComprobante(token: string, sign: string): Promise<number> {
  const xml = await wsfe("FECompUltimoAutorizado", `${authXml(token, sign)}<ar:PtoVta>${PTOVTA}</ar:PtoVta><ar:CbteTipo>${CBTE_TIPO}</ar:CbteTipo>`);
  const err = xml.match(/<Errors>[\s\S]*?<Msg>([\s\S]*?)<\/Msg>/);
  if (err) throw new Error("FECompUltimoAutorizado: " + err[1]);
  const nro = xml.match(/<CbteNro>(\d+)<\/CbteNro>/);
  return nro ? parseInt(nro[1]) : 0;
}

async function emitir(token: string, sign: string, importe: number) {
  const nro = (await ultimoComprobante(token, sign)) + 1;
  const hoy = new Date();
  const fch = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`;
  const imp = importe.toFixed(2);
  const det = `<ar:FECAEDetRequest>` +
    `<ar:Concepto>2</ar:Concepto>` + // servicios
    `<ar:DocTipo>99</ar:DocTipo><ar:DocNro>0</ar:DocNro>` + // consumidor final
    `<ar:CbteDesde>${nro}</ar:CbteDesde><ar:CbteHasta>${nro}</ar:CbteHasta>` +
    `<ar:CbteFch>${fch}</ar:CbteFch>` +
    `<ar:ImpTotal>${imp}</ar:ImpTotal><ar:ImpTotConc>0</ar:ImpTotConc><ar:ImpNeto>${imp}</ar:ImpNeto>` +
    `<ar:ImpOpEx>0</ar:ImpOpEx><ar:ImpIVA>0</ar:ImpIVA><ar:ImpTrib>0</ar:ImpTrib>` +
    `<ar:FchServDesde>${fch}</ar:FchServDesde><ar:FchServHasta>${fch}</ar:FchServHasta><ar:FchVtoPago>${fch}</ar:FchVtoPago>` +
    `<ar:MonId>PES</ar:MonId><ar:MonCotiz>1</ar:MonCotiz>` +
    `<ar:CondicionIVAReceptorId>5</ar:CondicionIVAReceptorId>` + // 5 = Consumidor Final (RG 5616)
    `</ar:FECAEDetRequest>`;
  const inner = `${authXml(token, sign)}<ar:FeCAEReq>` +
    `<ar:FeCabReq><ar:CantReg>1</ar:CantReg><ar:PtoVta>${PTOVTA}</ar:PtoVta><ar:CbteTipo>${CBTE_TIPO}</ar:CbteTipo></ar:FeCabReq>` +
    `<ar:FeDetReq>${det}</ar:FeDetReq></ar:FeCAEReq>`;
  const xml = await wsfe("FECAESolicitar", inner);
  const cae = xml.match(/<CAE>(\d+)<\/CAE>/);
  const caeVto = xml.match(/<CAEFchVto>(\d+)<\/CAEFchVto>/);
  const resultado = xml.match(/<Resultado>([\s\S]*?)<\/Resultado>/)?.[1];
  if (!cae || resultado !== "A") {
    const obs = xml.match(/<Observaciones>[\s\S]*?<Msg>([\s\S]*?)<\/Msg>/)?.[1];
    const errMsg = xml.match(/<Errors>[\s\S]*?<Msg>([\s\S]*?)<\/Msg>/)?.[1];
    throw new Error(`ARCA rechazó la factura (Resultado=${resultado || "?"}). ${obs || errMsg || xml.slice(0, 600)}`);
  }
  const vto = caeVto ? caeVto[1] : "";
  const nroFmt = `${String(PTOVTA).padStart(4, "0")}-${String(nro).padStart(8, "0")}`;
  const caeVtoISO = vto ? `${vto.slice(0, 4)}-${vto.slice(4, 6)}-${vto.slice(6, 8)}` : null;
  const fchISO = `${fch.slice(0, 4)}-${fch.slice(4, 6)}-${fch.slice(6, 8)}`;
  return { nro, nroFmt, cae: cae[1], caeVto: caeVtoISO, fecha: fchISO, ptoVta: PTOVTA };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const j = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "facturar";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "auth-test") {
      const { token } = await obtenerTA(sb);
      const { data: c } = await sb.from("arca_tokens").select("expira").eq("servicio", "wsfe").maybeSingle();
      return j({ ok: true, mensaje: "Autenticación con ARCA OK ✅", token_hasta: c?.expira, token_len: token.length });
    }

    if (action === "facturar") {
      const body = await req.json().catch(() => ({}));
      // Puede facturar un pago (tabla 'pagos') o una extensión ('extensiones_video').
      const tabla = body.tabla === "extensiones_video" ? "extensiones_video" : "pagos";
      const id = body.id || body.pago_id;
      if (!id) return j({ ok: false, error: "Falta id" }, 400);
      const { data: rec } = await sb.from(tabla).select("*").eq("id", id).single();
      if (!rec) return j({ ok: false, error: "Registro no encontrado" }, 404);
      if (rec.factura_cae) return j({ ok: true, yaFacturado: true, nro: rec.factura_nro, cae: rec.factura_cae });
      const importe = parseFloat(rec.monto);
      if (!importe || importe <= 0) return j({ ok: false, error: "Importe inválido" }, 400);

      const { token, sign } = await obtenerTA(sb);
      const f = await emitir(token, sign, importe);
      await sb.from(tabla).update({
        factura_nro: f.nroFmt, factura_cae: f.cae, factura_cae_vto: f.caeVto,
        factura_fecha: f.fecha, factura_pto_vta: f.ptoVta, factura_tipo: "C", factura_env: ENV,
      }).eq("id", id);
      return j({ ok: true, ...f });
    }

    return j({ ok: false, error: "Acción desconocida" }, 400);
  } catch (err) {
    return j({ ok: false, error: String(err?.message || err) }, 500);
  }
});
