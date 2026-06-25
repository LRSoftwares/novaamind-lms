import { supabase } from './supabase';
import { toCamel, toSnake } from './transforms';
import { scoreResponse, calculateTotals } from './scoring';

export async function fetchAssessmentBySlug(slug) {
  const { data: linkData, error: linkErr } = await supabase
    .from('assessment_links')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (linkErr || !linkData) return { error: 'Assessment not found or inactive' };

  const link = toCamel(linkData);

  const { data: asmData, error: asmErr } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', link.assessmentId)
    .eq('status', 'Published')
    .single();

  if (asmErr || !asmData) return { error: 'Assessment not available' };

  const { data: qData } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', link.assessmentId)
    .order('sort_order');

  const assessment = toCamel(asmData);
  const questions = toCamel(qData || []).map(q => ({
    ...q,
    correctAnswer: undefined,
    explanation: undefined,
  }));

  return { assessment, questions, link };
}

export async function fetchAssessmentQuestionsForScoring(assessmentId) {
  const { data } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('sort_order');
  return toCamel(data || []);
}

export async function registerCandidate(assessmentId, { name, email, phone, company }) {
  const { data: existing } = await supabase
    .from('assessment_candidates')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await supabase
      .from('assessment_candidates')
      .update({ otp_code: otp, otp_verified: false })
      .eq('id', existing.id);
    return { candidate: toCamel({ ...existing, otp_code: otp }), otp, isExisting: true };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const id = `AC${Date.now()}`;
  const payload = {
    id,
    assessment_id: assessmentId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone || '',
    company: company || '',
    otp_code: otp,
    otp_verified: false,
  };

  const { data, error } = await supabase
    .from('assessment_candidates')
    .insert(payload)
    .select()
    .single();

  if (error) return { error: error.message };
  return { candidate: toCamel(data), otp };
}

export async function verifyOtp(candidateId, otp) {
  const { data: candidate } = await supabase
    .from('assessment_candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (!candidate) return { verified: false, error: 'Candidate not found' };
  if (candidate.otp_code !== otp) return { verified: false, error: 'Invalid OTP' };

  await supabase
    .from('assessment_candidates')
    .update({ otp_verified: true })
    .eq('id', candidateId);

  return { verified: true, candidate: toCamel(candidate) };
}

export async function startAttempt(assessmentId, candidateId) {
  const { data: assessment } = await supabase
    .from('assessments')
    .select('max_attempts')
    .eq('id', assessmentId)
    .single();

  const { data: existing } = await supabase
    .from('assessment_attempts')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('candidate_id', candidateId)
    .order('attempt_number', { ascending: false });

  const prevAttempts = existing || [];
  const maxAttempts = assessment?.max_attempts || 1;

  if (prevAttempts.length >= maxAttempts) {
    return { error: `Maximum attempts (${maxAttempts}) reached` };
  }

  const inProgress = prevAttempts.find(a => a.status === 'InProgress');
  if (inProgress) {
    return { attempt: toCamel(inProgress), resumed: true };
  }

  const id = `ATT${Date.now()}`;
  const { data, error } = await supabase
    .from('assessment_attempts')
    .insert({
      id,
      assessment_id: assessmentId,
      candidate_id: candidateId,
      attempt_number: prevAttempts.length + 1,
      status: 'InProgress',
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { attempt: toCamel(data) };
}

export async function submitResponses(attemptId, assessmentId, answers, violations = []) {
  const fullQuestions = await fetchAssessmentQuestionsForScoring(assessmentId);

  const { data: assessment } = await supabase
    .from('assessments')
    .select('pass_percentage')
    .eq('id', assessmentId)
    .single();

  const passPercentage = assessment?.pass_percentage || 50;
  const responses = [];
  const scored = [];

  for (const q of fullQuestions) {
    const answer = answers[q.id] ?? null;
    const result = scoreResponse(q, answer);
    scored.push(result);

    responses.push({
      id: `AR${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      attempt_id: attemptId,
      question_id: q.id,
      answer: answer !== null ? JSON.stringify(answer) : null,
      is_correct: result.isCorrect,
      points_awarded: result.pointsAwarded,
      ai_feedback: result.pending ? 'Pending manual review' : null,
    });
  }

  const { error: respErr } = await supabase
    .from('assessment_responses')
    .insert(responses);

  if (respErr) return { error: respErr.message };

  const totals = calculateTotals(scored, fullQuestions, passPercentage);

  const { error: attErr } = await supabase
    .from('assessment_attempts')
    .update({
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
      auto_score: totals.autoScore,
      manual_score: totals.manualScore,
      total_score: totals.totalScore,
      max_possible: totals.maxPossible,
      percentage: totals.percentage,
      passed: totals.passed,
      violations: violations.length > 0 ? JSON.stringify(violations) : '[]',
    })
    .eq('id', attemptId);

  if (attErr) return { error: attErr.message };

  return { attemptId, ...totals };
}

export async function fetchAttemptResult(attemptId) {
  const { data: attempt } = await supabase
    .from('assessment_attempts')
    .select('*')
    .eq('id', attemptId)
    .single();

  if (!attempt) return { error: 'Attempt not found' };

  const { data: responses } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('attempt_id', attemptId);

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', attempt.assessment_id)
    .single();

  const { data: questions } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', attempt.assessment_id)
    .order('sort_order');

  return {
    attempt: toCamel(attempt),
    responses: toCamel(responses || []),
    assessment: toCamel(assessment),
    questions: toCamel(questions || []),
  };
}
