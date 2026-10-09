-- Agrega el objetivo que elige el alumno al cargar su nota: 'regularizar' o 'promocionar'.
-- (Hay alumnos que sacaron 6 o más pero igual solo quieren regularizar la materia.)
-- Correr una vez en Supabase → SQL Editor. NO vuelvas a correr resultados_parcial.sql
-- (ese borra la tabla); este solo agrega la columna sin tocar los datos existentes.

alter table public.resultados_parcial
  add column if not exists objetivo text;
