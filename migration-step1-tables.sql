-- STEP 1: Create tables and indexes
-- Run this FIRST in Supabase SQL Editor

drop table if exists assessment_responses cascade;
drop table if exists assessment_attempts cascade;
drop table if exists assessment_candidates cascade;
drop table if exists assessment_questions cascade;
drop table if exists assessment_links cascade;
drop table if exists assessments cascade;

create table assessments (
  id text primary key,
  program_id text,
  title text not null,
  description text default '',
  instructions text default '',
  duration_minutes integer default 60,
  pass_percentage integer default 50,
  max_attempts integer default 1,
  shuffle_questions boolean default false,
  shuffle_options boolean default false,
  show_results boolean default true,
  status text default 'Draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table assessment_questions (
  id text primary key,
  assessment_id text not null references assessments(id) on delete cascade,
  sort_order integer default 0,
  question_type text not null,
  question_text text not null,
  options jsonb default '[]',
  correct_answer jsonb,
  points integer default 1,
  explanation text default '',
  subjective_type text,
  created_at timestamptz default now()
);

create table assessment_candidates (
  id text primary key,
  assessment_id text not null references assessments(id) on delete cascade,
  name text not null,
  email text not null,
  phone text default '',
  company text default '',
  otp_code text,
  otp_verified boolean default false,
  registered_at timestamptz default now()
);

create table assessment_attempts (
  id text primary key,
  assessment_id text not null references assessments(id) on delete cascade,
  candidate_id text not null references assessment_candidates(id) on delete cascade,
  attempt_number integer default 1,
  status text default 'InProgress',
  started_at timestamptz default now(),
  submitted_at timestamptz,
  auto_score numeric(5,2) default 0,
  manual_score numeric(5,2),
  total_score numeric(5,2),
  max_possible numeric(5,2),
  percentage numeric(5,2),
  passed boolean,
  created_at timestamptz default now()
);

create table assessment_responses (
  id text primary key,
  attempt_id text not null references assessment_attempts(id) on delete cascade,
  question_id text not null references assessment_questions(id) on delete cascade,
  answer jsonb,
  is_correct boolean,
  points_awarded numeric(5,2) default 0,
  ai_feedback text,
  created_at timestamptz default now()
);

create table assessment_links (
  id text primary key,
  assessment_id text not null references assessments(id) on delete cascade,
  slug text not null unique,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create index idx_aq_assessment on assessment_questions(assessment_id);
create index idx_ac_assessment on assessment_candidates(assessment_id);
create index idx_ac_email on assessment_candidates(assessment_id, email);
create index idx_aa_assessment on assessment_attempts(assessment_id);
create index idx_aa_candidate on assessment_attempts(candidate_id);
create index idx_ar_attempt on assessment_responses(attempt_id);
create index idx_al_slug on assessment_links(slug);
