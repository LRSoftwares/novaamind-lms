-- ============================================================
-- ADD: Session Assignments + Batches (does NOT modify existing tables)
-- Run in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Batches (named groups of employees for a program)
create table if not exists batches (
  id text primary key,
  program_id text references programs(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

alter table batches enable row level security;
create policy "Authenticated users can manage batches" on batches for all to authenticated using (true) with check (true);

-- Batch Members (employees in a batch)
create table if not exists batch_members (
  id text primary key,
  batch_id text references batches(id) on delete cascade,
  emp_id text references employees(id) on delete cascade,
  created_at timestamptz default now()
);

alter table batch_members enable row level security;
create policy "Authenticated users can manage batch members" on batch_members for all to authenticated using (true) with check (true);
create unique index if not exists idx_batch_member_unique on batch_members(batch_id, emp_id);

-- Session Assignments (specific employees or batches assigned to a session)
create table if not exists session_assignments (
  id text primary key,
  session_id text references sessions(id) on delete cascade,
  emp_id text references employees(id) on delete cascade,
  batch_id text references batches(id) on delete set null,
  created_at timestamptz default now()
);

alter table session_assignments enable row level security;
create policy "Authenticated users can manage session assignments" on session_assignments for all to authenticated using (true) with check (true);
create unique index if not exists idx_session_assignment_unique on session_assignments(session_id, emp_id);
