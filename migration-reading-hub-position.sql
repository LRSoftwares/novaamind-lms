-- Reading Hub: per-book reading position (EPUB only — see note below)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Safe to re-run: additions are IF NOT EXISTS.
--
-- PDFs render via the browser's native <iframe> viewer, which exposes no
-- JavaScript API to read its current page/scroll state, so automatic position
-- tracking isn't possible for them without replacing that viewer entirely
-- (deferred, separate decision). These columns are populated for EPUB books
-- only; they stay null for PDFs and documents.

ALTER TABLE reading_hub_items
  ADD COLUMN IF NOT EXISTS reading_cfi text,          -- epub.js CFI: the exact resume position
  ADD COLUMN IF NOT EXISTS reading_location integer,   -- 1-indexed virtual "page" within epub.js locations
  ADD COLUMN IF NOT EXISTS total_locations integer,    -- total virtual "pages", from epub.js locations
  ADD COLUMN IF NOT EXISTS epub_locations text,        -- cached book.locations.save() JSON, avoids regenerating every open
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_saved_at timestamptz;

SELECT pg_notify('pgrst', 'reload schema');
