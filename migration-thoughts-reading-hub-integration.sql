-- Thought Lab: source-tracking fields on `thoughts`, so Reading Hub captures
-- and Thought Lab's own captures are the SAME kind of row (no duplicate DBs).
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Safe to re-run: additions are IF NOT EXISTS; backfill uses ON CONFLICT DO NOTHING.
-- reading_hub_ideas / reading_hub_perspectives are left in place, untouched, as a backup.

ALTER TABLE thoughts
  ADD COLUMN IF NOT EXISTS origin_type text DEFAULT 'own_thought',
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_title text,
  ADD COLUMN IF NOT EXISTS source_author text,
  ADD COLUMN IF NOT EXISTS source_chapter text,
  ADD COLUMN IF NOT EXISTS source_page text,
  ADD COLUMN IF NOT EXISTS source_location text,
  ADD COLUMN IF NOT EXISTS original_highlight text,
  ADD COLUMN IF NOT EXISTS my_interpretation text,
  ADD COLUMN IF NOT EXISTS my_perspective text,
  ADD COLUMN IF NOT EXISTS why_it_matters text,
  ADD COLUMN IF NOT EXISTS thought_subtype text DEFAULT 'thought',
  ADD COLUMN IF NOT EXISTS potential_uses text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS development_status text DEFAULT 'captured',
  ADD COLUMN IF NOT EXISTS last_referenced_at timestamptz,
  ADD COLUMN IF NOT EXISTS reference_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reuse_count integer DEFAULT 0;

-- Backfill: migrate existing Reading Hub ideas into thoughts.
INSERT INTO thoughts (
  id, title, content_text, category, stage, importance, tags,
  origin_type, source_id, source_type, source_title, source_author,
  source_chapter, original_highlight, thought_subtype, development_status,
  created_at, updated_at
)
SELECT
  'TH' || i.id, i.title, COALESCE(i.quote, i.title), 'Book Idea', 'Idea', 'Medium',
  ARRAY(SELECT jsonb_array_elements_text(COALESCE(i.tags, '[]'::jsonb))),
  'book', i.item_id, 'book', ri.title, ri.author, i.chapter, i.quote,
  'idea', 'captured', i.created_at, i.created_at
FROM reading_hub_ideas i JOIN reading_hub_items ri ON ri.id = i.item_id
ON CONFLICT (id) DO NOTHING;

-- Backfill: migrate existing Reading Hub perspectives into thoughts.
INSERT INTO thoughts (
  id, title, content_text, category, stage, importance,
  origin_type, source_id, source_type, source_title, source_author,
  my_perspective, thought_subtype, development_status, created_at, updated_at
)
SELECT
  'TH' || p.id, 'Perspective on ' || ri.title, p.content, 'Book Idea', 'Idea', 'Medium',
  'book', p.item_id, 'book', ri.title, ri.author,
  p.content, 'perspective', 'captured', p.created_at, p.created_at
FROM reading_hub_perspectives p JOIN reading_hub_items ri ON ri.id = p.item_id
ON CONFLICT (id) DO NOTHING;

SELECT pg_notify('pgrst', 'reload schema');
