-- Reading Hub (Thought Lab): file repository table
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Reuses the existing "program-files" storage bucket under a reading-hub/ prefix.

CREATE TABLE IF NOT EXISTS reading_hub_files (
  id text PRIMARY KEY,
  name text NOT NULL,
  file_type text DEFAULT 'Document',   -- PDF / Image / Audio / Video / Document
  mime_type text DEFAULT '',
  size bigint DEFAULT 0,
  storage_path text NOT NULL,          -- public URL
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_hub_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for reading_hub_files" ON reading_hub_files;
CREATE POLICY "Allow all for reading_hub_files" ON reading_hub_files FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON reading_hub_files TO anon, authenticated, service_role, postgres;

SELECT pg_notify('pgrst', 'reload schema');
