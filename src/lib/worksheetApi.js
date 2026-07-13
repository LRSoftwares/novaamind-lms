import { supabase } from './supabase';
import { toCamel } from './transforms';

export async function fetchWorksheetBySlug(slug) {
  const { data: linkData, error: linkErr } = await supabase
    .from('worksheet_links')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (linkErr || !linkData) return { error: 'Worksheet not found or inactive' };

  const link = toCamel(linkData);

  const { data: wsData, error: wsErr } = await supabase
    .from('worksheets')
    .select('*')
    .eq('id', link.worksheetId)
    .eq('status', 'Published')
    .single();

  if (wsErr || !wsData) return { error: 'Worksheet not available' };

  const { data: qData } = await supabase
    .from('worksheet_questions')
    .select('*')
    .eq('worksheet_id', link.worksheetId)
    .order('sort_order');

  return {
    worksheet: toCamel(wsData),
    questions: toCamel(qData || []),
    link,
  };
}

export async function registerCandidate(worksheetId, { name, email, phone, company }) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from('worksheet_candidates')
    .select('*')
    .eq('worksheet_id', worksheetId)
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) return { candidate: toCamel(existing), isExisting: true };

  const id = `WC${Date.now()}`;
  const payload = {
    id,
    worksheet_id: worksheetId,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone || '',
    company: company || '',
  };

  const { data, error } = await supabase
    .from('worksheet_candidates')
    .insert(payload)
    .select()
    .single();

  if (error) return { error: error.message };
  return { candidate: toCamel(data) };
}

export async function startSubmission(worksheetId, candidateId) {
  const { data: existing } = await supabase
    .from('worksheet_submissions')
    .select('*')
    .eq('worksheet_id', worksheetId)
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  const prev = existing || [];
  const submitted = prev.find(s => s.status === 'Submitted');
  if (submitted) return { submission: toCamel(submitted), alreadySubmitted: true };

  const inProgress = prev.find(s => s.status === 'InProgress');
  if (inProgress) return { submission: toCamel(inProgress), resumed: true };

  const id = `WS${Date.now()}`;
  const { data, error } = await supabase
    .from('worksheet_submissions')
    .insert({ id, worksheet_id: worksheetId, candidate_id: candidateId, status: 'InProgress' })
    .select()
    .single();

  if (error) return { error: error.message };
  return { submission: toCamel(data) };
}

// Fetches previously saved answers for a submission, so a returning participant sees their progress restored.
export async function fetchSubmissionProgress(submissionId) {
  const { data } = await supabase
    .from('worksheet_responses')
    .select('question_id, answer')
    .eq('submission_id', submissionId);

  const answers = {};
  (data || []).forEach(r => {
    let answer = r.answer;
    try { if (typeof answer === 'string') answer = JSON.parse(answer); } catch { /* keep raw string */ }
    answers[r.question_id] = answer;
  });
  return answers;
}

// Insert-or-update each answered question's response row. Safe to call repeatedly (autosave + explicit save + final submit).
export async function saveProgress(submissionId, answers) {
  const { data: existing } = await supabase
    .from('worksheet_responses')
    .select('id, question_id')
    .eq('submission_id', submissionId);

  const existingByQuestion = new Map((existing || []).map(r => [r.question_id, r.id]));

  const toInsert = [];
  const toUpdate = [];

  Object.entries(answers).forEach(([questionId, answer]) => {
    const isEmpty = answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);
    if (isEmpty) return;
    const serialized = JSON.stringify(answer);
    const existingId = existingByQuestion.get(questionId);
    if (existingId) {
      toUpdate.push({ id: existingId, answer: serialized });
    } else {
      toInsert.push({
        id: `WR${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
        submission_id: submissionId,
        question_id: questionId,
        answer: serialized,
      });
    }
  });

  if (toInsert.length > 0) {
    const { error } = await supabase.from('worksheet_responses').insert(toInsert);
    if (error) return { error: error.message };
  }

  for (const u of toUpdate) {
    const { error } = await supabase.from('worksheet_responses').update({ answer: u.answer }).eq('id', u.id);
    if (error) return { error: error.message };
  }

  return { saved: toInsert.length + toUpdate.length };
}

export async function submitWorksheetResponses(submissionId, answers) {
  const saveResult = await saveProgress(submissionId, answers);
  if (saveResult.error) return { error: saveResult.error };

  const { error: subErr } = await supabase
    .from('worksheet_submissions')
    .update({ status: 'Submitted', submitted_at: new Date().toISOString() })
    .eq('id', submissionId);

  if (subErr) return { error: subErr.message };
  return { submissionId };
}

export async function fetchSubmissionResult(submissionId) {
  const { data: submission } = await supabase
    .from('worksheet_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (!submission) return { error: 'Submission not found' };

  const [{ data: responses }, { data: worksheet }, { data: questions }, { data: candidate }] = await Promise.all([
    supabase.from('worksheet_responses').select('*').eq('submission_id', submissionId),
    supabase.from('worksheets').select('*').eq('id', submission.worksheet_id).single(),
    supabase.from('worksheet_questions').select('*').eq('worksheet_id', submission.worksheet_id).order('sort_order'),
    supabase.from('worksheet_candidates').select('*').eq('id', submission.candidate_id).single(),
  ]);

  return {
    submission: toCamel(submission),
    responses: toCamel(responses || []),
    worksheet: toCamel(worksheet),
    questions: toCamel(questions || []),
    candidate: toCamel(candidate),
  };
}
