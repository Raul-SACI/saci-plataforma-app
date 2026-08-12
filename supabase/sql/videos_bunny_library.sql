-- Guarda de qué biblioteca ("repositorio") de Bunny es cada video, para poder
-- usar varias bibliotecas. Los videos ya cargados quedan como de la biblioteca
-- principal (645418) por defecto. Correr una vez en Supabase → SQL Editor.

alter table public.videos
  add column if not exists bunny_library text;
