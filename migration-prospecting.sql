-- NovaaMind Prospecting: Augmented Prospect Research Workbench (Phase 1)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Human-augmented workflow: add prospect -> generate research prompt -> paste into
-- external LLM -> upload structured .md research back -> review intelligence cards ->
-- human decides Academy / Strategy / Both / Not a Fit / Needs More Research.

CREATE TABLE IF NOT EXISTS prospects (
  id text PRIMARY KEY,
  name text NOT NULL,
  company text DEFAULT '',
  role text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT '',
  industry text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  known_context text DEFAULT '',
  aspirations text DEFAULT '',
  source_community text DEFAULT '',
  internal_notes text DEFAULT '',

  linkedin_url text DEFAULT '',
  company_website text DEFAULT '',
  personal_website text DEFAULT '',
  x_url text DEFAULT '',
  youtube_url text DEFAULT '',
  instagram_url text DEFAULT '',
  facebook_url text DEFAULT '',
  github_url text DEFAULT '',
  medium_url text DEFAULT '',
  substack_url text DEFAULT '',
  scholar_url text DEFAULT '',
  orcid_url text DEFAULT '',
  other_url text DEFAULT '',

  original_import_data jsonb,             -- unmapped Excel columns, preserved verbatim
  research jsonb,                          -- parsed structured research (cards data)

  research_status text DEFAULT 'Not Started',  -- Not Started / Prompt Generated / Sent for Research / Uploaded / Needs Review / Reviewed
  decision_status text DEFAULT 'Not Reviewed', -- Not Reviewed / Academy / Strategy / Both / Not a Fit / Needs More Research
  decision_notes text DEFAULT '',
  decided_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for prospects" ON prospects;
CREATE POLICY "Allow all for prospects" ON prospects FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON prospects TO anon, authenticated, service_role, postgres;

SELECT pg_notify('pgrst', 'reload schema');
