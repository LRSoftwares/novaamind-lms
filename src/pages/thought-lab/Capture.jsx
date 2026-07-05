import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { formatDistanceToNow } from 'date-fns';
import { Hash, ListTree, AlertCircle, Sparkles } from 'lucide-react';
import IOSTopBar from './IOSTopBar';
import { CATEGORIES, IMPORTANCE_LEVELS } from './constants';

export default function Capture() {
  const { thoughts, addThought } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', content: '', category: 'Quick Thought', importance: 'Medium', tags: '' });
  const [saving, setSaving] = useState(false);

  const inbox = useMemo(() => (
    thoughts.filter(t => t.stage === 'Idea').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  ), [thoughts]);

  const handleSend = async () => {
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
      importance: form.importance,
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
    setForm({ title: '', content: '', category: 'Quick Thought', importance: 'Medium', tags: '' });
  };

  return (
    <div>
      <IOSTopBar search={search} onSearchChange={setSearch} searchPlaceholder="Command + K to search..." />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Quick Thought composer */}
        <div className="bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)] p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[var(--color-ios-text)]">Quick Thought</h2>
            <span className="text-xs bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)] px-2.5 py-1 rounded-full">Markdown enabled</span>
          </div>
          <input
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter your intellectual nugget here..."
            className="w-full text-lg font-medium text-[var(--color-ios-text)] border-none outline-none placeholder-gray-300 bg-transparent mb-2"
          />
          <textarea
            value={form.content}
            onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Expand on it..."
            rows={4}
            className="w-full text-sm text-[var(--color-ios-text)] border-none outline-none placeholder-gray-300 bg-transparent resize-none"
          />
          <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-[var(--color-ios-border)]">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="flex items-center gap-1.5 text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white text-[var(--color-ios-text)]"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Tags..."
                className="text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 w-40 placeholder-gray-300"
              />
              <select
                value={form.importance}
                onChange={e => setForm(prev => ({ ...prev, importance: e.target.value }))}
                className="text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 bg-white text-[var(--color-ios-text)]"
              >
                {IMPORTANCE_LEVELS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <button
              onClick={handleSend}
              disabled={saving || (!form.title.trim() && !form.content.trim())}
              className="flex-shrink-0 px-5 py-2 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Sending...' : 'Send to Inbox'}
            </button>
          </div>
        </div>

        {/* Capture Inbox */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-bold text-[var(--color-ios-text)]">Capture Inbox</h2>
            <span className="text-xs bg-[var(--color-ios-primary)]/10 text-[var(--color-ios-primary)] px-2.5 py-1 rounded-full font-medium">{inbox.length} NEW</span>
          </div>

          {inbox.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[var(--color-ios-border)] rounded-2xl">
              <ListTree className="w-10 h-10 mx-auto text-[var(--color-ios-text-muted)] mb-3" />
              <p className="text-sm text-[var(--color-ios-text-muted)]">Nothing waiting for triage. Capture something above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inbox.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/thought-lab/thought/${t.id}`)}
                  className="bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)] p-4 cursor-pointer hover:border-[var(--color-ios-primary)]/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ios-text-muted)] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {t.category}
                    </span>
                    {t.importance === 'High' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <h3 className="font-semibold text-[var(--color-ios-text)] text-sm leading-snug mb-1.5 line-clamp-2">{t.title || 'Untitled'}</h3>
                  {t.contentText && <p className="text-xs text-[var(--color-ios-text-muted)] line-clamp-2 mb-2">{t.contentText}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {(t.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-[11px] bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Hash className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-300">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
