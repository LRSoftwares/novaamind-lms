import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDistanceToNow } from 'date-fns';
import { Sparkles, Loader2, Send } from 'lucide-react';
import IOSTopBar from './IOSTopBar';
import { generateVariant } from '../../lib/ai';
import { GENERATE_FORMATS } from './constants';

export default function ContentStudio() {
  const { thoughts, addThought } = useData();
  const [search, setSearch] = useState('');
  const [sourceId, setSourceId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [format, setFormat] = useState('');
  const [tone, setTone] = useState('Sophisticated');
  const [generating, setGenerating] = useState(null);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState('');

  const sources = useMemo(() => (
    [...thoughts].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 30)
  ), [thoughts]);

  const source = thoughts.find(t => t.id === sourceId) || null;

  const selectSource = (t) => {
    setSourceId(t.id);
    setDraftTitle(t.title || '');
    setDraftBody(t.contentText || '');
    setFormat('');
    setQueued(false);
  };

  const handleGenerate = async (fmt) => {
    if (!source) { setError('Select a source thought first.'); return; }
    setGenerating(fmt);
    setError('');
    try {
      const result = await generateVariant(source, fmt, tone);
      setFormat(fmt);
      setDraftTitle(result.title || draftTitle);
      setDraftBody(result.body || draftBody);
      setQueued(false);
    } catch (err) {
      setError(err.message || 'Generation failed');
    }
    setGenerating(null);
  };

  const handleFinalize = async () => {
    if (!draftTitle.trim() && !draftBody.trim()) return;
    const newId = `TH${Date.now()}`;
    await addThought({
      id: newId,
      title: draftTitle.trim() || 'Untitled',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: draftBody }] }] },
      contentText: draftBody,
      category: format || source?.category || 'Article',
      stage: 'Ready',
      importance: source?.importance || 'Medium',
      pillar: source?.pillar || '',
      tags: source?.tags || [],
      sourceThoughtId: source?.id || null,
      reuseScore: 0,
      aiInsights: [],
      readingTime: Math.max(1, Math.ceil(draftBody.split(/\s+/).filter(Boolean).length / 200)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setQueued(true);
    setTimeout(() => setQueued(false), 2500);
  };

  const wordCount = draftBody.trim() ? draftBody.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col min-w-0">
        <IOSTopBar search={search} onSearchChange={setSearch} searchPlaceholder="Search Studio..." />

        <div className="flex flex-1 overflow-hidden">
          {/* Source thoughts */}
          <div className="w-72 flex-shrink-0 border-r border-[var(--color-ios-border)] overflow-y-auto p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ios-text-muted)] px-2 py-2">Source Thoughts</p>
            <div className="space-y-1.5">
              {sources
                .filter(t => !search.trim() || t.title?.toLowerCase().includes(search.toLowerCase()))
                .map(t => (
                  <div
                    key={t.id}
                    onClick={() => selectSource(t)}
                    className={`px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                      sourceId === t.id ? 'border-[var(--color-ios-primary)] bg-[var(--color-ios-primary)]/5' : 'border-transparent hover:bg-[var(--color-ios-surface-alt)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t.category}</span>
                      <span className="text-[10px] text-gray-300">{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-ios-text)] line-clamp-2">{t.title || 'Untitled'}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Draft editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--color-ios-border)] flex-wrap">
              <span className="text-xs font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wide mr-2">Generate:</span>
              {GENERATE_FORMATS.map(f => (
                <button
                  key={f}
                  onClick={() => handleGenerate(f)}
                  disabled={generating !== null}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                    format === f ? 'border-[var(--color-ios-primary)] text-[var(--color-ios-primary)] bg-[var(--color-ios-primary)]/5' : 'border-[var(--color-ios-border)] text-[var(--color-ios-text)] hover:bg-[var(--color-ios-surface-alt)]'
                  }`}
                >
                  {generating === f ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {!source ? (
                <p className="text-sm text-[var(--color-ios-text-muted)]">Select a source thought on the left to begin.</p>
              ) : (
                <>
                  <input
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    placeholder="Title your masterpiece..."
                    className="w-full text-2xl font-bold text-[var(--color-ios-text)] border-none outline-none placeholder-gray-300 bg-transparent mb-3"
                  />
                  <textarea
                    value={draftBody}
                    onChange={e => setDraftBody(e.target.value)}
                    placeholder="Start typing or generate from the source thought..."
                    rows={16}
                    className="w-full text-sm text-[var(--color-ios-text)] border-none outline-none placeholder-gray-300 bg-transparent resize-none leading-relaxed"
                  />
                </>
              )}
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>

            <div className="flex items-center gap-5 px-6 py-3 border-t border-[var(--color-ios-border)] text-xs text-[var(--color-ios-text-muted)]">
              <span><strong className="text-[var(--color-ios-text)]">{wordCount}</strong> words</span>
              <span>Status: <strong className="text-[var(--color-ios-text)]">{queued ? 'Queued' : 'Drafting'}</strong></span>
              <button
                onClick={handleFinalize}
                disabled={!source}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" /> {queued ? 'Queued ✓' : 'Finalize & Queue'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Studio config rail */}
      <div className="w-64 flex-shrink-0 border-l border-[var(--color-ios-border)] p-5 space-y-5 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ios-text-muted)] mb-2">Tone of Voice</p>
          <input
            value={tone}
            onChange={e => setTone(e.target.value)}
            placeholder="e.g. Sophisticated, Direct..."
            className="w-full text-sm border border-[var(--color-ios-border)] rounded-lg px-3 py-2 placeholder-gray-300"
          />
        </div>
        {source && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ios-text-muted)] mb-2">Source</p>
            <div className="bg-[var(--color-ios-surface-alt)] rounded-lg p-3 text-xs text-[var(--color-ios-text-muted)]">
              <p className="text-[var(--color-ios-text)] font-medium mb-1">{source.title}</p>
              <p>Pillar: {source.pillar || 'None'}</p>
              <p>Reuse Score: {source.reuseScore || 0}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
