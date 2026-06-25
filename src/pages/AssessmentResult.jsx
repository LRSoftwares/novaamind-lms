import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GraduationCap, CheckCircle2, XCircle, AlertCircle, Award, TrendingUp } from 'lucide-react';
import { fetchAttemptResult } from '../lib/assessmentApi';

export default function AssessmentResult() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const result = await fetchAttemptResult(attemptId);
      if (result.error) setError(result.error);
      else setData(result);
      setLoading(false);
    })();
  }, [attemptId]);

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
          <p className="text-gray-500 text-sm">{error || 'Could not load results'}</p>
        </div>
      </div>
    );
  }

  const { attempt, responses, assessment, questions } = data;
  const passed = attempt.passed;
  const showDetails = assessment.showResults !== false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-7 h-7 text-white/80" />
          <span className="font-bold text-lg text-white/90">Novaamind LMS</span>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            {passed ? <Award className="w-10 h-10 text-green-600" /> : <TrendingUp className="w-10 h-10 text-red-500" />}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">{assessment.title}</h1>
          <p className="text-sm text-gray-500 mb-6">Assessment Complete</p>

          <div className="flex items-center justify-center gap-6 mb-4">
            <div>
              <p className="text-4xl font-bold text-gray-900">{attempt.totalScore ?? attempt.autoScore ?? 0}<span className="text-lg text-gray-400">/{attempt.maxPossible ?? 0}</span></p>
              <p className="text-sm text-gray-500 mt-1">Score</p>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div>
              <p className="text-4xl font-bold text-gray-900">{attempt.percentage ?? 0}<span className="text-lg text-gray-400">%</span></p>
              <p className="text-sm text-gray-500 mt-1">Percentage</p>
            </div>
          </div>

          <span className={`inline-block px-6 py-2 rounded-full text-sm font-semibold ${
            passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {passed ? 'PASSED' : 'NOT PASSED'}
          </span>

          {attempt.submittedAt && (
            <p className="text-xs text-gray-400 mt-4">Submitted on {new Date(attempt.submittedAt).toLocaleString()}</p>
          )}

          {responses.some(r => r.isCorrect === null) && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 inline-block px-3 py-1 rounded-full">
              Some subjective answers are pending manual review
            </p>
          )}

          {(() => {
            let v = attempt.violations || [];
            try { if (typeof v === 'string') v = JSON.parse(v); } catch { v = []; }
            if (!Array.isArray(v) || v.length === 0) return null;
            return (
              <p className="text-xs text-red-600 mt-2 bg-red-50 inline-block px-3 py-1 rounded-full">
                {v.length} integrity violation{v.length !== 1 ? 's' : ''} recorded during this assessment
              </p>
            );
          })()}
        </div>

        {/* Question Review */}
        {showDetails && (
          <div className="space-y-3 pb-8">
            <h2 className="text-white/80 font-semibold text-sm mb-2">Question Review</h2>
            {questions.map((q, idx) => {
              const resp = responses.find(r => r.questionId === q.id);
              let answer = resp?.answer;
              try { if (typeof answer === 'string') answer = JSON.parse(answer); } catch {}

              return (
                <div key={q.id} className="bg-white rounded-xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{q.questionType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {resp?.isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {resp?.isCorrect === false && <XCircle className="w-5 h-5 text-red-500" />}
                      {resp?.isCorrect === null && <AlertCircle className="w-5 h-5 text-amber-500" />}
                      <span className="text-sm font-medium">{resp?.pointsAwarded ?? 0}/{q.points}</span>
                    </div>
                  </div>

                  <p className="text-gray-900 text-sm mb-3">{q.questionText}</p>

                  {q.questionType !== 'Subjective' ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                        <p className="font-medium">{Array.isArray(answer) ? answer.join(', ') : String(answer ?? 'No answer')}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 mb-1">Correct Answer</p>
                        <p className="font-medium text-green-700">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer ?? '')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                      <p>{String(answer ?? 'No answer')}</p>
                      {resp?.isCorrect === null && (
                        <p className="text-xs text-amber-600 mt-2">Pending manual review</p>
                      )}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                      <p className="text-xs text-blue-500 mb-1">Explanation</p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
