import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, X, Copy, ExternalLink, ChevronDown, ChevronUp, Eye, ClipboardCheck, Clock, Target, Users, CheckCircle2, XCircle, Award, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

const QUESTION_TYPES = ['MCQ', 'MultiSelect', 'TrueFalse', 'FillBlank', 'Subjective'];
const STATUS_COLORS = { Draft: 'bg-gray-100 text-gray-700', Published: 'bg-green-100 text-green-700', Archived: 'bg-amber-100 text-amber-700' };

const emptyForm = {
  title: '', description: '', instructions: '', programId: '', durationMinutes: 60,
  passPercentage: 50, maxAttempts: 1, shuffleQuestions: false, shuffleOptions: false, showResults: true,
};

const emptyQuestion = {
  questionType: 'MCQ', questionText: '', options: [{ id: '1', text: '' }, { id: '2', text: '' }],
  correctAnswer: '', points: 1, explanation: '', subjectiveType: 'short',
};

export default function Assessments() {
  const {
    programs, assessments, assessmentQuestions, assessmentCandidates, assessmentAttempts, assessmentResponses, assessmentLinks,
    addAssessment, updateAssessment, deleteAssessment, publishAssessment,
    addAssessmentQuestion, updateAssessmentQuestion, deleteAssessmentQuestion,
    updateAssessmentAttempt, updateAssessmentResponse, deleteAssessmentLink,
  } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState([]);
  const [editingQ, setEditingQ] = useState(null);
  const [qForm, setQForm] = useState(emptyQuestion);
  const [tab, setTab] = useState('settings');
  const [expandedId, setExpandedId] = useState(null);
  const [viewingResults, setViewingResults] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const filtered = useMemo(() => {
    return assessments.filter(a => {
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (programFilter !== 'All' && a.programId !== programFilter) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [assessments, search, statusFilter, programFilter]);

  const openNew = () => {
    setForm({ ...emptyForm });
    setQuestions([]);
    setEditing(null);
    setTab('settings');
    setEditingQ(null);
    setModalOpen(true);
  };

  const openEdit = (asm) => {
    setForm({
      title: asm.title, description: asm.description || '', instructions: asm.instructions || '',
      programId: asm.programId || '', durationMinutes: asm.durationMinutes || 60,
      passPercentage: asm.passPercentage || 50, maxAttempts: asm.maxAttempts || 1,
      shuffleQuestions: asm.shuffleQuestions || false, shuffleOptions: asm.shuffleOptions || false,
      showResults: asm.showResults !== false,
    });
    setQuestions(assessmentQuestions.filter(q => q.assessmentId === asm.id).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(asm.id);
    setTab('settings');
    setEditingQ(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    // Auto-save any question currently being edited
    let finalQuestions = [...questions];
    if (editingQ && qForm.questionText.trim()) {
      const q = {
        ...qForm,
        id: editingQ.id,
        sortOrder: editingQ._new ? finalQuestions.length : finalQuestions.findIndex(x => x.id === editingQ.id),
        _new: editingQ._new || false,
        _dirty: !editingQ._new,
      };
      if (editingQ._new) {
        finalQuestions = [...finalQuestions, q];
      } else {
        finalQuestions = finalQuestions.map(x => x.id === editingQ.id ? q : x);
      }
      setQuestions(finalQuestions);
      setEditingQ(null);
    }

    if (finalQuestions.length === 0) {
      setTab('questions');
      showToast('Please add at least one question before saving');
      return;
    }

    setSaving(true);
    if (editing) {
      await updateAssessment(editing, form);
      for (const q of finalQuestions) {
        if (q._new) {
          const { _new, ...rest } = q;
          const { error: qErr } = await addAssessmentQuestion({ ...rest, assessmentId: editing });
          if (qErr) console.error('[LMS] Failed to add question:', qErr);
        } else if (q._dirty) {
          const { _dirty, ...rest } = q;
          await updateAssessmentQuestion(q.id, rest);
        }
      }
      const currentIds = new Set(finalQuestions.map(q => q.id));
      const existingQs = assessmentQuestions.filter(q => q.assessmentId === editing);
      for (const eq of existingQs) {
        if (!currentIds.has(eq.id)) await deleteAssessmentQuestion(eq.id);
      }
    } else {
      const id = `ASM${Date.now()}`;
      const { error } = await addAssessment({ id, ...form, status: 'Draft' });
      if (error) {
        setSaving(false);
        showToast(`Error: ${error.message || error}`);
        return;
      }
      let qErrors = 0;
      for (let i = 0; i < finalQuestions.length; i++) {
        const { _new, _dirty, ...rest } = finalQuestions[i];
        const { error: qErr } = await addAssessmentQuestion({ ...rest, assessmentId: id, sortOrder: i });
        if (qErr) qErrors++;
      }
      if (qErrors > 0) {
        setSaving(false);
        showToast(`Assessment created but ${qErrors} question(s) failed to save. Check console for details.`);
        setModalOpen(false);
        return;
      }
    }
    setSaving(false);
    setModalOpen(false);
    showToast(editing ? 'Assessment updated' : `Assessment created with ${finalQuestions.length} question(s)`);
  };

  const handlePublish = async (id) => {
    const existing = assessmentLinks.find(l => l.assessmentId === id);
    if (existing) {
      const url = `${window.location.origin}/assessment/${existing.slug}`;
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
      return;
    }
    const { slug, error } = await publishAssessment(id);
    if (!error) {
      const url = `${window.location.origin}/assessment/${slug}`;
      navigator.clipboard.writeText(url);
      showToast('Published! Link copied to clipboard');
    }
  };

  const handleUnpublish = async (id) => {
    await updateAssessment(id, { status: 'Draft' });
    const link = assessmentLinks.find(l => l.assessmentId === id);
    if (link) await deleteAssessmentLink(link.id);
    showToast('Assessment unpublished');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assessment and all its questions, responses, and links?')) return;
    await deleteAssessment(id);
    showToast('Assessment deleted');
  };

  const addQuestion = () => {
    const id = `AQ${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    setQForm({ ...emptyQuestion });
    setEditingQ({ id, _new: true });
  };

  const saveQuestion = () => {
    const q = {
      ...qForm,
      id: editingQ.id,
      sortOrder: editingQ._new ? questions.length : (questions.findIndex(x => x.id === editingQ.id)),
      _new: editingQ._new || false,
      _dirty: !editingQ._new,
    };
    if (editingQ._new) {
      setQuestions(prev => [...prev, q]);
    } else {
      setQuestions(prev => prev.map(x => x.id === editingQ.id ? q : x));
    }
    setEditingQ(null);
  };

  const removeQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const startEditQuestion = (q) => {
    setQForm({
      questionType: q.questionType, questionText: q.questionText,
      options: q.options?.length ? q.options : [{ id: '1', text: '' }, { id: '2', text: '' }],
      correctAnswer: q.correctAnswer || '', points: q.points || 1,
      explanation: q.explanation || '', subjectiveType: q.subjectiveType || 'short',
    });
    setEditingQ(q);
  };

  // --- Results View ---
  if (viewingResults) {
    const asm = assessments.find(a => a.id === viewingResults);
    const attempts = assessmentAttempts.filter(a => a.assessmentId === viewingResults);
    const candidates = assessmentCandidates.filter(c => c.assessmentId === viewingResults);

    if (selectedAttempt) {
      const att = attempts.find(a => a.id === selectedAttempt);
      const candidate = candidates.find(c => c.id === att?.candidateId);
      const responses = assessmentResponses.filter(r => r.attemptId === selectedAttempt);
      const qs = assessmentQuestions.filter(q => q.assessmentId === viewingResults).sort((a, b) => a.sortOrder - b.sortOrder);

      return (
        <div>
          <button onClick={() => setSelectedAttempt(null)} className="text-sm text-blue-600 hover:underline mb-4">← Back to attempts</button>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{candidate?.name || 'Unknown'}</h2>
              <p className="text-sm text-gray-500">{candidate?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{att?.totalScore ?? att?.autoScore ?? 0}/{att?.maxPossible ?? 0}</span>
              <span className="text-sm text-gray-500">({att?.percentage ?? 0}%)</span>
              {att?.passed != null && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${att.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {att.passed ? 'Passed' : 'Failed'}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {qs.map((q, idx) => {
              const resp = responses.find(r => r.questionId === q.id);
              let answer = resp?.answer;
              try { if (typeof answer === 'string') answer = JSON.parse(answer); } catch {}

              return (
                <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{q.questionType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {resp?.isCorrect === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {resp?.isCorrect === false && <XCircle className="w-5 h-5 text-red-500" />}
                      {resp?.isCorrect === null && <AlertCircle className="w-5 h-5 text-amber-500" />}
                      <span className="text-sm font-medium">{resp?.pointsAwarded ?? 0}/{q.points}</span>
                    </div>
                  </div>
                  <p className="text-gray-900 mb-3">{q.questionText}</p>

                  {q.questionType !== 'Subjective' && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Candidate Answer</p>
                        <p className="text-sm font-medium">{Array.isArray(answer) ? answer.join(', ') : String(answer ?? 'No answer')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Correct Answer</p>
                        <p className="text-sm font-medium text-green-700">{Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer ?? '')}</p>
                      </div>
                    </div>
                  )}

                  {q.questionType === 'Subjective' && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Candidate Response</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">{String(answer ?? 'No answer')}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <label className="text-sm text-gray-600">Score (out of {q.points}):</label>
                        <input
                          type="number"
                          min="0"
                          max={q.points}
                          defaultValue={resp?.pointsAwarded ?? 0}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                          onBlur={async (e) => {
                            const val = Math.min(Number(e.target.value) || 0, q.points);
                            if (resp) {
                              await updateAssessmentResponse(resp.id, { pointsAwarded: val, isCorrect: val > 0 });
                              const allResp = assessmentResponses.filter(r => r.attemptId === selectedAttempt && r.id !== resp.id);
                              const totalManual = allResp.reduce((sum, r) => sum + (r.isCorrect === null ? (Number(r.pointsAwarded) || 0) : 0), 0) + val;
                              const autoScore = Number(att.autoScore) || 0;
                              const totalScore = autoScore + totalManual;
                              const maxPossible = Number(att.maxPossible) || 0;
                              const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 10000) / 100 : 0;
                              await updateAssessmentAttempt(selectedAttempt, {
                                manualScore: totalManual, totalScore, percentage,
                                passed: percentage >= (asm?.passPercentage || 50), status: 'Graded',
                              });
                              showToast('Score saved');
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        <button onClick={() => { setViewingResults(null); setSelectedAttempt(null); }} className="text-sm text-blue-600 hover:underline mb-4">← Back to assessments</button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{asm?.title} — Results</h2>
            <p className="text-sm text-gray-500">{attempts.length} attempt{attempts.length !== 1 ? 's' : ''} · {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No attempts yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Candidate</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Score</th>
                  <th className="px-4 py-3 font-medium text-gray-600">%</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(att => {
                  const cand = candidates.find(c => c.id === att.candidateId);
                  return (
                    <tr key={att.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedAttempt(att.id)}>
                      <td className="px-4 py-3 font-medium">{cand?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{cand?.email || '—'}</td>
                      <td className="px-4 py-3">{att.totalScore ?? att.autoScore ?? 0}/{att.maxPossible ?? 0}</td>
                      <td className="px-4 py-3">{att.percentage ?? 0}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          att.passed === true ? 'bg-green-100 text-green-700' :
                          att.passed === false ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {att.status === 'Graded' ? (att.passed ? 'Passed' : 'Failed') : att.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // --- Main List View ---
  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm animate-[slideIn_0.3s_ease]">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage assessments for your programs</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New Assessment
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Archived">Archived</option>
        </select>
        <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="All">All Programs</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium mb-1">No assessments yet</p>
          <p className="text-sm">Create your first assessment to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(asm => {
            const prog = programs.find(p => p.id === asm.programId);
            const qCount = assessmentQuestions.filter(q => q.assessmentId === asm.id).length;
            const candCount = assessmentCandidates.filter(c => c.assessmentId === asm.id).length;
            const attCount = assessmentAttempts.filter(a => a.assessmentId === asm.id).length;
            const link = assessmentLinks.find(l => l.assessmentId === asm.id);
            const isExpanded = expandedId === asm.id;

            return (
              <div key={asm.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : asm.id)}>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{asm.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[asm.status]}`}>{asm.status}</span>
                      </div>
                      {prog && <p className="text-sm text-blue-600 mb-2">{prog.name}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />{qCount} questions</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{asm.durationMinutes} min</span>
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />Pass: {asm.passPercentage}%</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{candCount} candidates</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {asm.status === 'Draft' && (
                        <button onClick={() => handlePublish(asm.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Publish</button>
                      )}
                      {asm.status === 'Published' && (
                        <>
                          <button onClick={() => {
                            const url = `${window.location.origin}/assessment/${link?.slug}`;
                            navigator.clipboard.writeText(url);
                            showToast('Link copied');
                          }} className="p-2 hover:bg-gray-100 rounded-lg" title="Copy link">
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => window.open(`/assessment/${link?.slug}`, '_blank')} className="p-2 hover:bg-gray-100 rounded-lg" title="Preview">
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                          </button>
                        </>
                      )}
                      <button onClick={() => setViewingResults(asm.id)} className="p-2 hover:bg-gray-100 rounded-lg" title="View results">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => openEdit(asm)} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(asm.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : asm.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                    {asm.description && <p className="text-sm text-gray-600 mb-3">{asm.description}</p>}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-sm">
                        <span className="text-gray-500">Max Attempts:</span> <span className="font-medium">{asm.maxAttempts}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Shuffle:</span> <span className="font-medium">{asm.shuffleQuestions ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Show Results:</span> <span className="font-medium">{asm.showResults !== false ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    {link && (
                      <div className="text-sm text-gray-500">
                        Link: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{window.location.origin}/assessment/{link.slug}</code>
                      </div>
                    )}
                    {asm.status === 'Published' && (
                      <button onClick={() => handleUnpublish(asm.id)} className="mt-3 text-xs text-red-600 hover:underline">Unpublish</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Assessment' : 'New Assessment'} wide>
        <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3">
          <button onClick={() => setTab('settings')} className={`px-4 py-2 text-sm rounded-lg ${tab === 'settings' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>Settings</button>
          <button onClick={() => setTab('questions')} className={`px-4 py-2 text-sm rounded-lg ${tab === 'questions' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>Questions ({questions.length})</button>
        </div>

        {tab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Assessment Title *</label>
              <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Final Assessment - Leadership Skills" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief description of the assessment" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Instructions</label>
              <textarea value={form.instructions} onChange={(e) => setForm(f => ({ ...f, instructions: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Instructions for candidates..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Program</label>
                <select value={form.programId} onChange={(e) => setForm(f => ({ ...f, programId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">No program</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
                <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Pass Percentage</label>
                <input type="number" min={0} max={100} value={form.passPercentage} onChange={(e) => setForm(f => ({ ...f, passPercentage: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Max Attempts</label>
                <input type="number" min={1} value={form.maxAttempts} onChange={(e) => setForm(f => ({ ...f, maxAttempts: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm(f => ({ ...f, shuffleQuestions: e.target.checked }))} className="rounded" />
                Shuffle Questions
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setForm(f => ({ ...f, shuffleOptions: e.target.checked }))} className="rounded" />
                Shuffle Options
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.showResults} onChange={(e) => setForm(f => ({ ...f, showResults: e.target.checked }))} className="rounded" />
                Show Results to Candidate
              </label>
            </div>
          </div>
        )}

        {tab === 'questions' && (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-400 font-mono w-6">{idx + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{q.questionType}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{q.questionText || 'Untitled question'}</span>
                <span className="text-xs text-gray-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                <button onClick={() => startEditQuestion(q)} className="p-1 hover:bg-gray-200 rounded"><Edit2 className="w-3.5 h-3.5 text-gray-500" /></button>
                <button onClick={() => removeQuestion(q.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ))}

            {editingQ ? (
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                    <select value={qForm.questionType} onChange={(e) => {
                      const type = e.target.value;
                      setQForm(f => ({
                        ...f, questionType: type,
                        correctAnswer: type === 'TrueFalse' ? 'true' : type === 'MultiSelect' ? [] : '',
                        options: (type === 'MCQ' || type === 'MultiSelect') ? f.options : [],
                      }));
                    }} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                      {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Points</label>
                    <input type="number" min={1} value={qForm.points} onChange={(e) => setQForm(f => ({ ...f, points: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  {qForm.questionType === 'Subjective' && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Answer Length</label>
                      <select value={qForm.subjectiveType} onChange={(e) => setQForm(f => ({ ...f, subjectiveType: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                        <option value="short">Short Answer</option>
                        <option value="long">Long Answer</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Question Text *</label>
                  <textarea value={qForm.questionText} onChange={(e) => setQForm(f => ({ ...f, questionText: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Enter your question..." />
                </div>

                {/* MCQ / MultiSelect Options */}
                {(qForm.questionType === 'MCQ' || qForm.questionType === 'MultiSelect') && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Options</label>
                    {qForm.options.map((opt, oi) => (
                      <div key={opt.id} className="flex items-center gap-2 mb-2">
                        {qForm.questionType === 'MCQ' ? (
                          <input type="radio" name="correctAnswer" checked={qForm.correctAnswer === opt.id} onChange={() => setQForm(f => ({ ...f, correctAnswer: opt.id }))} />
                        ) : (
                          <input type="checkbox" checked={Array.isArray(qForm.correctAnswer) && qForm.correctAnswer.includes(opt.id)} onChange={(e) => {
                            setQForm(f => {
                              const prev = Array.isArray(f.correctAnswer) ? f.correctAnswer : [];
                              return { ...f, correctAnswer: e.target.checked ? [...prev, opt.id] : prev.filter(x => x !== opt.id) };
                            });
                          }} />
                        )}
                        <input value={opt.text} onChange={(e) => {
                          setQForm(f => ({ ...f, options: f.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o) }));
                        }} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" placeholder={`Option ${oi + 1}`} />
                        {qForm.options.length > 2 && (
                          <button onClick={() => setQForm(f => ({ ...f, options: f.options.filter((_, i) => i !== oi) }))} className="p-1 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                    {qForm.options.length < 6 && (
                      <button onClick={() => setQForm(f => ({ ...f, options: [...f.options, { id: String(f.options.length + 1), text: '' }] }))} className="text-xs text-blue-600 hover:underline">+ Add option</button>
                    )}
                  </div>
                )}

                {/* True/False */}
                {qForm.questionType === 'TrueFalse' && (
                  <div className="mb-3 flex items-center gap-4">
                    <label className="text-xs font-medium text-gray-600">Correct Answer:</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="tfAnswer" checked={qForm.correctAnswer === 'true'} onChange={() => setQForm(f => ({ ...f, correctAnswer: 'true' }))} /> True</label>
                    <label className="flex items-center gap-1 text-sm"><input type="radio" name="tfAnswer" checked={qForm.correctAnswer === 'false'} onChange={() => setQForm(f => ({ ...f, correctAnswer: 'false' }))} /> False</label>
                  </div>
                )}

                {/* Fill in the Blank */}
                {qForm.questionType === 'FillBlank' && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Correct Answer</label>
                    <input value={qForm.correctAnswer} onChange={(e) => setQForm(f => ({ ...f, correctAnswer: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Expected answer (case-insensitive)" />
                  </div>
                )}

                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Explanation (optional)</label>
                  <input value={qForm.explanation} onChange={(e) => setQForm(f => ({ ...f, explanation: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Shown after answering" />
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={saveQuestion} disabled={!qForm.questionText.trim()} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">Save Question</button>
                  <button onClick={() => setEditingQ(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={addQuestion} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-2">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Create Assessment')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
