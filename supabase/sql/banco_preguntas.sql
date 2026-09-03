-- Banco de preguntas reutilizable para Evaluaciones. Guarda preguntas de opción
-- múltiple (con su tema/bloque) que después se pueden elegir para armar cualquier
-- evaluación. Es GLOBAL (no atado a un aula): sirve para todas las aulas de la
-- misma materia. Correr una vez en Supabase → SQL Editor.

create table if not exists public.banco_preguntas (
  id          uuid primary key default gen_random_uuid(),
  tema        text,
  texto       text not null,
  opciones    jsonb default '[]'::jsonb,   -- ["opción A", "opción B", ...]
  correctas   jsonb default '[]'::jsonb,   -- [índices (base 0) de las correctas]
  created_at  timestamptz default now()
);

create index if not exists banco_preguntas_tema_idx on public.banco_preguntas (tema);

alter table public.banco_preguntas enable row level security;
drop policy if exists app_solo_logueados on public.banco_preguntas;
create policy app_solo_logueados on public.banco_preguntas
  for all to authenticated using (true) with check (true);
