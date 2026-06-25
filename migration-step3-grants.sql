-- STEP 3: Grant permissions to Supabase roles
-- This is needed because tables created via raw SQL don't auto-grant

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON assessments TO authenticated;
GRANT ALL ON assessment_questions TO authenticated;
GRANT ALL ON assessment_candidates TO authenticated, anon;
GRANT ALL ON assessment_attempts TO authenticated, anon;
GRANT ALL ON assessment_responses TO authenticated, anon;
GRANT ALL ON assessment_links TO authenticated;

GRANT SELECT ON assessments TO anon;
GRANT SELECT ON assessment_questions TO anon;
GRANT SELECT ON assessment_links TO anon;

NOTIFY pgrst, 'reload schema';
