-- Aviso por aula: un cartel que se le muestra a los alumnos de esa aula cada vez
-- que entran (una vez por sesión). Vacío/null = no se muestra nada.
-- Se edita desde Aulas → editar → "Aviso para los alumnos".
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists aviso text;

-- (Opcional) Cargar el aviso para el aula del Primer Parcial 2026:
-- update public.aulas
--   set aviso = 'El acceso a esta aula se termina el día Domingo 27/09 a las 23:59 hs.'
--   where nombre ilike '%primer parcial 2026%';
