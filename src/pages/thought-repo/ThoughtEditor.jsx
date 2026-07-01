import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import RichTextEditor from '../../components/thought-repo/RichTextEditor';
import { ArrowLeft, Save, Pin, Star, Trash2, Clock, Brain } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  'Quick Thought', 'Observation', 'Framework', 'Story', 'Lesson',
  'Book Idea', 'Research', 'Case Study', 'Quote', 'Workshop',
  'Newsletter', 'Podcast', 'LinkedIn', 'Twitter/X', 'Carousel', 'Video Script', 'Article',
];
const STATUSES = ['Idea', 'Draft', 'Review', 'Ready', 'Published', 'Archived'];
const PILLARS = [
  'AI Native Organizations', 'Leadership', 'Decision Intelligence', 'Digital Workforce',
  'AI Strategy', 'Enterprise AI', 'Future of Work', 'Business Systems', 'Organizational Memory',
  'AI Agents', 'Productivity', 'Education', 'Marketing', 'Sales', 'Personal', 'Books', 'Frameworks',
];

const STATUS_COLORS = {
  Idea: 'bg-gray-100 text-gray-700',
  Draft: 'bg-blue-100 text-blue-700',
  Review: 'bg-yellow-100 text-yellow-800',
  Ready: 'bg-green-100 text-green-700',
  Published: 'bg-indigo-100 text-indigo-700',
  Archived: 'bg-red-100 text-red-700',
};

const emptyForm = () => ({
  title: '',
  content: {},
  contentText: '',
  category: 'Quick Thought',
  pillar: '',
  status: 'Idea',
  audience: '',
  tags: [],
  isPinned: false,
  isFavourite: false,
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
  const [tagInput, setTagInput] = useState('');
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    if (!isNew) {
      const existing = thoughts.find(t => t.id === id);
      if (existing) setForm(existing);
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
      navigate(`/thought-repo/${payload.id}`, { replace: true });
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
    navigate('/thought-repo/all');
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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)', marginTop: '-24px', marginLeft: '-24px', marginRight: '-24px', marginBottom: '-24px' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/thought-repo/all')}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[form.status] || 'bg-gray-100 text-gray-700'}`}>
            {form.status}
          </span>
          {form.readingTime > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {form.readingTime} min read
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isNew && (
            <>
              <button
                onClick={() => setForm(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                title={form.isPinned ? 'Unpin' : 'Pin'}
                className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${form.isPinned ? 'text-amber-500' : 'text-gray-400'}`}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => setForm(prev => ({ ...prev, isFavourite: !prev.isFavourite }))}
                title={form.isFavourite ? 'Unfavourite' : 'Favourite'}
                className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${form.isFavourite ? 'text-rose-500' : 'text-gray-400'}`}
              >
                <Star className={`w-4 h-4 ${form.isFavourite ? 'fill-rose-500' : ''}`} />
              </button>
              <button
                onClick={handleDelete}
                title="Delete"
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
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
              className="w-full text-3xl font-bold text-gray-900 border-none outline-none placeholder-gray-300 mb-5 bg-transparent leading-tight"
            />
            <RichTextEditor
              value={form.content}
              onChange={handleEditorChange}
              placeholder="Write your thought, framework, story, or insight..."
            />
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="w-60 flex-shrink-0 border-l border-gray-200 bg-gray-50/80 overflow-y-auto">
          <div className="px-4 py-5 space-y-5">

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Content Pillar */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Content Pillar</label>
              <select
                value={form.pillar}
                onChange={e => setForm(prev => ({ ...prev, pillar: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {PILLARS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Audience</label>
              <input
                value={form.audience}
                onChange={e => setForm(prev => ({ ...prev, audience: e.target.value }))}
                placeholder="e.g. CEOs, HR Leaders..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-300"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tags</label>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type + Enter to add..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-300"
              />
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600 leading-none ml-0.5"
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setForm(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${form.isPinned ? 'bg-amber-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPinned ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-400" /> Pinned
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setForm(prev => ({ ...prev, isFavourite: !prev.isFavourite }))}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${form.isFavourite ? 'bg-rose-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFavourite ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-rose-400" /> Favourite
                </span>
              </label>
            </div>

            {/* Timestamps */}
            {!isNew && form.createdAt && (
              <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-200">
                <p>Created: {format(new Date(form.createdAt), 'MMM d, yyyy')}</p>
                {form.updatedAt && (
                  <p>Updated: {format(new Date(form.updatedAt), 'MMM d, h:mm a')}</p>
                )}
              </div>
            )}

            {/* AI stub */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Assistant</p>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center border border-indigo-100">
                <Brain className="w-8 h-8 mx-auto mb-2 text-indigo-300" />
                <p className="text-xs font-semibold text-indigo-700">Coming in Phase 3</p>
                <p className="text-xs text-indigo-400 mt-1 leading-relaxed">
                  Expand · Rewrite · Convert to LinkedIn, Newsletter, Script...
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl z-50 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
}
