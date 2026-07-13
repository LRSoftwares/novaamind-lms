-- NDA Generator (Company OS -> Legal Systems -> NDA)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- Adds structured wizard data alongside the existing rich-text `content` column
-- on legal_documents, so the guided NDA form's raw inputs are preserved and
-- can be re-edited without re-parsing the generated document.

ALTER TABLE legal_documents ADD COLUMN IF NOT EXISTS structured_data jsonb;

SELECT pg_notify('pgrst', 'reload schema');
