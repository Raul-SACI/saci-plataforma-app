-- Permite habilitar a un alumno el acceso a MÁS de un aula.
-- El aula principal sigue siendo alumnos.aula_id; esta tabla guarda las aulas EXTRA
-- que el docente le habilita desde Alumnos (botón 🏫 "Aulas habilitadas").
-- En la app, el alumno con más de un aula ve un selector para cambiar de aula.
-- Correr una vez en Supabase → SQL Editor.

create table if not exists public.alumnos_aulas (
  alumno_id  uuid not null references public.alumnos(id) on delete cascade,
  aula_id    uuid not null references public.aulas(id)   on delete cascade,
  created_at timestamptz default now(),
  primary key (alumno_id, aula_id)
);

-- Misma política de acceso que el resto de las tablas de la app (solo usuarios logueados).
alter table public.alumnos_aulas enable row level security;
drop policy if exists app_solo_logueados on public.alumnos_aulas;
create policy app_solo_logueados on public.alumnos_aulas
  for all to authenticated using (true) with check (true);
