-- Reading Hub: real PDF-derived cover thumbnails for books
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)

ALTER TABLE reading_hub_items
  ADD COLUMN IF NOT EXISTS cover_image_url text;

SELECT pg_notify('pgrst', 'reload schema');
