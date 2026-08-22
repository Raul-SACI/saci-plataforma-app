-- Liga cada pago a su aula. Antes los pagos iban por alumno y "seguían" al
-- alumno si lo movías de aula. Con esto, cada aula cuenta solo sus pagos.
-- Correr una vez en Supabase → SQL Editor.

alter table public.pagos
  add column if not exists aula_id uuid references public.aulas(id);

create index if not exists pagos_aula_idx on public.pagos (aula_id);

-- Backfill: asignar a cada pago el aula ACTUAL de su alumno.
-- OJO: para alumnos que ya moviste de aula (ej: alguien que pagó el Final y hoy
-- está en el Parcial), el pago va a quedar en su aula actual y hay que corregirlo
-- a mano desde Pagos → editar el pago → "Aula de este pago".
update public.pagos p
  set aula_id = a.aula_id
  from public.alumnos a
  where p.alumno_id = a.id and p.aula_id is null and a.aula_id is not null;
