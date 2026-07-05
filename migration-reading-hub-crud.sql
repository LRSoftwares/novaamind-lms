-- Reading Hub: soft-delete (Trash) + Perspective field
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Safe to re-run: additions are IF NOT EXISTS.

ALTER TABLE reading_hub_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS perspective text;

SELECT pg_notify('pgrst', 'reload schema');
