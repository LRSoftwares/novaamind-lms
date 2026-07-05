-- Thought Lab upgrade (Intellectual OS redesign)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Adds the fields the new Thought Lab board/dashboard/AI features need.
-- Safe to re-run: all additions are IF NOT EXISTS / idempotent.

ALTER TABLE thoughts
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'Idea',
  ADD COLUMN IF NOT EXISTS importance text DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS reuse_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_insights jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ai_analyzed_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_thought_id text;

-- Backfill stage from the old status column (Kanban columns: Idea/Research/Writing/Review/Ready/Published/Archived)
UPDATE thoughts SET stage = 'Writing' WHERE status = 'Draft' AND (stage IS NULL OR stage = 'Idea');
UPDATE thoughts SET stage = status WHERE status IN ('Idea', 'Review', 'Ready', 'Published', 'Archived') AND stage IS NULL;
UPDATE thoughts SET stage = 'Idea' WHERE stage IS NULL;

SELECT pg_notify('pgrst', 'reload schema');
