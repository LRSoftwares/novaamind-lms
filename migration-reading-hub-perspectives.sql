-- Reading Hub: multiple perspectives per book (replaces the single perspective text field)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)

CREATE TABLE IF NOT EXISTS reading_hub_perspectives (
  id text PRIMARY KEY,
  item_id text NOT NULL REFERENCES reading_hub_items(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_hub_perspectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for reading_hub_perspectives" ON reading_hub_perspectives;
CREATE POLICY "Allow all for reading_hub_perspectives" ON reading_hub_perspectives FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON reading_hub_perspectives TO anon, authenticated, service_role, postgres;

-- Carry over any existing single-field perspective text as that book's first entry.
INSERT INTO reading_hub_perspectives (id, item_id, content, created_at)
SELECT 'RHP' || id, id, perspective, updated_at
FROM reading_hub_items
WHERE perspective IS NOT NULL AND trim(perspective) <> ''
ON CONFLICT (id) DO NOTHING;

SELECT pg_notify('pgrst', 'reload schema');
