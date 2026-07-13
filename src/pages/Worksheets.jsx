import { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { Plus, Edit2, Trash2, Search, X, Copy, ExternalLink, ChevronDown, ChevronUp, Eye, FileText, Users, ListChecks, Upload, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import { exportWorksheetSubmissionPdf } from '../utils/worksheetExport';
import { isPersonalityWorksheet, computeCategoryScores, CATEGORY_SUMMARIES } from '../lib/personalityProfile';

const QUESTION_TYPES = ['ShortAnswer', 'LongAnswer', 'MultipleChoice', 'Checklist', 'Rating'];
const QUESTION_TYPE_LABELS = {
  ShortAnswer: 'Short Answer', LongAnswer: 'Long Answer', MultipleChoice: 'Multiple Choice', Checklist: 'Checklist', Rating: 'Rating (1-5)',
};
const STATUS_COLORS = { Draft: 'bg-gray-100 text-gray-700', Published: 'bg-green-100 text-green-700', Archived: 'bg-amber-100 text-amber-700' };

const emptyForm = { title: '', description: '', instructions: '', programId: '' };

const emptyQuestion = {
  questionType: 'ShortAnswer', questionText: '', options: [{ id: '1', text: '' }, { id: '2', text: '' }], required: true,
};

const emptyCsvForm = { title: '', description: '', instructions: '', programId: '' };

const CSV_TEMPLATE = `Question Text,Type,Options,Required
"What was your key takeaway from this session?",LongAnswer,,Yes
"Rate your confidence applying this skill",Rating,,Yes
"Which topics would you like to revisit?",Checklist,"Topic A;Topic B;Topic C",No
"Select the technique you found most useful",MultipleChoice,"Technique 1;Technique 2",Yes
`;

// Maps common human-written type labels (e.g. "Short Text", "Dropdown") to our canonical question types
const TYPE_ALIASES = {
  shorttext: 'ShortAnswer', shortanswer: 'ShortAnswer', short: 'ShortAnswer', singleline: 'ShortAnswer', text: 'ShortAnswer',
  longtext: 'LongAnswer', longanswer: 'LongAnswer', long: 'LongAnswer', paragraph: 'LongAnswer', textarea: 'LongAnswer',
  multiplechoice: 'MultipleChoice', dropdown: 'MultipleChoice', singleselect: 'MultipleChoice', radio: 'MultipleChoice', select: 'MultipleChoice',
  checklist: 'Checklist', multiselect: 'Checklist', checkbox: 'Checklist', checkboxes: 'Checklist',
  rating: 'Rating', scale: 'Rating', ratingscale: 'Rating',
};

function normalizeQuestionType(raw) {
  const key = (raw || '').toLowerCase().replace(/[^a-z]/g, '');
  return TYPE_ALIASES[key] || 'ShortAnswer';
}

function parseQuestionsCsv(text) {
  const { data: rows } = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  return rows
    .map((row, i) => {
      const questionText = (row['Question Text'] || row.QuestionText || row.Question || row.question || '').trim();
      const questionType = normalizeQuestionType(row.Type || row.type || row.QuestionType || '');
      const optionsRaw = (row.Options || row.options || '').trim();
      const options = optionsRaw
        ? optionsRaw.split(';').map(o => o.trim()).filter(Boolean).map((text, oi) => ({ id: String(oi + 1), text }))
        : [];
      const requiredRaw = (row.Required || row.required || 'Yes').trim().toLowerCase();
      const required = requiredRaw !== 'no' && requiredRaw !== 'false';
      const id = `WQ${Date.now()}${i}${Math.random().toString(36).slice(2, 6)}`;
      return { id, questionText, questionType, options, required, sortOrder: i };
    })
    .filter(q => q.questionText);
}

export default function Worksheets() {
  const {
    programs, worksheets, worksheetQuestions, worksheetCandidates, worksheetSubmissions, worksheetResponses, worksheetLinks,
    addWorksheet, updateWorksheet, deleteWorksheet, publishWorksheet,
    addWorksheetQuestion, updateWorksheetQuestion, deleteWorksheetQuestion, deleteWorksheetLink, bulkAddWorksheetQuestions,
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
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvForm, setCsvForm] = useState(emptyCsvForm);
  const [csvFile, setCsvFile] = useState(null);
  const [csvSaving, setCsvSaving] = useState(false);
  const csvFileRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const openCsvImport = () => {
    setCsvForm({ ...emptyCsvForm });
    setCsvFile(null);
    setCsvModalOpen(true);
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'worksheet_questions_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = async () => {
    if (!csvForm.title.trim() || !csvFile) return;
    setCsvSaving(true);

    const text = await csvFile.text();
    const parsedQuestions = parseQuestionsCsv(text);
    if (parsedQuestions.length === 0) {
      setCsvSaving(false);
      showToast('No valid questions found in CSV. Check the template format.');
      return;
    }

    const id = `WKS${Date.now()}`;
    const { error } = await addWorksheet({ ...csvForm, id, status: 'Draft' });
    if (error) {
      setCsvSaving(false);
      showToast(`Error: ${error.message || error}`);
      return;
    }

    const { error: qErr } = await bulkAddWorksheetQuestions(parsedQuestions.map(q => ({ ...q, worksheetId: id })));

    setCsvSaving(false);
    setCsvModalOpen(false);
    setCsvFile(null);
    if (csvFileRef.current) csvFileRef.current.value = '';
    showToast(qErr
      ? `Worksheet created but questions failed to import: ${qErr.message || qErr}`
      : `Worksheet created with ${parsedQuestions.length} question(s) from CSV`);
  };

  const filtered = useMemo(() => {
    return worksheets.filter(w => {
      if (statusFilter !== 'All' && w.status !== statusFilter) return false;
      if (programFilter !== 'All' && w.programId !== programFilter) return false;
      if (search && !w.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [worksheets, search, statusFilter, programFilter]);

  const openNew = () => {
    setForm({ ...emptyForm });
    setQuestions([]);
    setEditing(null);
    setTab('settings');
    setEditingQ(null);
    setModalOpen(true);
  };

  const openEdit = (ws) => {
    setForm({
      title: ws.title, description: ws.description || '', instructions: ws.instructions || '', programId: ws.programId || '',
    });
    setQuestions(worksheetQuestions.filter(q => q.worksheetId === ws.id).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(ws.id);
    setTab('settings');
    setEditingQ(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

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
      await updateWorksheet(editing, form);
      for (const q of finalQuestions) {
        if (q._new) {
          const { _new, _dirty, ...rest } = q;
          const { error: qErr } = await addWorksheetQuestion({ ...rest, worksheetId: editing });
          if (qErr) console.error('[LMS] Failed to add question:', qErr);
        } else if (q._dirty) {
          const { _new, _dirty, ...rest } = q;
          await updateWorksheetQuestion(q.id, rest);
        }
      }
      const currentIds = new Set(finalQuestions.map(q => q.id));
      const existingQs = worksheetQuestions.filter(q => q.worksheetId === editing);
      for (const eq of existingQs) {
        if (!currentIds.has(eq.id)) await deleteWorksheetQuestion(eq.id);
      }
    } else {
      const id = `WKS${Date.now()}`;
      const { error } = await addWorksheet({ id, ...form, status: 'Draft' });
      if (error) {
        setSaving(false);
        showToast(`Error: ${error.message || error}`);
        return;
      }
      let qErrors = 0;
      for (let i = 0; i < finalQuestions.length; i++) {
        const { _new, _dirty, ...rest } = finalQuestions[i];
        const { error: qErr } = await addWorksheetQuestion({ ...rest, worksheetId: id, sortOrder: i });
        if (qErr) qErrors++;
      }
      if (qErrors > 0) {
        setSaving(false);
        showToast(`Worksheet created but ${qErrors} question(s) failed to save. Check console for details.`);
        setModalOpen(false);
        return;
      }
    }
    setSaving(false);
    setModalOpen(false);
    showToast(editing ? 'Worksheet updated' : `Worksheet created with ${finalQuestions.length} question(s)`);
  };

  const handlePublish = async (id) => {
    const existing = worksheetLinks.find(l => l.worksheetId === id);
    if (existing) {
      const url = `${window.location.origin}/worksheet/${existing.slug}`;
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
      return;
    }
    const { slug, error } = await publishWorksheet(id);
    if (!error) {
      const url = `${window.location.origin}/worksheet/${slug}`;
      navigator.clipboard.writeText(url);
      showToast('Published! Link copied to clipboard');
    }
  };

  const handleUnpublish = async (id) => {
    await updateWorksheet(id, { status: 'Draft' });
    const link = worksheetLinks.find(l => l.worksheetId === id);
    if (link) await deleteWorksheetLink(link.id);
    showToast('Worksheet unpublished');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this worksheet and all its questions, submissions, and links?')) return;
    await deleteWorksheet(id);
    showToast('Worksheet deleted');
  };

  const addQuestion = () => {
    const id = `WQ${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
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
      required: q.required !== false,
    });
    setEditingQ(q);
  };

  // --- Submissions View ---
  if (viewingSubmissions) {
    const ws = worksheets.find(w => w.id === viewingSubmissions);
    const submissions = worksheetSubmissions.filter(s => s.worksheetId === viewingSubmissions);
    const candidates = worksheetCandidates.filter(c => c.worksheetId === viewingSubmissions);
    const worksheetQs = worksheetQuestions.filter(q => q.worksheetId === viewingSubmissions).sort((a, b) => a.sortOrder - b.sortOrder);

    if (selectedSubmission) {
      const sub = submissions.find(s => s.id === selectedSubmission);
      const candidate = candidates.find(c => c.id === sub?.candidateId);
      const responses = worksheetResponses.filter(r => r.submissionId === selectedSubmission);
      const qs = worksheetQuestions.filter(q => q.worksheetId === viewingSubmissions).sort((a, b) => a.sortOrder - b.sortOrder);
      const isProfile = isPersonalityWorksheet(qs);
      const parseAnswer = (raw) => { let a = raw; try { if (typeof a === 'string') a = JSON.parse(a); } catch {} return a; };
      const ranked = isProfile
        ? computeCategoryScores(qs, responses.reduce((acc, r) => { acc[r.questionId] = parseAnswer(r.answer); return acc; }, {}))
        : [];
      const primary = ranked[0];

      return (
        <div>
          <button onClick={() => setSelectedSubmission(null)} className="text-sm text-blue-600 hover:underline mb-4">← Back to submissions</button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{candidate?.name || 'Unknown'}</h2>
              <p className="text-sm text-gray-500">{candidate?.email}</p>
              {candidate?.phone && <p className="text-sm text-gray-400">{candidate.phone}</p>}
              {candidate?.company && <p className="text-sm text-gray-400">{candidate.company}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${sub?.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {sub?.status === 'Submitted' ? 'Submitted' : 'In Progress'}
              </span>
              {sub?.status === 'Submitted' && (
                <button
                  onClick={() => exportWorksheetSubmissionPdf({ worksheet: ws, candidate, submission: sub, questions: qs, responses })}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <p className="text-xs text-gray-500">Started</p>
              <p className="text-sm font-medium">{sub?.startedAt ? new Date(sub.startedAt).toLocaleString() : '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="text-sm font-medium">{sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}</p>
            </div>
          </div>

          {isProfile && primary && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ background: primary.color }}>
                  {primary.category[0]}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">Primary Type</p>
                  <p className="text-base font-semibold text-gray-900">{primary.category}</p>
                </div>
              </div>
              {CATEGORY_SUMMARIES[primary.category] && <p className="text-sm text-gray-600 mb-4">{CATEGORY_SUMMARIES[primary.category]}</p>}
              <div className="space-y-2">
                {ranked.map(cat => (
                  <div key={cat.category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.category}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{cat.total} / {cat.max} · {cat.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, background: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {qs.map((q, idx) => {
              const resp = responses.find(r => r.questionId === q.id);
              let answer = resp?.answer;
              try { if (typeof answer === 'string') answer = JSON.parse(answer); } catch {}

              return (
                <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{QUESTION_TYPE_LABELS[q.questionType]}</span>
                  </div>
                  <p className="text-gray-900 mb-3">{q.questionText}</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs text-gray-500 mb-1">Response</p>
                    <p className="font-medium">{Array.isArray(answer) ? answer.join(', ') : (answer ?? 'No answer')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        <button onClick={() => { setViewingSubmissions(null); setSelectedSubmission(null); }} className="text-sm text-blue-600 hover:underline mb-4">← Back to worksheets</button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{ws?.title} — Submissions</h2>
            <p className="text-sm text-gray-500">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} · {candidates.length} participant{candidates.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No submissions yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Participant</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Submitted</th>
                  <th className="px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  const cand = candidates.find(c => c.id === sub.candidateId);
                  return (
                    <tr key={sub.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedSubmission(sub.id)}>
                      <td className="px-4 py-3 font-medium">{cand?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{cand?.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {sub.status === 'Submitted' ? 'Submitted' : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {sub.status === 'Submitted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const responses = worksheetResponses.filter(r => r.submissionId === sub.id);
                                exportWorksheetSubmissionPdf({ worksheet: ws, candidate: cand, submission: sub, questions: worksheetQs, responses });
                              }}
                              title="Download PDF"
                              className="p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                              <Download className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Worksheets</h1>
          <p className="text-sm text-gray-500 mt-1">Create fill-and-submit worksheets for your training programs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCsvImport} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={openNew} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Worksheet
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search worksheets..."
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
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium mb-1">No worksheets yet</p>
          <p className="text-sm">Create your first worksheet to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ws => {
            const prog = programs.find(p => p.id === ws.programId);
            const qCount = worksheetQuestions.filter(q => q.worksheetId === ws.id).length;
            const candCount = worksheetCandidates.filter(c => c.worksheetId === ws.id).length;
            const subCount = worksheetSubmissions.filter(s => s.worksheetId === ws.id && s.status === 'Submitted').length;
            const link = worksheetLinks.find(l => l.worksheetId === ws.id);
            const isExpanded = expandedId === ws.id;

            return (
              <div key={ws.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ws.id)}>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{ws.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ws.status]}`}>{ws.status}</span>
                      </div>
                      {prog && <p className="text-sm text-blue-600 mb-2">{prog.name}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" />{qCount} questions</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{candCount} participants</span>
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{subCount} submitted</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {ws.status === 'Draft' && (
                        <button onClick={() => handlePublish(ws.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Publish</button>
                      )}
                      {ws.status === 'Published' && (
                        <>
                          <button onClick={() => {
                            const url = `${window.location.origin}/worksheet/${link?.slug}`;
                            navigator.clipboard.writeText(url);
                            showToast('Link copied');
                          }} className="p-2 hover:bg-gray-100 rounded-lg" title="Copy link">
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => window.open(`/worksheet/${link?.slug}`, '_blank')} className="p-2 hover:bg-gray-100 rounded-lg" title="Preview">
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                          </button>
                        </>
                      )}
                      <button onClick={() => setViewingSubmissions(ws.id)} className="p-2 hover:bg-gray-100 rounded-lg" title="View submissions">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => openEdit(ws)} className="p-2 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(ws.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : ws.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                    {ws.description && <p className="text-sm text-gray-600 mb-3">{ws.description}</p>}
                    {link && (
                      <div className="text-sm text-gray-500">
                        Link: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{window.location.origin}/worksheet/{link.slug}</code>
                      </div>
                    )}
                    {ws.status === 'Published' && (
                      <button onClick={() => handleUnpublish(ws.id)} className="mt-3 text-xs text-red-600 hover:underline">Unpublish</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Worksheet' : 'New Worksheet'} wide>
        <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3">
          <button onClick={() => setTab('settings')} className={`px-4 py-2 text-sm rounded-lg ${tab === 'settings' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>Settings</button>
          <button onClick={() => setTab('questions')} className={`px-4 py-2 text-sm rounded-lg ${tab === 'questions' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>Questions ({questions.length})</button>
        </div>

        {tab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Worksheet Title *</label>
              <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Week 1 Reflection Worksheet" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief description of the worksheet" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Instructions</label>
              <textarea value={form.instructions} onChange={(e) => setForm(f => ({ ...f, instructions: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Instructions for participants..." />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Program</label>
              <select value={form.programId} onChange={(e) => setForm(f => ({ ...f, programId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">No program</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === 'questions' && (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-400 font-mono w-6">{idx + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{QUESTION_TYPE_LABELS[q.questionType]}</span>
                <span className="flex-1 text-sm text-gray-700 truncate">{q.questionText || 'Untitled question'}</span>
                {q.required === false && <span className="text-xs text-gray-400">optional</span>}
                <button onClick={() => startEditQuestion(q)} className="p-1 hover:bg-gray-200 rounded"><Edit2 className="w-3.5 h-3.5 text-gray-500" /></button>
                <button onClick={() => removeQuestion(q.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ))}

            {editingQ ? (
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                    <select value={qForm.questionType} onChange={(e) => {
                      const type = e.target.value;
                      setQForm(f => ({
                        ...f, questionType: type,
                        options: (type === 'MultipleChoice' || type === 'Checklist') ? f.options : [],
                      }));
                    }} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                      {QUESTION_TYPES.map(t => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm mb-1.5">
                      <input type="checkbox" checked={qForm.required} onChange={(e) => setQForm(f => ({ ...f, required: e.target.checked }))} className="rounded" />
                      Required
                    </label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Question / Prompt Text *</label>
                  <textarea value={qForm.questionText} onChange={(e) => setQForm(f => ({ ...f, questionText: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Enter your question or prompt..." />
                </div>

                {/* MultipleChoice / Checklist Options */}
                {(qForm.questionType === 'MultipleChoice' || qForm.questionType === 'Checklist') && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Options</label>
                    {qForm.options.map((opt, oi) => (
                      <div key={opt.id} className="flex items-center gap-2 mb-2">
                        <input value={opt.text} onChange={(e) => {
                          setQForm(f => ({ ...f, options: f.options.map((o, i) => i === oi ? { ...o, text: e.target.value } : o) }));
                        }} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" placeholder={`Option ${oi + 1}`} />
                        {qForm.options.length > 2 && (
                          <button onClick={() => setQForm(f => ({ ...f, options: f.options.filter((_, i) => i !== oi) }))} className="p-1 text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    ))}
                    {qForm.options.length < 8 && (
                      <button onClick={() => setQForm(f => ({ ...f, options: [...f.options, { id: String(f.options.length + 1), text: '' }] }))} className="text-xs text-blue-600 hover:underline">+ Add option</button>
                    )}
                  </div>
                )}

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
            {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Create Worksheet')}
          </button>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Import Worksheet from CSV">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Worksheet Title *</label>
            <input value={csvForm.title} onChange={(e) => setCsvForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Week 1 Reflection Worksheet" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea value={csvForm.description} onChange={(e) => setCsvForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief description of the worksheet" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Program</label>
            <select value={csvForm.programId} onChange={(e) => setCsvForm(f => ({ ...f, programId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">No program</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Questions CSV *</label>
              <button onClick={downloadCsvTemplate} className="text-xs text-blue-600 hover:underline">Download template</button>
            </div>
            <input ref={csvFileRef} type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0] || null)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm" />
            <p className="text-xs text-gray-400 mt-1.5">Columns: Question Text, Type (ShortAnswer, LongAnswer, MultipleChoice, Checklist, Rating), Options (semicolon-separated, for choice types), Required (Yes/No)</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setCsvModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleCsvImport} disabled={csvSaving || !csvForm.title.trim() || !csvFile} className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {csvSaving ? 'Importing...' : 'Import & Create Worksheet'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
