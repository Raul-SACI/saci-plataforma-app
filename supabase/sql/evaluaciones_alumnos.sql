-- Permite elegir si una evaluación es para TODOS los alumnos del aula o solo
-- para algunos (como en Videos). Si para_todos = true se muestra a todos; si es
-- false, solo a los alumnos cuyo id esté en alumnos_ids.
-- Correr una vez en Supabase → SQL Editor.

alter table public.evaluaciones
  add column if not exists para_todos boolean default true;

alter table public.evaluaciones
  add column if not exists alumnos_ids jsonb default '[]'::jsonb;
