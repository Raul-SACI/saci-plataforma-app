-- Permite elegir a qué planes NO se les muestra la promo "Invitá a un amigo".
-- Guarda un arreglo con los nombres de plan a los que se OCULTA la promo
-- (ej: ["Cursado Completo"]). Vacío = se muestra a todos.
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists referidos_planes_ocultos jsonb default '[]'::jsonb;
