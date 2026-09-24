-- Permite ofrecer, en la promo de referidos, un VOUCHER (además o en lugar del
-- descuento en $). El texto del voucher es editable por el docente.
--   referidos_voucher_activo: si se ofrece el voucher en esa aula.
--   referidos_voucher_texto : descripción del voucher (ej: "un voucher en CRAFT,
--                             válido por un desayuno o merienda a elección").
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists referidos_voucher_activo boolean default false;

alter table public.aulas
  add column if not exists referidos_voucher_texto text;
