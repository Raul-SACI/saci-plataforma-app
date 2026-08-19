-- ═══════════════════════════════════════════════════════════════════════
-- SEGURIDAD: activar RLS (Row Level Security) y bloquear el acceso público.
-- ───────────────────────────────────────────────────────────────────────
-- Problema reportado por Supabase: las tablas están "UNRESTRICTED", así que
-- cualquiera con la clave pública (que viaja en el navegador) puede leer/
-- editar/borrar todo, incluidos datos sensibles de alumnos (DNI, fotos, email).
--
-- Solución (Fase 1): activar RLS en todas las tablas y permitir el acceso SOLO
-- a usuarios LOGUEADOS (rol 'authenticated'). Se bloquea el acceso anónimo/público.
-- Como admin y alumnos usan Supabase Auth, la app sigue funcionando.
-- Las Edge Functions (facturar-arca, send-push) usan el service role, que
-- ignora RLS, así que no se ven afectadas.
--
-- ⚠️ Nota: el banner "te invitó Fulano" del link de referidos (que se lee ANTES
-- de iniciar sesión) dejará de mostrar el nombre. La referencia sigue funcionando
-- igual; solo no se ve el nombre hasta iniciar sesión. (Se puede recuperar luego
-- con una Edge Function — Fase 2).
--
-- Correr en Supabase → SQL Editor. Probar la app enseguida (ver instrucciones).
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Tablas de la app: RLS + acceso solo a usuarios logueados.
do $$
declare t text;
begin
  foreach t in array array[
    'alumnos','aulas','ci_matrices','contab_diagramas','evaluaciones',
    'extensiones_video','frag_flujos','inf_informes','likes_novedades',
    'material_items','materiales','movimientos_pago','msa_matrices','msa_piezas',
    'novedades','org_organigramas','pagos','planificacion_alumnos',
    'planificacion_docente','push_subscriptions','recordatorios','sa_cursogramas',
    'temas_materiales','temas_videos','videos','videos_alumnos',
    'visualizaciones','visualizaciones_materiales'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists app_solo_logueados on public.%I;', t);
    execute format('create policy app_solo_logueados on public.%I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- 2) arca_tokens: guarda tokens de ARCA. Solo lo usa la Edge Function (service role).
--    Se activa RLS SIN políticas → ningún cliente puede leerlo (más seguro).
alter table public.arca_tokens enable row level security;

-- ── Listo. En Supabase → Advisors/Security las alertas críticas deberían desaparecer.


-- ═══════════════════════════════════════════════════════════════════════
-- REVERSIÓN DE EMERGENCIA (solo si algo de la app dejó de andar).
-- Descomentar y correr para volver exactamente al estado anterior:
-- ═══════════════════════════════════════════════════════════════════════
-- do $$
-- declare t text;
-- begin
--   foreach t in array array[
--     'alumnos','aulas','ci_matrices','contab_diagramas','evaluaciones',
--     'extensiones_video','frag_flujos','inf_informes','likes_novedades',
--     'material_items','materiales','movimientos_pago','msa_matrices','msa_piezas',
--     'novedades','org_organigramas','pagos','planificacion_alumnos',
--     'planificacion_docente','push_subscriptions','recordatorios','sa_cursogramas',
--     'temas_materiales','temas_videos','videos','videos_alumnos',
--     'visualizaciones','visualizaciones_materiales','arca_tokens'
--   ]
--   loop
--     execute format('alter table public.%I disable row level security;', t);
--   end loop;
-- end $$;
