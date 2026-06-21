-- ============================================================
-- MIGRATION FIX: Run this to update your existing tables
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run
-- ============================================================

-- 1. Drop old company table and create new companies table
drop table if exists company cascade;

create table if not exists companies (
  id text primary key,
  name text not null,
  industry text,
  founded text,
  website text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text default 'India',
  about text,
  vision text,
  mission text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table companies enable row level security;

drop policy if exists "Authenticated users can manage companies" on companies;
create policy "Authenticated users can manage companies" on companies for all to authenticated using (true) with check (true);

-- 2. Add company_id column to employees (if missing)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'employees' and column_name = 'company_id'
  ) then
    alter table employees add column company_id text references companies(id) on delete cascade;
  end if;
end $$;
