-- Orden manual de los subtemas dentro de cada tema de Materiales.
-- Guarda un arreglo con los nombres de subtema en el orden elegido por el admin
-- (ej: ["Compras y Almacenes", "Guía de Estudio", ...]). Los subtemas que no
-- estén en la lista se ordenan alfabético/numérico como antes.
-- Correr una vez en Supabase → SQL Editor.

alter table public.temas_materiales
  add column if not exists orden_subtemas jsonb default '[]'::jsonb;
