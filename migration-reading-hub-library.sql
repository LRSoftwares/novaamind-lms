-- Reading Hub: library item model (My Library + Book Detail)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Supersedes the flat reading_hub_files table for app purposes (left in place, untouched,
-- as a historical record — its 3 rows are migrated into reading_hub_items below).

CREATE TABLE IF NOT EXISTS reading_hub_items (
  id text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'document' CHECK (kind IN ('book', 'document')),
  title text NOT NULL,
  author text,
  category text,                        -- Books / Reports / Research Papers / Whitepapers
  status text,                          -- want-to-read / currently-reading / completed / paused / reference
  progress integer,                     -- 0-100, reading progress for books
  idea_count integer DEFAULT 0,
  cover_start text,                     -- placeholder cover gradient, start hex
  cover_end text,                       -- placeholder cover gradient, end hex
  file_type text,                       -- PDF / DOCX, for document cards
  file_size text,                       -- display string, e.g. "4.2 MB"
  chips jsonb DEFAULT '[]',             -- document tag chips, e.g. ["WHITEPAPER", "URGENT"]
  finished_at date,
  rating integer,
  badge text,                           -- Book Detail status chip, e.g. "In Progress"
  tag text,                             -- Book Detail category chip, e.g. "Leadership"
  about text,
  why_reading text,
  summary_core_theme text,
  summary_key_takeaway text,
  summary_application text,
  storage_path text,                    -- public URL of the uploaded file, if any
  mime_type text,
  size bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_hub_ideas (
  id text PRIMARY KEY,
  item_id text NOT NULL REFERENCES reading_hub_items(id) ON DELETE CASCADE,
  chapter text,
  title text,
  quote text,
  tags jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_hub_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_hub_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for reading_hub_items" ON reading_hub_items;
CREATE POLICY "Allow all for reading_hub_items" ON reading_hub_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for reading_hub_ideas" ON reading_hub_ideas;
CREATE POLICY "Allow all for reading_hub_ideas" ON reading_hub_ideas FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON reading_hub_items TO anon, authenticated, service_role, postgres;
GRANT ALL ON reading_hub_ideas TO anon, authenticated, service_role, postgres;

-- Migrate the 3 files already uploaded through the old flat-file Reading Hub.
INSERT INTO reading_hub_items (id, kind, title, author, category, status, cover_start, cover_end, file_type, file_size, storage_path, mime_type, size, created_at)
SELECT
  'LI' || f.id,
  'book',
  'Corporate Chanakya',
  'Radhakrishnan Pillai',
  'Books',
  'want-to-read',
  '#0f2545', '#0058be',
  f.file_type,
  round(f.size / 1024.0 / 1024.0, 1) || ' MB',
  f.storage_path,
  f.mime_type,
  f.size,
  f.created_at
FROM reading_hub_files f
WHERE f.id = 'RH1783228127540bn'
ON CONFLICT (id) DO NOTHING;

INSERT INTO reading_hub_items (id, kind, title, author, category, status, cover_start, cover_end, file_type, file_size, storage_path, mime_type, size, created_at)
SELECT
  'LI' || f.id,
  'book',
  'Chanakya in Real Life',
  'Radhakrishnan Pillai',
  'Books',
  'want-to-read',
  '#2a1a45', '#6a3fb5',
  f.file_type,
  round(f.size / 1024.0 / 1024.0, 1) || ' MB',
  f.storage_path,
  f.mime_type,
  f.size,
  f.created_at
FROM reading_hub_files f
WHERE f.id = 'RH1783228168605za'
ON CONFLICT (id) DO NOTHING;

INSERT INTO reading_hub_items (id, kind, title, author, category, chips, file_type, file_size, storage_path, mime_type, size, created_at)
SELECT
  'LI' || f.id,
  'document',
  'NDIS - Why We Need to Build This',
  NULL,
  'Reports',
  '["REPORT"]'::jsonb,
  f.file_type,
  round(f.size / 1024.0 / 1024.0, 1) || ' MB',
  f.storage_path,
  f.mime_type,
  f.size,
  f.created_at
FROM reading_hub_files f
WHERE f.id = 'RH1783049052871b1'
ON CONFLICT (id) DO NOTHING;

SELECT pg_notify('pgrst', 'reload schema');
