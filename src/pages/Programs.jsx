import { useState, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, FileUp, X, FileText, Image, File, ChevronDown, ChevronUp, Target, Link2, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

const DEPARTMENTS = ['Marketing', 'Tech', 'Sales', 'Operations', 'HR'];
const STATUSES = ['Active', 'Upcoming', 'Completed', 'Archived'];

const emptyForm = {
  name: '', shortCode: '', description: '', departmentTarget: [],
  sessionsRequired: 3, passScoreThreshold: 70, startDate: '', endDate: '',
  status: 'Active', trainerId: '', coTrainerId: '',
  summary: '', learningOutcomes: [''],
};

const FILE_ICONS = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  ppt: File,
  pptx: File,
  xls: File,
  xlsx: File,
  png: Image,
  jpg: Image,
  jpeg: Image,
};

function getFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || File;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Programs() {
  const { programs, trainers, enrolments, programFiles, addProgram, updateProgram, deleteProgram, addProgramFile, removeProgramFile } = useData();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedProg, setExpandedProg] = useState(null);
  const fileRef = useRef();
  const modalFileRef = useRef();
  const [uploadingFor, setUploadingFor] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingUrls, setPendingUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlLabel, setUrlLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() =>
    programs.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.shortCode?.toLowerCase().includes(search.toLowerCase())
    ), [programs, search]);

  const openNew = () => {
    setForm({ ...emptyForm, learningOutcomes: [''] });
    setEditing(null);
    setPendingFiles([]);
    setPendingUrls([]);
    setUrlInput('');
    setUrlLabel('');
    setModalOpen(true);
  };
  const openEdit = (prog) => {
    setForm({
      ...prog,
      summary: prog.summary || '',
      learningOutcomes: prog.learningOutcomes?.length ? prog.learningOutcomes : [''],
    });
    setEditing(prog.id);
    setPendingFiles([]);
    setPendingUrls([]);
    setUrlInput('');
    setUrlLabel('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cleaned = {
      ...form,
      learningOutcomes: form.learningOutcomes.filter(o => o.trim()),
      trainerId: form.trainerId || null,
      coTrainerId: form.coTrainerId || null,
      urls: form.urls || [],
    };

    let programId = editing;
    let result;
    if (editing) {
      // Save URLs as part of program data
      const urlsToSave = [...(cleaned.urls || []), ...pendingUrls];
      result = await updateProgram(editing, { ...cleaned, urls: urlsToSave });
    } else {
      programId = `P${Date.now()}`;
      const urlsToSave = [...pendingUrls];
      result = await addProgram({ ...cleaned, id: programId, urls: urlsToSave });
    }
    if (result?.error) {
      alert(`Failed to save program: ${result.error.message}`);
      setSaving(false);
      return;
    }

    // Upload pending files
    if (pendingFiles.length > 0 && programId) {
      for (const file of pendingFiles) {
        await addProgramFile(programId, file);
      }
    }

    setPendingFiles([]);
    setPendingUrls([]);
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this program? Associated enrolments will remain.')) {
      await deleteProgram(id);
    }
  };

  const toggleDept = (dept) => {
    setForm(f => ({
      ...f,
      departmentTarget: f.departmentTarget.includes(dept)
        ? f.departmentTarget.filter(d => d !== dept)
        : [...f.departmentTarget, dept]
    }));
  };

  const updateOutcome = (index, value) => {
    setForm(f => {
      const outcomes = [...f.learningOutcomes];
      outcomes[index] = value;
      return { ...f, learningOutcomes: outcomes };
    });
  };

  const addOutcome = () => {
    setForm(f => ({ ...f, learningOutcomes: [...f.learningOutcomes, ''] }));
  };

  const removeOutcome = (index) => {
    setForm(f => ({
      ...f,
      learningOutcomes: f.learningOutcomes.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!uploadingFor || !files.length) return;

    for (const file of files) {
      await addProgramFile(uploadingFor, file);
    }
    e.target.value = '';
  };

  const handleRemoveFile = async (progId, fileId) => {
    if (confirm('Remove this file?')) {
      await removeProgramFile(progId, fileId);
    }
  };

  const downloadFile = (file) => {
    const url = file.url || file.storagePath;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getTrainerName = (id) => trainers.find(t => t.id === id)?.name || '-';
  const getEnrolCount = (progId) => enrolments.filter(e => e.programId === progId).length;

  const statusColor = {
    Active: 'bg-green-100 text-green-700',
    Upcoming: 'bg-blue-100 text-blue-700',
    Completed: 'bg-gray-100 text-gray-700',
    Archived: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-500 text-sm mt-1">Create programs, add files, and define learning outcomes</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Program
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>

        <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.zip" onChange={handleFileUpload} className="hidden" />

        <div className="divide-y">
          {filtered.map(prog => {
            const isExpanded = expandedProg === prog.id;
            const files = programFiles[prog.id] || [];
            const FileIcon = FileText;

            return (
              <div key={prog.id}>
                <div className="flex items-center hover:bg-gray-50 transition-colors">
                  <button onClick={() => setExpandedProg(isExpanded ? null : prog.id)} className="p-4 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  <div className="flex-1 py-3 grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{prog.name}</p>
                      <p className="text-xs text-gray-400">{prog.shortCode} · {files.length} file{files.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {prog.departmentTarget?.map(d => (
                        <span key={d} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d}</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{prog.sessionsRequired} sessions</span>
                    <span className="text-sm text-gray-600">{prog.passScoreThreshold}%</span>
                    <span className="text-sm text-gray-600">{getEnrolCount(prog.id)} enrolled</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[prog.status] || ''}`}>{prog.status}</span>
                    <div className="flex gap-1 pr-4">
                      <button onClick={() => openEdit(prog)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => { setUploadingFor(prog.id); fileRef.current?.click(); }} className="p-1.5 rounded hover:bg-blue-50"><FileUp className="w-4 h-4 text-blue-500" /></button>
                      <button onClick={() => handleDelete(prog.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-12 pb-5 bg-gray-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Summary & Outcomes */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-blue-600" /> Program Summary
                        </h4>
                        {prog.summary ? (
                          <p className="text-sm text-gray-600 mb-4 bg-white p-3 rounded-lg border">{prog.summary}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic mb-4">No summary added yet. Edit program to add one.</p>
                        )}

                        {prog.learningOutcomes?.filter(o => o).length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">What participants will achieve</h4>
                            <ul className="space-y-1.5">
                              {prog.learningOutcomes.filter(o => o).map((outcome, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                                  {outcome}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-400">
                          <span>Trainer: {getTrainerName(prog.trainerId)}</span>
                          {prog.coTrainerId && <span> · Co-trainer: {getTrainerName(prog.coTrainerId)}</span>}
                          {prog.startDate && <span> · {prog.startDate} to {prog.endDate}</span>}
                        </div>
                      </div>

                      {/* Files */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">Program Files</h4>
                          <button onClick={() => { setUploadingFor(prog.id); fileRef.current?.click(); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            <FileUp className="w-3 h-3" /> Add Files
                          </button>
                        </div>
                        {files.length === 0 ? (
                          <div
                            className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                            onClick={() => { setUploadingFor(prog.id); fileRef.current?.click(); }}
                          >
                            <FileUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Click to upload program materials</p>
                            <p className="text-xs text-gray-300 mt-1">PDF, PPT, DOCX, images, etc.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[250px] overflow-auto">
                            {files.map((file, idx) => {
                              const Icon = getFileIcon(file.name);
                              return (
                                <div key={file.id || idx} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border hover:shadow-sm transition-shadow group">
                                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600" onClick={() => downloadFile(file)}>{file.name}</p>
                                    <p className="text-xs text-gray-400">{formatFileSize(file.size)} · {new Date(file.uploadedAt || file.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <button onClick={() => handleRemoveFile(prog.id, file.id)} className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* URL Links */}
                        {prog.urls?.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Links</h4>
                            <div className="space-y-1">
                              {prog.urls.map((u, i) => (
                                <a key={i} href={u.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-800 hover:underline p-1.5 rounded hover:bg-purple-50">
                                  <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{u.label}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No programs found</div>}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Program' : 'Create New Program'} wide>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Code</label>
              <input value={form.shortCode} onChange={e => setForm({ ...form, shortCode: e.target.value })} placeholder="e.g., CLAUDE-AI-01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Summary</label>
            <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={3} placeholder="Describe what this program covers and how it helps participants..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What participants will achieve</label>
            <div className="space-y-2">
              {form.learningOutcomes.map((outcome, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-8 flex items-center justify-center text-xs text-gray-400 font-medium">{i + 1}.</span>
                  <input
                    value={outcome}
                    onChange={e => updateOutcome(i, e.target.value)}
                    placeholder={`Outcome ${i + 1}, e.g., "Understand how to use Claude AI for daily workflows"`}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {form.learningOutcomes.length > 1 && (
                    <button type="button" onClick={() => removeOutcome(i)} className="p-1.5 rounded hover:bg-red-50">
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOutcome} className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-8">+ Add another outcome</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Departments</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(d => (
                <button key={d} type="button" onClick={() => toggleDept(d)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.departmentTarget?.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>{d}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sessions Required</label>
              <input type="number" min="1" required value={form.sessionsRequired} onChange={e => setForm({ ...form, sessionsRequired: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pass Score (%)</label>
              <input type="number" min="0" max="100" required value={form.passScoreThreshold} onChange={e => setForm({ ...form, passScoreThreshold: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Trainer</label>
              <select value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select trainer</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Co-Trainer (Optional)</label>
              <select value={form.coTrainerId || ''} onChange={e => setForm({ ...form, coTrainerId: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">None</option>
                {trainers.filter(t => t.id !== form.trainerId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          {/* Files & URLs */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Program Materials</label>
            <div className="grid grid-cols-2 gap-4">
              {/* File upload */}
              <div>
                <input type="file" ref={modalFileRef} multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.zip" onChange={e => {
                  const files = Array.from(e.target.files);
                  if (files.length) setPendingFiles(prev => [...prev, ...files]);
                  e.target.value = '';
                }} className="hidden" />
                <button type="button" onClick={() => modalFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                  <FileUp className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Click to add files</p>
                  <p className="text-xs text-gray-300">PDF, PPT, DOCX, images, etc.</p>
                </button>
                {pendingFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-blue-50 px-2.5 py-1.5 rounded-lg">
                        <span className="truncate text-blue-700">{f.name} <span className="text-blue-400">({(f.size / 1024).toFixed(0)} KB)</span></span>
                        <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-0.5 hover:bg-blue-100 rounded"><X className="w-3 h-3 text-blue-400" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Existing files (when editing) */}
                {editing && (programFiles[editing] || []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {(programFiles[editing] || []).map(f => (
                      <div key={f.id} className="flex items-center justify-between text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        <span className="truncate text-gray-700 cursor-pointer hover:text-blue-600" onClick={() => downloadFile(f)}>{f.name}</span>
                        <button type="button" onClick={() => handleRemoveFile(editing, f.id)} className="p-0.5 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-400" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* URL links */}
              <div>
                <div className="flex gap-2 mb-2">
                  <input value={urlLabel} onChange={e => setUrlLabel(e.target.value)} placeholder="Label (e.g., Course Slides)" className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) { e.preventDefault(); setPendingUrls(prev => [...prev, { label: urlLabel || urlInput, url: urlInput }]); setUrlInput(''); setUrlLabel(''); } }} />
                  </div>
                  <button type="button" onClick={() => { if (urlInput.trim()) { setPendingUrls(prev => [...prev, { label: urlLabel || urlInput, url: urlInput }]); setUrlInput(''); setUrlLabel(''); } }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 font-medium">Add</button>
                </div>
                {/* Pending URLs */}
                {pendingUrls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {pendingUrls.map((u, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-purple-50 px-2.5 py-1.5 rounded-lg">
                        <div className="truncate"><span className="text-purple-700 font-medium">{u.label}</span> <span className="text-purple-400 truncate">{u.url.length > 30 ? u.url.slice(0, 30) + '...' : u.url}</span></div>
                        <button type="button" onClick={() => setPendingUrls(prev => prev.filter((_, idx) => idx !== i))} className="p-0.5 hover:bg-purple-100 rounded"><X className="w-3 h-3 text-purple-400" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Existing URLs (when editing) */}
                {editing && form.urls?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {form.urls.map((u, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg">
                        <a href={u.url} target="_blank" rel="noreferrer" className="truncate text-purple-600 hover:underline">{u.label}</a>
                        <button type="button" onClick={() => setForm(f => ({ ...f, urls: f.urls.filter((_, idx) => idx !== i) }))} className="p-0.5 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-400" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Update' : 'Create'} Program
              {pendingFiles.length > 0 && ` + ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
