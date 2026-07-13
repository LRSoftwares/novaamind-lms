-- Worksheets Module Tables
-- Run this in Supabase SQL Editor

create table if not exists worksheets (
  id text primary key,
  program_id text,
  title text not null,
  description text default '',
  instructions text default '',
  status text default 'Draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists worksheet_questions (
  id text primary key,
  worksheet_id text not null references worksheets(id) on delete cascade,
  sort_order integer default 0,
  question_type text not null,
  question_text text not null,
  options jsonb default '[]',
  required boolean default true,
  created_at timestamptz default now()
);

create table if not exists worksheet_candidates (
  id text primary key,
  worksheet_id text not null references worksheets(id) on delete cascade,
  name text not null,
  email text not null,
  phone text default '',
  company text default '',
  registered_at timestamptz default now()
);

create table if not exists worksheet_submissions (
  id text primary key,
  worksheet_id text not null references worksheets(id) on delete cascade,
  candidate_id text not null references worksheet_candidates(id) on delete cascade,
  status text default 'InProgress',
  started_at timestamptz default now(),
  submitted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists worksheet_responses (
  id text primary key,
  submission_id text not null references worksheet_submissions(id) on delete cascade,
  question_id text not null references worksheet_questions(id) on delete cascade,
  answer jsonb,
  created_at timestamptz default now()
);

create table if not exists worksheet_links (
  id text primary key,
  worksheet_id text not null references worksheets(id) on delete cascade,
  slug text not null unique,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_wq_worksheet on worksheet_questions(worksheet_id);
create index if not exists idx_wc_worksheet on worksheet_candidates(worksheet_id);
create index if not exists idx_wc_email on worksheet_candidates(worksheet_id, email);
create index if not exists idx_ws_worksheet on worksheet_submissions(worksheet_id);
create index if not exists idx_ws_candidate on worksheet_submissions(candidate_id);
create index if not exists idx_wr_submission on worksheet_responses(submission_id);
create index if not exists idx_wl_slug on worksheet_links(slug);

-- RLS Policies

alter table worksheets enable row level security;
create policy "Public read published" on worksheets for select using (status = 'Published');
create policy "Admin full access" on worksheets for all using (auth.role() = 'authenticated');

alter table worksheet_questions enable row level security;
create policy "Public read published questions" on worksheet_questions for select
  using (exists (select 1 from worksheets where worksheets.id = worksheet_questions.worksheet_id and worksheets.status = 'Published'));
create policy "Admin full access questions" on worksheet_questions for all using (auth.role() = 'authenticated');

alter table worksheet_candidates enable row level security;
create policy "Anon insert candidates" on worksheet_candidates for insert with check (true);
create policy "Anon read candidates" on worksheet_candidates for select using (true);
create policy "Anon update candidates" on worksheet_candidates for update using (true);
create policy "Admin full access candidates" on worksheet_candidates for all using (auth.role() = 'authenticated');

alter table worksheet_submissions enable row level security;
create policy "Anon insert submissions" on worksheet_submissions for insert with check (true);
create policy "Anon read submissions" on worksheet_submissions for select using (true);
create policy "Anon update submissions" on worksheet_submissions for update using (true);
create policy "Admin full access submissions" on worksheet_submissions for all using (auth.role() = 'authenticated');

alter table worksheet_responses enable row level security;
create policy "Anon insert responses" on worksheet_responses for insert with check (true);
create policy "Anon read responses" on worksheet_responses for select using (true);
create policy "Admin full access responses" on worksheet_responses for all using (auth.role() = 'authenticated');

alter table worksheet_links enable row level security;
create policy "Public read active links" on worksheet_links for select using (is_active = true);
create policy "Admin full access links" on worksheet_links for all using (auth.role() = 'authenticated');
