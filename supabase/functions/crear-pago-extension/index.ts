// Edge Function: crear-pago-extension
// Crea una preferencia de pago en Mercado Pago para:
//   - extender 24hs el acceso a un VIDEO (body { video_id, alumno_id }), o
//   - habilitar 24hs para rendir una EVALUACIÓN vencida (body { evaluacion_id, alumno_id }).
// TODA la validación se hace acá (en el servidor). Nunca se confía en lo que manda el navegador.
// external_reference viaja con el pago y vuelve en el webhook. Usa prefijo para saber la tabla:
//   "video:<id>" → extensiones_video   |   "eval:<id>" → evaluaciones_extensiones
// (los pagos viejos, sin prefijo, el webhook los trata como video.)

const MAX_COMPRAS = 2 // tope de extensiones por alumno y video

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Consulta a la base vía API REST de Supabase.
async function db(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // paso sirve para saber dónde falló si algo sale mal
  let paso = 'inicio'

  try {
    paso = 'leer secrets'
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    const APP_URL = Deno.env.get('APP_URL')
    if (!MP_ACCESS_TOKEN) return json({ error: 'Falta el secret MP_ACCESS_TOKEN', paso }, 500)
    if (!APP_URL) return json({ error: 'Falta el secret APP_URL', paso }, 500)
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: 'Faltan credenciales de Supabase', paso }, 500)

    paso = 'leer body'
    const body = await req.json()
    const video_id = body?.video_id
    const evaluacion_id = body?.evaluacion_id
    const alumno_id = body?.alumno_id
    if (!alumno_id) return json({ error: 'Falta alumno_id', paso }, 400)
    if (!video_id && !evaluacion_id) return json({ error: 'Falta video_id o evaluacion_id', paso }, 400)

    const ahora = new Date()

    paso = 'buscar alumno'
    const aRes = await db(`alumnos?id=eq.${alumno_id}&select=id,nombre,email`)
    if (!aRes.ok) return json({ error: 'Error al consultar el alumno', paso, detalle: aRes.data }, 500)
    const alumno = Array.isArray(aRes.data) ? aRes.data[0] : null
    if (!alumno) return json({ error: 'El alumno no existe', paso }, 404)

    // Datos comunes que arma cada rama (video o evaluación).
    let titulo = ''
    let precio = 0
    let tabla = ''
    let refPrefix = ''
    let itemTitle = ''

    if (evaluacion_id) {
      // ─── Rama EVALUACIÓN ───
      paso = 'buscar evaluacion'
      const eRes = await db(`evaluaciones?id=eq.${evaluacion_id}&select=id,titulo,fecha_limite,precio_extension`)
      if (!eRes.ok) return json({ error: 'Error al consultar la evaluación', paso, detalle: eRes.data }, 500)
      const ev = Array.isArray(eRes.data) ? eRes.data[0] : null
      if (!ev) return json({ error: 'La evaluación no existe', paso }, 404)

      paso = 'validar precio'
      if (!ev.precio_extension || Number(ev.precio_extension) <= 0) {
        return json({ error: 'Esta evaluación no tiene precio de extensión configurado', paso }, 400)
      }

      paso = 'validar vencimiento'
      if (!ev.fecha_limite || new Date(ev.fecha_limite) > ahora) {
        return json({ error: 'La evaluación todavía no venció', paso }, 400)
      }

      paso = 'validar ya realizada'
      const rRes = await db(`evaluaciones_respuestas?evaluacion_id=eq.${evaluacion_id}&alumno_id=eq.${alumno_id}&select=id`)
      if (Array.isArray(rRes.data) && rRes.data.length > 0) {
        return json({ error: 'Ya realizaste esta evaluación', paso }, 400)
      }

      paso = 'validar extension vigente'
      const cRes = await db(`evaluaciones_extensiones?evaluacion_id=eq.${evaluacion_id}&alumno_id=eq.${alumno_id}&estado=eq.pagado&select=id,vence_en`)
      const compras = Array.isArray(cRes.data) ? cRes.data : []
      const vigente = compras.find((c: any) => c.vence_en && new Date(c.vence_en) > ahora)
      if (vigente) return json({ error: 'Ya tenés una extensión activa para esta evaluación', paso }, 400)

      titulo = ev.titulo
      precio = Number(ev.precio_extension)
      tabla = 'evaluaciones_extensiones'
      refPrefix = 'eval:'
      itemTitle = `Extension para rendir - ${ev.titulo}`.slice(0, 250)
    } else {
      // ─── Rama VIDEO (comportamiento original) ───
      paso = 'buscar video'
      const vRes = await db(`videos?id=eq.${video_id}&select=id,titulo,vence_en,precio_extension,max_vistas`)
      if (!vRes.ok) return json({ error: 'Error al consultar el video', paso, detalle: vRes.data }, 500)
      const video = Array.isArray(vRes.data) ? vRes.data[0] : null
      if (!video) return json({ error: 'El video no existe', paso }, 404)

      paso = 'validar precio'
      if (!video.precio_extension || Number(video.precio_extension) <= 0) {
        return json({ error: 'Este video no tiene precio de extensión configurado', paso }, 400)
      }

      paso = 'validar vencimiento'
      if (!video.vence_en || new Date(video.vence_en) > ahora) {
        return json({ error: 'El video todavía no venció', paso }, 400)
      }

      paso = 'validar visualizaciones'
      if (video.max_vistas != null) {
        const visRes = await db(
          `visualizaciones?video_id=eq.${video_id}&alumno_id=eq.${alumno_id}&select=id`,
          { headers: { 'Prefer': 'count=exact' } },
        )
        const usadas = Array.isArray(visRes.data) ? visRes.data.length : 0
        if (usadas >= Number(video.max_vistas)) {
          return json({ error: 'Ya usaste todas las visualizaciones de este video', paso }, 400)
        }
      }

      paso = 'validar tope de compras'
      const cRes = await db(
        `extensiones_video?video_id=eq.${video_id}&alumno_id=eq.${alumno_id}&estado=eq.pagado&select=id,vence_en`,
      )
      const compras = Array.isArray(cRes.data) ? cRes.data : []
      if (compras.length >= MAX_COMPRAS) {
        return json({ error: `Ya compraste el máximo de ${MAX_COMPRAS} extensiones para este video`, paso }, 400)
      }
      const vigente = compras.find((c: any) => c.vence_en && new Date(c.vence_en) > ahora)
      if (vigente) return json({ error: 'Ya tenés una extensión activa para este video', paso }, 400)

      titulo = video.titulo
      precio = Number(video.precio_extension)
      tabla = 'extensiones_video'
      refPrefix = 'video:'
      itemTitle = `24hs extra - ${video.titulo}`.slice(0, 250)
    }

    // ─── Registrar la extensión como pendiente ───
    paso = 'crear extension pendiente'
    const filaBase: Record<string, unknown> = {
      alumno_id,
      vence_en: new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      monto: precio,
      estado: 'pendiente',
    }
    if (evaluacion_id) filaBase.evaluacion_id = evaluacion_id
    else filaBase.video_id = video_id

    const insRes = await db(tabla, {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(filaBase),
    })
    if (!insRes.ok) return json({ error: 'No se pudo registrar la compra', paso, detalle: insRes.data }, 500)
    const ext = Array.isArray(insRes.data) ? insRes.data[0] : insRes.data
    if (!ext?.id) return json({ error: 'La extensión no devolvió id', paso, detalle: insRes.data }, 500)

    // ─── Crear la preferencia en Mercado Pago ───
    paso = 'crear preferencia en Mercado Pago'
    const preference = {
      items: [{
        title: itemTitle,
        description: `Extension para ${alumno.nombre}`.slice(0, 250),
        quantity: 1,
        currency_id: 'ARS',
        unit_price: precio,
      }],
      payer: { email: alumno.email },
      external_reference: `${refPrefix}${ext.id}`,
      back_urls: {
        success: `${APP_URL}?pago=ok`,
        failure: `${APP_URL}?pago=error`,
        pending: `${APP_URL}?pago=pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const mpData = await mpRes.json()

    if (!mpRes.ok) {
      await db(`${tabla}?id=eq.${ext.id}`, { method: 'DELETE' })
      return json({ error: 'Mercado Pago rechazó la solicitud', paso, detalle: mpData }, 502)
    }

    paso = 'guardar preference_id'
    await db(`${tabla}?id=eq.${ext.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ mp_preference_id: String(mpData.id) }),
    })

    return json({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      extension_id: ext.id,
    })

  } catch (err) {
    return json({
      error: 'Error inesperado',
      paso,
      detalle: (err as Error)?.message ?? String(err),
    }, 500)
  }
})
