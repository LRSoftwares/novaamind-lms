import { useState, useEffect } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CATEGORIES } from '../../pages/thought-lab/constants';

export default function QuickCaptureModal() {
  const { addThought } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'Quick Thought', tags: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() && !form.content.trim()) return;
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const content = form.content.trim()
      ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: form.content }] }] }
      : {};
    await addThought({
      id: `TH${Date.now()}`,
      title: form.title.trim() || 'Untitled',
      content,
      contentText: form.content,
      category: form.category,
      stage: 'Idea',
      importance: 'Medium',
      tags,
      pillar: '',
      audience: '',
      reuseScore: 0,
      aiInsights: [],
      readingTime: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    setForm({ title: '', content: '', category: 'Quick Thought', tags: '' });
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Quick Capture (Cmd+N)"
        className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--color-ios-primary)] text-white rounded-full shadow-xl hover:opacity-90 flex items-center justify-center transition-all hover:scale-105 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onKeyDown={handleKeyDown}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-ios-border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[var(--color-ios-primary)]/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[var(--color-ios-primary)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-ios-text)]">Quick Capture</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              <input
                autoFocus
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's the idea?"
                className="w-full text-xl font-semibold text-[var(--color-ios-text)] border-none outline-none placeholder-gray-300 bg-transparent"
              />
              <textarea
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Expand on it... (optional)"
                rows={4}
                className="w-full text-sm text-[var(--color-ios-text)] border border-[var(--color-ios-border)] rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30 placeholder-gray-300"
              />
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="flex-1 text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30 bg-white text-[var(--color-ios-text)]"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input
                  value={form.tags}
                  onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags, comma-separated"
                  className="flex-1 text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/30 placeholder-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 pb-5">
              <p className="text-xs text-[var(--color-ios-text-muted)]">Cmd+Enter to save</p>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-[var(--color-ios-text-muted)] hover:bg-[var(--color-ios-surface-alt)] rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (!form.title.trim() && !form.content.trim())}
                  className="px-5 py-2 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? 'Saving...' : 'Capture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
