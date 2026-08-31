-- Evaluaciones nativas (quiz multiple choice dentro de la app).
-- Permite crear pruebas de opción múltiple (una o varias correctas), que el
-- alumno responde adentro de la app, se auto-corrigen y muestran la nota.
-- Se puede seguir usando el link de Google Forms (tipo = 'link').
-- Correr una vez en Supabase → SQL Editor.

-- 1) Tipo de evaluación y preguntas embebidas.
--    tipo: 'link'  → link de Google Forms (comportamiento anterior)
--          'quiz'  → prueba nativa dentro de la app
alter table public.evaluaciones
  add column if not exists tipo text default 'link';

-- preguntas: jsonb con la forma
--   [{ "texto": "¿...?", "opciones": ["A","B","C"], "correctas": [0,2] }]
--   correctas = índices (base 0) de las opciones correctas.
alter table public.evaluaciones
  add column if not exists preguntas jsonb default '[]'::jsonb;

-- 2) Respuestas de los alumnos (un solo intento por alumno y evaluación).
create table if not exists public.evaluaciones_respuestas (
  id             uuid primary key default gen_random_uuid(),
  evaluacion_id  uuid   references public.evaluaciones(id)     on delete cascade,
  alumno_id      uuid   references public.alumnos(id)       on delete cascade,
  respuestas     jsonb  default '[]'::jsonb,   -- [[0], [1,2], ...] índices elegidos por pregunta
  nota           numeric,                       -- 0 a 10
  correctas_cant integer,                       -- preguntas respondidas bien
  total_cant     integer,                       -- total de preguntas
  created_at     timestamptz default now(),
  unique (evaluacion_id, alumno_id)
);

create index if not exists eval_resp_eval_idx on public.evaluaciones_respuestas (evaluacion_id);
create index if not exists eval_resp_alumno_idx on public.evaluaciones_respuestas (alumno_id);

-- RLS: mismo criterio que el resto (solo usuarios logueados).
alter table public.evaluaciones_respuestas enable row level security;
drop policy if exists app_solo_logueados on public.evaluaciones_respuestas;
create policy app_solo_logueados on public.evaluaciones_respuestas
  for all to authenticated using (true) with check (true);
