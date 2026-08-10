-- Controla si la promo "🎁 Invitá a un amigo y ganás" se muestra a los alumnos de un aula.
-- Por defecto queda OCULTA (false); el admin la activa desde Novedades cuando quiere.
-- Correr una vez en Supabase → SQL Editor.

alter table public.aulas
  add column if not exists referidos_activo boolean default false;
