-- Aviso de pago por aula: un recordatorio que ve CADA VEZ que entra el alumno
-- de esa aula que tiene el pago INCOMPLETO, hasta la fecha elegida (inclusive).
-- No bloquea el acceso: es solo un cartel. Se configura desde Aulas → editar aula.
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists aviso_pago text;

alter table public.aulas
  add column if not exists aviso_pago_hasta date;

-- (Opcional) Dejar activado el aviso para el aula "Tercer Parcial" hasta el 15/11/2026.
-- Revisá que el nombre coincida con el de tu aula antes de correrlo.
-- update public.aulas
--   set aviso_pago = 'Tenés un pago pendiente de esta cursada. Por favor regularizá tu situación antes de la fecha límite.',
--       aviso_pago_hasta = '2026-11-15'
--   where nombre ilike '%Tercer Parcial%';
