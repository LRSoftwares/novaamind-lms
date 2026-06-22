-- ============================================================
-- ADD: Session Notes + Attendance tables
-- Run in Supabase Dashboard > SQL Editor > New Query
-- Does NOT modify existing tables
-- ============================================================

-- Session Notes (detailed notes per session)
create table if not exists session_notes (
  id text primary key,
  session_id text references sessions(id) on delete cascade,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table session_notes enable row level security;
create policy "Authenticated users can manage session notes" on session_notes for all to authenticated using (true) with check (true);

-- Session Attendance (per employee per session)
create table if not exists session_attendance (
  id text primary key,
  session_id text references sessions(id) on delete cascade,
  emp_id text references employees(id) on delete cascade,
  status text default 'Present' check (status in ('Present', 'Absent', 'Excused', 'Late')),
  check_in_time text,
  check_out_time text,
  notes text,
  created_at timestamptz default now()
);

alter table session_attendance enable row level security;
create policy "Authenticated users can manage attendance" on session_attendance for all to authenticated using (true) with check (true);

-- Prevent duplicate attendance records per session+employee
create unique index if not exists idx_attendance_session_emp on session_attendance(session_id, emp_id);
