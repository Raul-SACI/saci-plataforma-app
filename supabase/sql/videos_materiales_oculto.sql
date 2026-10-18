-- Permite "inhabilitar" (ocultar) un video o un material sin borrarlo:
-- cuando oculto = true, no les aparece a los alumnos, pero sigue en la lista del docente.
-- Se activa/desactiva con el botón 🚫/🙈 en Videos y en Materiales.
-- Correr una vez en Supabase → SQL Editor.

alter table public.videos
  add column if not exists oculto boolean default false;

alter table public.materiales
  add column if not exists oculto boolean default false;
