import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GraduationCap, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { fetchSubmissionResult } from '../lib/worksheetApi';
import { exportWorksheetSubmissionPdf } from '../utils/worksheetExport';

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
                <p className="text-gray-900 text-sm mb-3">{q.questionText}</p>
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
