-- Add urls column to programs table (does NOT affect existing data)
-- Run in Supabase Dashboard > SQL Editor > New Query

alter table programs add column if not exists urls jsonb default '[]';
