-- Resultado del parcial que cada alumno carga (autogestión), por aula.
-- Guarda una clave de resultado (ver RESULTADOS_PARCIAL en la app):
--   '0a3', 'aus_injust', 'aus_just', '4a5', '6mas'.
-- El docente ve el tablero (aprobados / desaprobados / ausentes / sin cargar) y
-- puede corregir el de cada alumno. Correr una vez en Supabase → SQL Editor.

create table if not exists public.resultados_parcial (
  id          uuid primary key default gen_random_uuid(),
  alumno_id   uuid references public.alumnos(id) on delete cascade,
  aula_id     uuid references public.aulas(id)   on delete cascade,
  resultado   text,
  updated_at  timestamptz default now(),
  created_at  timestamptz default now(),
  unique (alumno_id, aula_id)
);

create index if not exists resultados_parcial_aula_idx on public.resultados_parcial (aula_id);

alter table public.resultados_parcial enable row level security;
drop policy if exists app_solo_logueados on public.resultados_parcial;
create policy app_solo_logueados on public.resultados_parcial
  for all to authenticated using (true) with check (true);
