-- STEP 2: RLS policies
-- Run this AFTER step 1 succeeds

alter table assessments enable row level security;
create policy "Public read published" on assessments for select using (status = 'Published');
create policy "Admin full access" on assessments for all using (auth.role() = 'authenticated');

alter table assessment_questions enable row level security;
create policy "Public read published questions" on assessment_questions for select
  using (exists (select 1 from assessments where assessments.id = assessment_questions.assessment_id and assessments.status = 'Published'));
create policy "Admin full access questions" on assessment_questions for all using (auth.role() = 'authenticated');

alter table assessment_candidates enable row level security;
create policy "Anon insert candidates" on assessment_candidates for insert with check (true);
create policy "Anon read candidates" on assessment_candidates for select using (true);
create policy "Anon update candidates" on assessment_candidates for update using (true);
create policy "Admin full access candidates" on assessment_candidates for all using (auth.role() = 'authenticated');

alter table assessment_attempts enable row level security;
create policy "Anon insert attempts" on assessment_attempts for insert with check (true);
create policy "Anon read attempts" on assessment_attempts for select using (true);
create policy "Anon update attempts" on assessment_attempts for update using (true);
create policy "Admin full access attempts" on assessment_attempts for all using (auth.role() = 'authenticated');

alter table assessment_responses enable row level security;
create policy "Anon insert responses" on assessment_responses for insert with check (true);
create policy "Anon read responses" on assessment_responses for select using (true);
create policy "Admin full access responses" on assessment_responses for all using (auth.role() = 'authenticated');

alter table assessment_links enable row level security;
create policy "Public read active links" on assessment_links for select using (is_active = true);
create policy "Admin full access links" on assessment_links for all using (auth.role() = 'authenticated');
