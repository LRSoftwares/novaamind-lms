-- Thought Repository Tables
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)

CREATE TABLE IF NOT EXISTS thoughts (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT 'Untitled',
  slug text,
  content jsonb DEFAULT '{}',
  content_text text DEFAULT '',
  category text DEFAULT 'Quick Thought',
  pillar text DEFAULT '',
  status text DEFAULT 'Idea',
  audience text DEFAULT '',
  tags text[] DEFAULT '{}',
  cover_image text DEFAULT '',
  is_pinned boolean DEFAULT false,
  is_favourite boolean DEFAULT false,
  reading_time integer DEFAULT 0,
  ai_generated boolean DEFAULT false,
  published_at timestamptz,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS thought_collections (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS thought_collection_items (
  thought_id text REFERENCES thoughts(id) ON DELETE CASCADE,
  collection_id text REFERENCES thought_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (thought_id, collection_id)
);

-- RLS
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE thought_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE thought_collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for thoughts" ON thoughts;
DROP POLICY IF EXISTS "Allow all for thought_collections" ON thought_collections;
DROP POLICY IF EXISTS "Allow all for thought_collection_items" ON thought_collection_items;

CREATE POLICY "Allow all for thoughts" ON thoughts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for thought_collections" ON thought_collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for thought_collection_items" ON thought_collection_items FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON thoughts TO anon, authenticated, service_role, postgres;
GRANT ALL ON thought_collections TO anon, authenticated, service_role, postgres;
GRANT ALL ON thought_collection_items TO anon, authenticated, service_role, postgres;

SELECT pg_notify('pgrst', 'reload schema');
