-- Contrato editable por aula + firma del contrato por aula (re-firma por parcial).
-- El alumno firma el contrato de CADA aula a la que pertenece (sin volver a subir fotos).
-- Correr TODO junto una vez en Supabase → SQL Editor.

-- 1) Texto del contrato por aula (si queda null/vacío, se usa el contrato por defecto de la app).
alter table public.aulas
  add column if not exists contrato text;

-- 2) Firmas del contrato, una por (alumno, aula). Guarda el texto exacto firmado y la fecha.
create table if not exists public.firmas_contrato (
  id          uuid primary key default gen_random_uuid(),
  alumno_id   uuid references public.alumnos(id) on delete cascade,
  aula_id     uuid references public.aulas(id)   on delete cascade,
  texto       text,
  fecha       timestamptz default now(),
  created_at  timestamptz default now(),
  unique (alumno_id, aula_id)
);

create index if not exists firmas_contrato_alumno_idx on public.firmas_contrato (alumno_id);

alter table public.firmas_contrato enable row level security;
drop policy if exists app_solo_logueados on public.firmas_contrato;
create policy app_solo_logueados on public.firmas_contrato
  for all to authenticated using (true) with check (true);

-- 3) Backfill: los alumnos que YA aceptaron el contrato al inscribirse quedan como firmantes
--    de su aula ACTUAL, para no volver a pedirles la firma donde ya están. (Importante correrlo.)
insert into public.firmas_contrato (alumno_id, aula_id, texto, fecha)
select a.id, a.aula_id, coalesce(a.tyc_texto, ''), coalesce(a.tyc_fecha, now())
from public.alumnos a
where a.aula_id is not null and a.tyc_aceptado = true
on conflict (alumno_id, aula_id) do nothing;
