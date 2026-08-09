-- Tabla para la herramienta "Cursogramas" (Sala de Juegos → Sistema Administrativo → Cursogramas).
-- Misma forma y flujo que org_organigramas (admin crea/publica; el alumno tiene los suyos y ve los publicados).
-- Correr una vez en Supabase → SQL Editor.

create table if not exists public.sa_cursogramas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text,
  datos       jsonb,                    -- { columnas: [...], simbolos: [...], conexiones: [...] }
  publicada   boolean default false,
  es_admin    boolean default false,
  alumno_id   uuid references public.alumnos(id) on delete cascade,
  aula_id     uuid references public.aulas(id)   on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists sa_cursogramas_aula_idx   on public.sa_cursogramas (aula_id);
create index if not exists sa_cursogramas_alumno_idx on public.sa_cursogramas (alumno_id);

-- RLS: replicá las MISMAS políticas que ya tenés en org_organigramas (mismo flujo admin/alumno/publicación).
-- Si preferís partir de una base permisiva (igual que otras tablas de la app que usan la anon key), podés usar:
alter table public.sa_cursogramas enable row level security;

drop policy if exists sa_cursogramas_all on public.sa_cursogramas;
create policy sa_cursogramas_all on public.sa_cursogramas
  for all using (true) with check (true);
