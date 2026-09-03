-- Extensión PAGA para rendir una evaluación después del vencimiento (Mercado Pago),
-- igual que las extensiones de video. Precio por evaluación + tabla de compras.
-- Correr una vez en Supabase → SQL Editor.

-- Precio para reabrir la evaluación una vez vencida (si está vacío, no se ofrece).
alter table public.evaluaciones
  add column if not exists precio_extension numeric;

create table if not exists public.evaluaciones_extensiones (
  id               uuid primary key default gen_random_uuid(),
  evaluacion_id    uuid references public.evaluaciones(id) on delete cascade,
  alumno_id        uuid references public.alumnos(id)       on delete cascade,
  vence_en         timestamptz,                 -- hasta cuándo puede rendir (24hs desde el pago)
  monto            numeric,
  estado           text default 'pendiente',    -- pendiente | pagado | rechazado
  mp_preference_id text,
  mp_payment_id    text,
  created_at       timestamptz default now()
);

create index if not exists eval_ext_eval_idx on public.evaluaciones_extensiones (evaluacion_id);
create index if not exists eval_ext_alumno_idx on public.evaluaciones_extensiones (alumno_id);

alter table public.evaluaciones_extensiones enable row level security;
drop policy if exists app_solo_logueados on public.evaluaciones_extensiones;
create policy app_solo_logueados on public.evaluaciones_extensiones
  for all to authenticated using (true) with check (true);
