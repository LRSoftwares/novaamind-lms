-- ============================================================
-- KPI Metrics Module (does NOT modify existing tables)
-- Run in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. KPI Definitions (metric catalog per company/department)
create table if not exists kpi_definitions (
  id text primary key,
  company_id text references companies(id) on delete cascade,
  department text not null,
  pillar text not null check (pillar in ('S', 'E', 'O')),
  metric_name text not null,
  metric_unit text default '',
  direction text default 'higher_better' check (direction in ('higher_better', 'lower_better')),
  baseline_value numeric,
  target_value numeric,
  baseline_locked boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table kpi_definitions enable row level security;
create policy "Authenticated users can manage kpi definitions" on kpi_definitions for all to authenticated using (true) with check (true);

-- 2. KPI Submissions (weekly data containers)
create table if not exists kpi_submissions (
  id text primary key,
  company_id text references companies(id) on delete cascade,
  department text not null,
  week_ending text not null,
  status text default 'draft' check (status in ('draft', 'submitted', 'validated', 'rejected')),
  submitted_by text,
  submitted_at timestamptz,
  validated_by text,
  validated_at timestamptz,
  rejection_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table kpi_submissions enable row level security;
create policy "Authenticated users can manage kpi submissions" on kpi_submissions for all to authenticated using (true) with check (true);
create unique index if not exists idx_kpi_sub_unique on kpi_submissions(company_id, department, week_ending);

-- 3. KPI Data Points (metric values within a submission)
create table if not exists kpi_data_points (
  id text primary key,
  submission_id text references kpi_submissions(id) on delete cascade,
  definition_id text references kpi_definitions(id) on delete cascade,
  value numeric not null,
  notes text,
  flagged boolean default false,
  created_at timestamptz default now()
);

alter table kpi_data_points enable row level security;
create policy "Authenticated users can manage kpi data points" on kpi_data_points for all to authenticated using (true) with check (true);
create unique index if not exists idx_kpi_dp_unique on kpi_data_points(submission_id, definition_id);

-- 4. KPI Certifications (employee certification levels)
create table if not exists kpi_certifications (
  id text primary key,
  emp_id text references employees(id) on delete cascade,
  company_id text references companies(id) on delete cascade,
  level text not null check (level in ('Practitioner', 'Specialist', 'Strategist', 'Leader')),
  score numeric,
  certified_date text,
  created_at timestamptz default now()
);

alter table kpi_certifications enable row level security;
create policy "Authenticated users can manage kpi certifications" on kpi_certifications for all to authenticated using (true) with check (true);
