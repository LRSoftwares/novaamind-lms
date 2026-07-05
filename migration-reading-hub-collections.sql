-- Reading Hub: Collections (topic groupings, many-to-many with library items)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)

CREATE TABLE IF NOT EXISTS reading_hub_collections (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  color_start text,
  color_end text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_hub_collection_items (
  id text PRIMARY KEY,
  collection_id text NOT NULL REFERENCES reading_hub_collections(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES reading_hub_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (collection_id, item_id)
);

ALTER TABLE reading_hub_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_hub_collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for reading_hub_collections" ON reading_hub_collections;
CREATE POLICY "Allow all for reading_hub_collections" ON reading_hub_collections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for reading_hub_collection_items" ON reading_hub_collection_items;
CREATE POLICY "Allow all for reading_hub_collection_items" ON reading_hub_collection_items FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON reading_hub_collections TO anon, authenticated, service_role, postgres;
GRANT ALL ON reading_hub_collection_items TO anon, authenticated, service_role, postgres;

SELECT pg_notify('pgrst', 'reload schema');
