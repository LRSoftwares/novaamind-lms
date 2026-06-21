-- ============================================================
-- Novaamind LMS - Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'admin' check (role in ('admin', 'trainer', 'hr')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Allow insert during signup" on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'admin');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Companies (supports multiple)
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
create policy "Authenticated users can manage companies" on companies for all to authenticated using (true) with check (true);

-- 3. Employees (belong to a company)
create table if not exists employees (
  id text primary key,
  company_id text references companies(id) on delete cascade,
  name text not null,
  department text,
  designation text,
  site_location text,
  email text,
  gender text,
  hire_date text,
  status text default 'Active',
  created_at timestamptz default now()
);

alter table employees enable row level security;
create policy "Authenticated users can manage employees" on employees for all to authenticated using (true) with check (true);

-- 4. Trainers
create table if not exists trainers (
  id text primary key,
  name text not null,
  email text,
  department text,
  expertise text[] default '{}',
  max_sessions_per_month integer default 10,
  preferred_session_type text default 'Mixed',
  status text default 'Active',
  created_at timestamptz default now()
);

alter table trainers enable row level security;
create policy "Authenticated users can manage trainers" on trainers for all to authenticated using (true) with check (true);

-- 5. Programs
create table if not exists programs (
  id text primary key,
  name text not null,
  short_code text,
  description text,
  department_target text[] default '{}',
  sessions_required integer default 3,
  pass_score_threshold integer default 70,
  start_date text,
  end_date text,
  status text default 'Active',
  trainer_id text references trainers(id) on delete set null,
  co_trainer_id text references trainers(id) on delete set null,
  summary text,
  learning_outcomes text[] default '{}',
  created_at timestamptz default now()
);

alter table programs enable row level security;
create policy "Authenticated users can manage programs" on programs for all to authenticated using (true) with check (true);

-- 6. Sessions
create table if not exists sessions (
  id text primary key,
  program_id text references programs(id) on delete cascade,
  session_date text,
  start_time text,
  end_time text,
  session_type text default 'In-Person',
  venue text,
  zoom_link text,
  material_link text,
  capacity integer default 30,
  trainer_id text references trainers(id) on delete set null,
  co_trainer_id text references trainers(id) on delete set null,
  status text default 'Scheduled',
  created_at timestamptz default now()
);

alter table sessions enable row level security;
create policy "Authenticated users can manage sessions" on sessions for all to authenticated using (true) with check (true);

-- 7. Enrolments
create table if not exists enrolments (
  id text primary key,
  emp_id text references employees(id) on delete cascade,
  program_id text references programs(id) on delete cascade,
  enrol_date text,
  status text default 'Not Started',
  sessions_attended integer default 0,
  avg_score numeric default 0,
  created_at timestamptz default now()
);

alter table enrolments enable row level security;
create policy "Authenticated users can manage enrolments" on enrolments for all to authenticated using (true) with check (true);

-- 8. Program Files
create table if not exists program_files (
  id text primary key,
  program_id text references programs(id) on delete cascade,
  name text not null,
  size integer,
  type text,
  storage_path text,
  uploaded_at timestamptz default now()
);

alter table program_files enable row level security;
create policy "Authenticated users can manage program files" on program_files for all to authenticated using (true) with check (true);

-- 9. Employee Scores
create table if not exists employee_scores (
  id text primary key,
  emp_id text references employees(id) on delete cascade,
  category text,
  score numeric,
  notes text,
  date text,
  created_at timestamptz default now()
);

alter table employee_scores enable row level security;
create policy "Authenticated users can manage scores" on employee_scores for all to authenticated using (true) with check (true);

-- 10. Integration Settings
create table if not exists integration_settings (
  id text primary key,
  provider text not null,
  config jsonb default '{}',
  enabled boolean default false,
  updated_at timestamptz default now()
);

alter table integration_settings enable row level security;
create policy "Authenticated users can manage integrations" on integration_settings for all to authenticated using (true) with check (true);

-- Seed default integration rows
insert into integration_settings (id, provider, config, enabled) values
  ('whatsapp', 'whatsapp', '{"accountSid":"","authToken":"","fromNumber":""}', false),
  ('email', 'email', '{"apiKey":"","fromEmail":"","fromName":"Novaamind LMS"}', false),
  ('calendar', 'calendar', '{"provider":"microsoft","clientId":"","tenantId":""}', false)
on conflict (id) do nothing;

-- 11. Notification Logs
create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  recipient text,
  subject text,
  body text,
  status text default 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz default now()
);

alter table notification_logs enable row level security;
create policy "Authenticated users can manage notifications" on notification_logs for all to authenticated using (true) with check (true);

-- 12. Storage bucket for program files
insert into storage.buckets (id, name, public)
values ('program-files', 'program-files', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload files" on storage.objects
  for insert to authenticated with check (bucket_id = 'program-files');
create policy "Anyone can read files" on storage.objects
  for select using (bucket_id = 'program-files');
create policy "Authenticated users can delete files" on storage.objects
  for delete to authenticated using (bucket_id = 'program-files');
