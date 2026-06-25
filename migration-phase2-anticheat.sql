-- Phase 2: Anti-Cheat - Add violations tracking column
-- Run this in Supabase SQL Editor (project hhcvozecelugmhbiznhf)

ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS violations jsonb DEFAULT '[]';
