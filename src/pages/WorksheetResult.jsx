import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GraduationCap, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { fetchSubmissionResult } from '../lib/worksheetApi';
import { exportWorksheetSubmissionPdf } from '../utils/worksheetExport';
import { isPersonalityWorksheet, computeCategoryScores, CATEGORY_SUMMARIES } from '../lib/personalityProfile';
import WorksheetRichTextRenderer from '../components/worksheets/WorksheetRichTextRenderer';

function parseAnswer(raw) {
  let answer = raw;
  try { if (typeof answer === 'string') answer = JSON.parse(answer); } catch { /* keep raw string */ }
  return answer;
}

export default function WorksheetResult() {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const result = await fetchSubmissionResult(submissionId);
      if (result.error) setError(result.error);
      else setData(result);
      setLoading(false);
    })();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 text-sm">{error || 'Could not load submission'}</p>
        </div>
      </div>
    );
  }

  const { submission, worksheet, candidate, responses, questions } = data;
  const isProfile = isPersonalityWorksheet(questions);
  const ranked = isProfile
    ? computeCategoryScores(questions, responses.reduce((acc, r) => { acc[r.questionId] = parseAnswer(r.answer); return acc; }, {}))
    : [];
  const primary = ranked[0];

  if (isProfile && primary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-7 h-7 text-white/80" />
            <span className="font-bold text-lg text-white/90">Novaamind LMS</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-5 flex items-start gap-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold text-white flex-shrink-0" style={{ background: primary.color }}>
              {primary.category[0]}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Your Primary Type</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{primary.category}</h1>
              <p className="text-sm text-gray-500 mb-3">{candidate.name} · {candidate.company}</p>
              {CATEGORY_SUMMARIES[primary.category] && (
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{CATEGORY_SUMMARIES[primary.category]}</p>
              )}
              <button
                onClick={() => exportWorksheetSubmissionPdf({ worksheet, candidate, submission, questions, responses })}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-5">
            <div className="px-6 py-3 text-xs uppercase tracking-wide text-gray-400 font-medium border-b border-gray-100">Profile Ranking</div>
            {ranked.map((cat, i) => (
              <div key={cat.category} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0">
                <span className={`font-serif text-xl w-6 text-center ${i === 0 ? 'text-gray-900' : 'text-gray-300'}`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: cat.color }}>{cat.category}</span>
                    <span className="text-xs text-gray-400 tabular-nums">{cat.total} / {cat.max} · {cat.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.pct}%`, background: cat.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 pb-8">
            {ranked.map(cat => (
              <div key={cat.category} className="bg-white rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  <h3 className="text-sm font-medium text-gray-900">{cat.category} — Trait Breakdown</h3>
                </div>
                <div className="py-1 max-h-72 overflow-y-auto">
                  {cat.traits.map(t => (
                    <div key={t.questionId} className="flex items-center gap-3 px-5 py-2 text-sm">
                      <span className="flex-1 text-gray-600">{t.trait}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(p => (
                          <span key={p} className="w-2 h-2 rounded-full" style={{ background: p <= t.value ? cat.color : '#e8e5de' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-7 h-7 text-white/80" />
          <span className="font-bold text-lg text-white/90">Novaamind LMS</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-100">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">{worksheet.title}</h1>
          <p className="text-sm text-gray-500 mb-4">Thank you, {candidate.name}. Your worksheet has been submitted.</p>

          {submission.submittedAt && (
            <p className="text-xs text-gray-400 mb-4">Submitted on {new Date(submission.submittedAt).toLocaleString()}</p>
          )}

          <button
            onClick={() => exportWorksheetSubmissionPdf({ worksheet, candidate, submission, questions, responses })}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>

        {/* Response Review */}
        <div className="space-y-3 pb-8">
          <h2 className="text-white/80 font-semibold text-sm mb-2">Your Responses</h2>
          {questions.map((q, idx) => {
            const resp = responses.find(r => r.questionId === q.id);
            let answer = resp?.answer;
            try { if (typeof answer === 'string') answer = JSON.parse(answer); } catch {}

            return (
              <div key={q.id} className="bg-white rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                </div>
                <WorksheetRichTextRenderer html={q.questionText} className="text-sm mb-3" />
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{Array.isArray(answer) ? answer.join(', ') : (answer ?? 'No answer')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
