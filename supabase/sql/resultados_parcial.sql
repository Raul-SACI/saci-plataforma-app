-- Nota que cada alumno carga por PARCIAL (no por aula): Primer/Segundo/Tercer Parcial
-- o Examen Final. Guarda la nota puntual; la situación (desaprobado/aprobado/ausente)
-- la calcula la app. Correr una vez en Supabase → SQL Editor.
-- (La tabla es nueva; si ya la habías creado, este bloque la reemplaza sin datos útiles.)

drop table if exists public.resultados_parcial cascade;

create table public.resultados_parcial (
  id          uuid primary key default gen_random_uuid(),
  alumno_id   uuid references public.alumnos(id) on delete cascade,
  aula_id     uuid references public.aulas(id)   on delete set null,  -- referencia (aula donde lo cargó)
  parcial     text not null,   -- 'primer' | 'segundo' | 'tercer' | 'final'
  nota        text,            -- 'no_rindio' | 'no_rindio_just' | '0'..'10'
  updated_at  timestamptz default now(),
  created_at  timestamptz default now(),
  unique (alumno_id, parcial)
);

create index if not exists resultados_parcial_parcial_idx on public.resultados_parcial (parcial);
create index if not exists resultados_parcial_alumno_idx  on public.resultados_parcial (alumno_id);

alter table public.resultados_parcial enable row level security;
drop policy if exists app_solo_logueados on public.resultados_parcial;
create policy app_solo_logueados on public.resultados_parcial
  for all to authenticated using (true) with check (true);
