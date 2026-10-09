-- Nota obligatoria por aula: cuando se setea con un parcial, los alumnos de esa aula
-- no pueden entrar hasta cargar su nota de ese parcial (pantalla bloqueante al iniciar sesión).
-- Vacío/null = desactivado. Se edita desde Aulas → editar → "Pedir la nota de forma obligatoria".
-- Valores: 'primer' | 'segundo' | 'tercer' | 'final'.
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists nota_obligatoria text;
