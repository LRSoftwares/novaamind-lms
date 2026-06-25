import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle, GraduationCap } from 'lucide-react';
import { fetchAssessmentBySlug, submitResponses } from '../lib/assessmentApi';

function TestTimer({ durationMinutes, startedAt, onExpire }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationMinutes * 60 - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isWarning = remaining < 300;

  return (
    <span className={`flex items-center gap-1.5 font-mono text-base ${isWarning ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
      <Clock className="w-4 h-4" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

export default function AssessmentPlayer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const assessmentId = searchParams.get('assessmentId');

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const result = await fetchAssessmentBySlug(slug);
      if (result.error) return;
      let qs = result.questions;
      if (result.assessment.shuffleQuestions) {
        qs = [...qs];
        for (let i = qs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [qs[i], qs[j]] = [qs[j], qs[i]];
        }
      }
      if (result.assessment.shuffleOptions) {
        qs = qs.map(q => {
          if (q.options?.length > 0) {
            const opts = [...q.options];
            for (let i = opts.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [opts[i], opts[j]] = [opts[j], opts[i]];
            }
            return { ...q, options: opts };
          }
          return q;
        });
      }
      setAssessment(result.assessment);
      setQuestions(qs);
      setStartedAt(new Date().toISOString());
      setLoading(false);
    })();
  }, [slug]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const result = await submitResponses(attemptId, assessmentId, answers);
    if (result.error) {
      submittedRef.current = false;
      setSubmitting(false);
      return;
    }
    navigate(`/assessment/${slug}/result?attemptId=${attemptId}`);
  }, [attemptId, assessmentId, answers, slug, navigate]);

  const handleTimerExpire = useCallback(() => {
    doSubmit();
  }, [doSubmit]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== '' && answers[k] !== undefined).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-center mb-2">Submit Assessment?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && ` ${questions.length - answeredCount} question(s) are unanswered.`}
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
              const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '';
              const isCurrent = idx === currentIdx;
              const isMarked = marked.has(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${
                    isCurrent ? 'bg-blue-600 text-white' :
                    isMarked ? 'bg-amber-100 text-amber-700 border border-amber-300' :
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
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Marked</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-100" /> Unanswered</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 truncate">{assessment.title}</h1>
          <div className="flex items-center gap-4">
            {startedAt && (
              <TestTimer durationMinutes={assessment.durationMinutes} startedAt={startedAt} onExpire={handleTimerExpire} />
            )}
            <button onClick={() => setShowConfirm(true)} disabled={submitting} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              <Send className="w-4 h-4" /> Submit
            </button>
          </div>
        </header>

        {/* Question Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">Question {currentIdx + 1} of {questions.length}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{currentQ.questionType}</span>
                <span className="text-xs text-gray-400">{currentQ.points} point{currentQ.points !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setMarked(prev => { const s = new Set(prev); s.has(currentQ.id) ? s.delete(currentQ.id) : s.add(currentQ.id); return s; })}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${marked.has(currentQ.id) ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Flag className="w-3.5 h-3.5" /> {marked.has(currentQ.id) ? 'Marked' : 'Mark for review'}
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
              <p className="text-gray-900 text-base leading-relaxed mb-6">{currentQ.questionText}</p>

              {/* MCQ */}
              {currentQ.questionType === 'MCQ' && (
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

              {/* MultiSelect */}
              {currentQ.questionType === 'MultiSelect' && (
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

              {/* TrueFalse */}
              {currentQ.questionType === 'TrueFalse' && (
                <div className="flex gap-4">
                  {['true', 'false'].map(val => (
                    <button key={val} onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: val }))}
                      className={`flex-1 py-4 rounded-xl border-2 text-base font-medium transition-colors ${
                        answers[currentQ.id] === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {val === 'true' ? 'True' : 'False'}
                    </button>
                  ))}
                </div>
              )}

              {/* FillBlank */}
              {currentQ.questionType === 'FillBlank' && (
                <input
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your answer..."
                />
              )}

              {/* Subjective */}
              {currentQ.questionType === 'Subjective' && (
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                  rows={currentQ.subjectiveType === 'long' ? 8 : 3}
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
