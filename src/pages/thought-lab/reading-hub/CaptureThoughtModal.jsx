import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../../../components/Modal';
import { useData } from '../../../context/DataContext';
import { THOUGHT_SUBTYPES, PILLARS } from '../constants';

const inputClass = 'w-full text-sm border border-[var(--rh-outline-variant)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--rh-primary)]/20 focus:border-[var(--rh-primary)]';

function categoryForSubtype(subtype, hasSource) {
  if (subtype === 'framework_seed') return 'Framework';
  if (subtype === 'thought' && !hasSource) return 'Quick Thought';
  return 'Book Idea';
}

const emptyForm = () => ({
  title: '',
  content: '',
  subtype: 'thought',
  chapter: '',
  page: '',
  originalHighlight: '',
  myInterpretation: '',
  myPerspective: '',
  whyItMatters: '',
  tags: '',
  pillar: '',
  potentialUses: '',
});

export default function CaptureThoughtModal({ open, onClose, initialSource, initialSubtype, initialContent, editingThought }) {
  const { addThought, updateThought } = useData();
  const [form, setForm] = useState(emptyForm());
  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingThought) {
      setForm({
        title: editingThought.title || '',
        content: editingThought.contentText || '',
        subtype: editingThought.thoughtSubtype || 'thought',
        chapter: editingThought.sourceChapter || '',
        page: editingThought.sourcePage || '',
        originalHighlight: editingThought.originalHighlight || '',
        myInterpretation: editingThought.myInterpretation || '',
        myPerspective: editingThought.myPerspective || '',
        whyItMatters: editingThought.whyItMatters || '',
        tags: (editingThought.tags || []).join(', '),
        pillar: editingThought.pillar || '',
        potentialUses: (editingThought.potentialUses || []).join(', '),
      });
      setMoreOpen(true);
    } else {
      setForm({ ...emptyForm(), subtype: initialSubtype || 'thought', content: initialContent || '' });
      setMoreOpen(false);
    }
    setSaveError('');
  }, [open, editingThought, initialSubtype, initialContent]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    setSaveError('');
    const hasSource = !!initialSource;
    const payload = {
      title: form.title.trim() || form.content.trim().slice(0, 60),
      content: {},
      contentText: form.content.trim(),
      category: categoryForSubtype(form.subtype, hasSource || !!editingThought?.sourceId),
      stage: editingThought?.stage || 'Idea',
      pillar: form.pillar,
      importance: editingThought?.importance || 'Medium',
      audience: editingThought?.audience || '',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      reuseScore: editingThought?.reuseScore || 0,
      aiInsights: editingThought?.aiInsights || [],
      readingTime: editingThought?.readingTime || 1,
      thoughtSubtype: form.subtype,
      sourceChapter: form.chapter.trim() || null,
      sourcePage: form.page.trim() || null,
      originalHighlight: form.originalHighlight.trim() || null,
      myInterpretation: form.myInterpretation.trim() || null,
      myPerspective: form.myPerspective.trim() || null,
      whyItMatters: form.whyItMatters.trim() || null,
      potentialUses: form.potentialUses.split(',').map(t => t.trim()).filter(Boolean),
    };

    const result = editingThought
      ? await updateThought(editingThought.id, payload)
      : await addThought({
        id: `TH${Date.now()}${Math.random().toString(36).slice(2, 4)}`,
        ...payload,
        originType: initialSource ? (initialSource.sourceType || 'book') : 'own_thought',
        sourceId: initialSource?.sourceId || null,
        sourceType: initialSource?.sourceType || null,
        sourceTitle: initialSource?.sourceTitle || null,
        sourceAuthor: initialSource?.sourceAuthor || null,
        developmentStatus: 'captured',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    setSaving(false);
    if (result?.error) {
      setSaveError(result.error);
      return;
    }
    onClose();
  };

  const sourceLabel = editingThought?.sourceTitle
    ? `${editingThought.sourceTitle}${editingThought.sourceAuthor ? ` — ${editingThought.sourceAuthor}` : ''}`
    : initialSource
      ? `${initialSource.sourceTitle}${initialSource.sourceAuthor ? ` — ${initialSource.sourceAuthor}` : ''}`
      : 'My Own Thought';

  return (
    <Modal open={open} onClose={onClose} title={editingThought ? 'Edit Thought' : 'Capture Thought'}>
      <div className="space-y-3">
        <textarea
          autoFocus
          value={form.content}
          onChange={set('content')}
          placeholder="What's the thought?"
          rows={3}
          className={`${inputClass} resize-none`}
        />
        <div className="flex gap-3">
          <select value={form.subtype} onChange={set('subtype')} className={inputClass}>
            {THOUGHT_SUBTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex-1 flex items-center px-3 py-2 rounded-lg border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-low)] text-sm text-[var(--rh-on-surface-variant)] truncate">
            {sourceLabel}
          </div>
        </div>
        <input value={form.title} onChange={set('title')} placeholder="Title (optional)" className={inputClass} />

        <button
          onClick={() => setMoreOpen(o => !o)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--rh-primary)] pt-1"
        >
          {moreOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />} More Context
        </button>

        {moreOpen && (
          <div className="space-y-3 pt-1">
            <div className="flex gap-3">
              <input value={form.chapter} onChange={set('chapter')} placeholder="Chapter or section" className={inputClass} />
              <input value={form.page} onChange={set('page')} placeholder="Page" className={inputClass} />
            </div>
            <textarea value={form.originalHighlight} onChange={set('originalHighlight')} placeholder="Original highlight / quote" rows={2} className={`${inputClass} resize-none`} />
            <textarea value={form.myInterpretation} onChange={set('myInterpretation')} placeholder="My interpretation — what does this mean to me?" rows={2} className={`${inputClass} resize-none`} />
            <textarea value={form.myPerspective} onChange={set('myPerspective')} placeholder="My perspective — what do I believe?" rows={2} className={`${inputClass} resize-none`} />
            <textarea value={form.whyItMatters} onChange={set('whyItMatters')} placeholder="Why this matters" rows={2} className={`${inputClass} resize-none`} />
            <input value={form.tags} onChange={set('tags')} placeholder="Tags, comma-separated" className={inputClass} />
            <select value={form.pillar} onChange={set('pillar')} className={inputClass}>
              <option value="">No content pillar</option>
              {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={form.potentialUses} onChange={set('potentialUses')} placeholder="Potential uses, comma-separated" className={inputClass} />
          </div>
        )}

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Couldn't save: {saveError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.content.trim()}
            className="px-5 py-2 bg-[var(--rh-primary)] text-[var(--rh-on-primary)] text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving...' : editingThought ? 'Save Changes' : 'Save Thought'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
