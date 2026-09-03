-- "Premio" opcional por evaluación: un archivo (PDF con resúmenes, preguntas, etc.)
-- que se desbloquea para el alumno que COMPLETA la evaluación (prueba en la app).
-- Guarda { titulo, url, permite_descarga }.
-- Correr una vez en Supabase → SQL Editor.

alter table public.evaluaciones
  add column if not exists premio jsonb;
