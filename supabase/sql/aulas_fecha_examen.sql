-- Fecha del examen de cada aula. Habilita el "Camino al examen" (cuenta
-- regresiva con el mate 🧉) arriba de Planificación, para el admin y los alumnos.
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists fecha_examen date;
