import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, GraduationCap, Save, CheckCircle2 } from 'lucide-react';
import { fetchWorksheetBySlug, fetchSubmissionProgress, saveProgress, submitWorksheetResponses } from '../lib/worksheetApi';

export default function WorksheetPlayer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');

  const [worksheet, setWorksheet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [showSavedModal, setShowSavedModal] = useState(false);
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    (async () => {
      const result = await fetchWorksheetBySlug(slug);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      if (!result.questions || result.questions.length === 0) {
        setError('This worksheet has no questions yet.');
        setLoading(false);
        return;
      }
      setWorksheet(result.worksheet);
      setQuestions(result.questions);
      if (submissionId) {
        const progress = await fetchSubmissionProgress(submissionId);
        setAnswers(progress);
      }
      setLoading(false);
    })();
  }, [slug, submissionId]);

  // Autosave: persist answers a couple seconds after the participant stops interacting
  useEffect(() => {
    if (loading || submitting || submittedRef.current) return;
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await saveProgress(submissionId, answersRef.current);
      setSaveStatus(result.error ? 'idle' : 'saved');
    }, 2000);
    return () => clearTimeout(timer);
  }, [answers, loading, submitting, submissionId]);

  const handleSaveExit = useCallback(async () => {
    setSaveStatus('saving');
    const result = await saveProgress(submissionId, answersRef.current);
    setSaveStatus(result.error ? 'idle' : 'saved');
    setShowSavedModal(true);
  }, [submissionId]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const result = await submitWorksheetResponses(submissionId, answers);
    if (result.error) {
      submittedRef.current = false;
      setSubmitting(false);
      alert('Failed to submit: ' + result.error);
      return;
    }
    navigate(`/worksheet/${slug}/result?submissionId=${submissionId}`);
  }, [submissionId, answers, slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !worksheet || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Load Worksheet</h2>
          <p className="text-gray-500 text-sm">{error || 'This worksheet has no questions or is unavailable.'}</p>
          <button onClick={() => navigate(`/worksheet/${slug}`)} className="mt-4 text-blue-600 text-sm hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== '' && answers[k] !== undefined && !(Array.isArray(answers[k]) && answers[k].length === 0)).length;
  const requiredUnanswered = questions.filter(q => q.required !== false && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === '' || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-center mb-2">Submit Worksheet?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              You have answered {answeredCount} of {questions.length} questions.
              {requiredUnanswered > 0 && ` ${requiredUnanswered} required question(s) are unanswered.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Go Back</button>
              <button onClick={() => { setShowConfirm(false); doSubmit(); }} disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Confirmation Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Progress Saved</h3>
            <p className="text-sm text-gray-500 mb-5">Your answers are saved. Come back anytime using the same worksheet link and register with the same email to continue where you left off.</p>
            <button onClick={() => setShowSavedModal(false)} className="w-full py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Continue Filling</button>
          </div>
        </div>
      )}

      {/* Left Sidebar - Question Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm text-gray-900">Novaamind LMS</span>
          </div>
          <p className="text-xs text-gray-500">{answeredCount}/{questions.length} answered</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '' && !(Array.isArray(answers[q.id]) && answers[q.id].length === 0);
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${
                    isCurrent ? 'bg-blue-600 text-white' :
                    hasAnswer ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600" /> Current</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Answered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-100" /> Unanswered</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 truncate">{worksheet.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 min-w-[3.5rem] text-right">
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : ''}
            </span>
            <button onClick={handleSaveExit} disabled={submitting} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
              <Save className="w-4 h-4" /> Save & Exit
            </button>
            <button onClick={() => setShowConfirm(true)} disabled={submitting} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Send className="w-4 h-4" /> Submit
            </button>
          </div>
        </header>

        {/* Question Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-500">Question {currentIdx + 1} of {questions.length}</span>
              {currentQ.required === false && <span className="text-xs text-gray-400">(optional)</span>}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
              <p className="text-gray-900 text-base leading-relaxed mb-6">{currentQ.questionText}</p>

              {/* MultipleChoice */}
              {currentQ.questionType === 'MultipleChoice' && (
                <div className="space-y-2">
                  {currentQ.options.map(opt => (
                    <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[currentQ.id] === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input type="radio" name={`q-${currentQ.id}`} checked={answers[currentQ.id] === opt.id}
                        onChange={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt.id }))}
                        className="accent-blue-600" />
                      <span className="text-sm">{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Checklist */}
              {currentQ.questionType === 'Checklist' && (
                <div className="space-y-2">
                  {currentQ.options.map(opt => {
                    const selected = Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(opt.id);
                    return (
                      <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}>
                        <input type="checkbox" checked={selected}
                          onChange={(e) => {
                            setAnswers(prev => {
                              const current = Array.isArray(prev[currentQ.id]) ? prev[currentQ.id] : [];
                              return { ...prev, [currentQ.id]: e.target.checked ? [...current, opt.id] : current.filter(x => x !== opt.id) };
                            });
                          }}
                          className="accent-blue-600 rounded" />
                        <span className="text-sm">{opt.text}</span>
                      </label>
                    );
                  })}
                  <p className="text-xs text-gray-400 mt-1">Select all that apply</p>
                </div>
              )}

              {/* Rating */}
              {currentQ.questionType === 'Rating' && (
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button key={val} onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: val }))}
                      className={`flex-1 py-4 rounded-xl border-2 text-lg font-semibold transition-colors ${
                        answers[currentQ.id] === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {val}
                    </button>
                  ))}
                </div>
              )}

              {/* ShortAnswer */}
              {currentQ.questionType === 'ShortAnswer' && (
                <input
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your answer..."
                />
              )}

              {/* LongAnswer */}
              {currentQ.questionType === 'LongAnswer' && (
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  rows={6}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your answer..."
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
