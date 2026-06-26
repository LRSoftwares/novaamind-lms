-- Add program_type column to programs table
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)

ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_type text DEFAULT '';
SELECT pg_notify('pgrst', 'reload schema');
