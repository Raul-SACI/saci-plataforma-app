-- Historial de aulas por alumno: registra CADA aula por la que pasó un alumno,
-- para saber el total histórico de alumnos por aula aunque después se los mueva
-- (ej: total del Primer Parcial, del Segundo Parcial, etc.).
-- Correr una vez en Supabase → SQL Editor.

create table if not exists public.alumno_aulas (
  id          uuid primary key default gen_random_uuid(),
  alumno_id   uuid references public.alumnos(id) on delete cascade,
  aula_id     uuid references public.aulas(id)   on delete cascade,
  created_at  timestamptz default now(),
  unique (alumno_id, aula_id)
);

create index if not exists alumno_aulas_aula_idx on public.alumno_aulas (aula_id);

-- RLS: mismo criterio que el resto (solo usuarios logueados).
alter table public.alumno_aulas enable row level security;
drop policy if exists app_solo_logueados on public.alumno_aulas;
create policy app_solo_logueados on public.alumno_aulas
  for all to authenticated using (true) with check (true);

-- Backfill: registrar las asignaciones actuales para no perder el dato de hoy.
insert into public.alumno_aulas (alumno_id, aula_id)
  select id, aula_id from public.alumnos where aula_id is not null
  on conflict (alumno_id, aula_id) do nothing;
