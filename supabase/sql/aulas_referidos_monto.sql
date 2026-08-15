-- Monto fijo (en $) del descuento por cada amigo referido que se inscribe y paga.
-- Reemplaza el cálculo anterior por porcentaje. Se configura en Novedades (admin).
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists referidos_monto numeric default 0;
