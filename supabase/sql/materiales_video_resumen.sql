-- Video resumen por tema/subtema en Materiales. Guarda, por cada tema, un mapa
-- { nombre_de_subtema: id_del_video }. La clave "" (string vacío) es el video del
-- tema en general (para temas sin subtemas). Así el alumno ve el botón
-- "Ver resumen" al lado de los PDFs, sin ir a la sección Videos.
-- Correr una vez en Supabase → SQL Editor.

alter table public.temas_materiales
  add column if not exists videos_resumen jsonb default '{}'::jsonb;
