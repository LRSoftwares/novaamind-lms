import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import RichTextEditor from '../../components/thought-lab/RichTextEditor';
import { analyzeThought } from '../../lib/ai';
import { ArrowLeft, Save, Trash2, Clock, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { STAGES, CATEGORIES, PILLARS, IMPORTANCE_LEVELS, STAGE_COLORS } from './constants';

const emptyForm = () => ({
  title: '',
  content: {},
  contentText: '',
  category: 'Quick Thought',
  pillar: '',
  stage: 'Idea',
  importance: 'Medium',
  audience: '',
  tags: [],
  reuseScore: 0,
  aiInsights: [],
  readingTime: 0,
});

export default function ThoughtEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { thoughts, addThought, updateThought, deleteThought } = useData();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    if (!isNew) {
      const existing = thoughts.find(t => t.id === id);
      if (existing) setForm({ aiInsights: [], reuseScore: 0, ...existing });
    }
  }, [id, thoughts, isNew]);

  const handleEditorChange = useCallback((json, text) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    setForm(prev => ({ ...prev, content: json, contentText: text, readingTime }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim() && !form.contentText?.trim()) {
      showToast('Add a title or some content before saving');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim() || 'Untitled',
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      payload.id = `TH${Date.now()}`;
      payload.createdAt = new Date().toISOString();
      const { error } = await addThought(payload);
      if (error) {
        showToast(`Save failed: ${error}`);
        setSaving(false);
        return;
      }
      navigate(`/thought-lab/thought/${payload.id}`, { replace: true });
    } else {
      const { error } = await updateThought(id, payload);
      if (error) {
        showToast(`Save failed: ${error}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [form, isNew, id, addThought, updateThought, navigate, showToast]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this thought permanently?')) return;
    await deleteThought(id);
    navigate('/thought-lab/board');
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { reuseScore, insights } = await analyzeThought(form);
      const updates = { reuseScore, aiInsights: insights, aiAnalyzedAt: new Date().toISOString() };
      setForm(prev => ({ ...prev, ...updates }));
      if (!isNew) await updateThought(id, updates);
      showToast('Analysis complete');
    } catch (err) {
      showToast(err.message || 'Analysis failed');
    }
    setAnalyzing(false);
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,+$/, '');
      if (tag && !form.tags.includes(tag)) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-ios-bg)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-ios-surface)] border-b border-[var(--color-ios-border)] flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/thought-lab/board')}
            className="p-1.5 rounded-lg hover:bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLORS[form.stage] || 'bg-gray-100 text-gray-700'}`}>
            {form.stage}
          </span>
          {form.readingTime > 0 && (
            <span className="text-xs text-[var(--color-ios-text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {form.readingTime} min read
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isNew && (
            <>
              <button
                onClick={handleDelete}
                title="Delete"
                className="p-2 rounded-lg hover:bg-red-50 text-[var(--color-ios-text-muted)] hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-[var(--color-ios-border)] mx-1" />
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            <input
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Title..."
              className="w-full text-3xl font-bold text-[var(--color-ios-text)] border-none outline-none placeholder-gray-300 mb-5 bg-transparent leading-tight tracking-tight"
            />
            <RichTextEditor
              value={form.content}
              onChange={handleEditorChange}
              placeholder="Write your thought, framework, story, or insight..."
            />
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="w-64 flex-shrink-0 border-l border-[var(--color-ios-border)] bg-[var(--color-ios-surface-alt)] overflow-y-auto">
          <div className="px-4 py-5 space-y-5">

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wider mb-1.5">Stage</label>
              <select
                value={form.stage}
                onChange={e => setForm(prev => ({ ...prev, stage: e.target.value }))}
                className="w-full text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30"
              >
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wider mb-1.5">Content Pillar</label>
              <select
                value={form.pillar}
                onChange={e => setForm(prev => ({ ...prev, pillar: e.target.value }))}
                className="w-full text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30"
              >
                <option value="">None</option>
                {PILLARS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wider mb-1.5">Importance</label>
              <select
                value={form.importance}
                onChange={e => setForm(prev => ({ ...prev, importance: e.target.value }))}
                className="w-full text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30"
              >
                {IMPORTANCE_LEVELS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wider mb-1.5">Audience</label>
              <input
                value={form.audience}
                onChange={e => setForm(prev => ({ ...prev, audience: e.target.value }))}
                placeholder="e.g. CEOs, HR Leaders..."
                className="w-full text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30 placeholder-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wider mb-1.5">Tags</label>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type + Enter to add..."
                className="w-full text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30 placeholder-gray-300"
              />
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-[var(--color-ios-primary)]/10 text-[var(--color-ios-primary)] px-2 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-600 leading-none ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!isNew && form.createdAt && (
              <div className="text-xs text-[var(--color-ios-text-muted)] space-y-1 pt-2 border-t border-[var(--color-ios-border)]">
                <p>Created: {format(new Date(form.createdAt), 'MMM d, yyyy')}</p>
                {form.updatedAt && <p>Updated: {format(new Date(form.updatedAt), 'MMM d, h:mm a')}</p>}
              </div>
            )}

            {/* AI Analysis */}
            <div className="pt-2 border-t border-[var(--color-ios-border)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wider">AI Analysis</p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="text-xs text-[var(--color-ios-primary)] font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {analyzing ? 'Analyzing...' : 'Recalculate'}
                </button>
              </div>
              <div className="bg-white rounded-xl p-3.5 border border-[var(--color-ios-border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--color-ios-text-muted)]">Reuse Potential</span>
                  <span className="text-sm font-bold text-[var(--color-ios-primary)]">{form.reuseScore || 0}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-[var(--color-ios-primary)] rounded-full" style={{ width: `${form.reuseScore || 0}%` }} />
                </div>
                {form.aiInsights?.length > 0 ? (
                  <ul className="space-y-1.5">
                    {form.aiInsights.map((insight, i) => (
                      <li key={i} className="text-xs text-[var(--color-ios-text)] flex gap-1.5">
                        <span className="text-[var(--color-ios-primary)] flex-shrink-0">•</span>{insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--color-ios-text-muted)]">Run analysis to surface atomic insights and a reuse score.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
