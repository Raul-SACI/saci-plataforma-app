// Edge Function: webhook-mercadopago
// Mercado Pago llama acá cuando cambia el estado de un pago.
// IMPORTANTE: no confiamos en el contenido de la notificación. Le preguntamos a Mercado Pago
// directamente por el pago (con nuestro token) y recién si está "approved" habilitamos el acceso.
// external_reference identifica la extensión y su tabla mediante prefijo:
//   "video:<id>" → extensiones_video   |   "eval:<id>" → evaluaciones_extensiones
//   (sin prefijo → extensiones_video, para los pagos viejos ya en curso.)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

// A partir del external_reference decide tabla e id de la extensión.
function resolverRef(ref: string): { tabla: string; id: string } {
  if (ref.startsWith('eval:')) return { tabla: 'evaluaciones_extensiones', id: ref.slice(5) }
  if (ref.startsWith('video:')) return { tabla: 'extensiones_video', id: ref.slice(6) }
  return { tabla: 'extensiones_video', id: ref } // pagos viejos (sin prefijo)
}

Deno.serve(async (req) => {
  try {
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    if (!MP_ACCESS_TOKEN) {
      console.error('Falta MP_ACCESS_TOKEN')
      return new Response('config error', { status: 500 })
    }

    const url = new URL(req.url)
    let tipo = url.searchParams.get('type') || url.searchParams.get('topic')
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id')

    if (!paymentId) {
      try {
        const body = await req.json()
        tipo = tipo || body?.type || body?.topic
        paymentId = body?.data?.id || body?.id
      } catch {
        // body vacío o no-JSON
      }
    }

    console.log('Webhook recibido:', { tipo, paymentId })

    if (tipo && tipo !== 'payment') return new Response('ignorado', { status: 200 })
    if (!paymentId) return new Response('sin payment id', { status: 200 })

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!mpRes.ok) {
      console.error('No se pudo consultar el pago', paymentId, await mpRes.text())
      return new Response('pago no consultable', { status: 200 })
    }

    const pago = await mpRes.json()
    const ref = pago.external_reference // "video:<id>", "eval:<id>" o "<id>" (viejo)
    console.log('Estado del pago:', pago.status, 'ref:', ref)

    if (!ref) {
      console.error('Pago sin external_reference', paymentId)
      return new Response('sin referencia', { status: 200 })
    }

    const { tabla, id: extensionId } = resolverRef(String(ref))

    if (pago.status === 'approved') {
      const vence = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      // estado=eq.pendiente evita procesar dos veces la misma notificación.
      const upd = await db(`${tabla}?id=eq.${extensionId}&estado=eq.pendiente`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: 'pagado',
          vence_en: vence,
          mp_payment_id: String(paymentId),
        }),
      })
      if (!upd.ok) console.error('Error al habilitar la extensión', upd.data)
      else console.log('Extensión habilitada', tabla, extensionId, 'hasta', vence)

    } else if (['rejected', 'cancelled'].includes(pago.status)) {
      await db(`${tabla}?id=eq.${extensionId}&estado=eq.pendiente`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: 'rechazado',
          mp_payment_id: String(paymentId),
        }),
      })
      console.log('Pago rechazado', tabla, extensionId, pago.status)
    }
    // Otros estados (in_process, pending): se dejan pendientes. MP volverá a avisar.

    return new Response('ok', { status: 200 })

  } catch (err) {
    console.error('Error en webhook:', err)
    return new Response('error manejado', { status: 200 })
  }
})
