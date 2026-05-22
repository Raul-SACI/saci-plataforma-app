import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { titulo, cuerpo } = await req.json();

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@saci.com",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (!subs?.length) {
      return new Response(JSON.stringify({ enviadas: 0, fallidas: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      titulo: titulo ?? "SACi",
      cuerpo: cuerpo ?? "Hay novedades en la plataforma",
      icono: "/icon-192.png",
      url: "/",
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      ),
    );

    // Limpiar suscripciones inválidas (expiradas o revocadas)
    const invalidEndpoints = results
      .map((r, i) => (r.status === "rejected" ? subs[i].endpoint : null))
      .filter(Boolean);
    if (invalidEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", invalidEndpoints);
    }

    const enviadas = results.filter((r) => r.status === "fulfilled").length;
    const fallidas = results.filter((r) => r.status === "rejected").length;

    return new Response(JSON.stringify({ enviadas, fallidas }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
