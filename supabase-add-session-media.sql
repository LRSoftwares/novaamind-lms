-- ADD: Session Photos + Assignment Submissions (does NOT modify existing tables)
-- Run in Supabase Dashboard > SQL Editor > New Query

-- Session Photos (images uploaded for a session)
create table if not exists session_photos (
  id text primary key,
  session_id text references sessions(id) on delete cascade,
  name text,
  storage_path text,
  uploaded_at timestamptz default now()
);

alter table session_photos enable row level security;
create policy "Authenticated users can manage session photos" on session_photos for all to authenticated using (true) with check (true);

-- Assignment Submissions (links/files shared by attendees)
create table if not exists session_submissions (
  id text primary key,
  session_id text references sessions(id) on delete cascade,
  emp_id text references employees(id) on delete cascade,
  title text,
  url text,
  notes text,
  created_at timestamptz default now()
);

alter table session_submissions enable row level security;
create policy "Authenticated users can manage submissions" on session_submissions for all to authenticated using (true) with check (true);
