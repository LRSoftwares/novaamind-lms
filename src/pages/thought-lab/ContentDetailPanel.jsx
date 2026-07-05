import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Pencil, Share2, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { analyzeThought, generateVariant } from '../../lib/ai';
import { GENERATE_FORMATS } from './constants';

export default function ContentDetailPanel({ thought, onClose }) {
  const { updateThought, addThought } = useData();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [format, setFormat] = useState(GENERATE_FORMATS[0]);
  const [tone, setTone] = useState('');
  const [generating, setGenerating] = useState(false);
  const [variant, setVariant] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  if (!thought) return null;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const { reuseScore, insights } = await analyzeThought(thought);
      await updateThought(thought.id, { reuseScore, aiInsights: insights, aiAnalyzedAt: new Date().toISOString() });
    } catch (err) {
      setError(err.message || 'Analysis failed');
    }
    setAnalyzing(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setVariant(null);
    try {
      const result = await generateVariant(thought, format, tone);
      setVariant(result);
    } catch (err) {
      setError(err.message || 'Generation failed');
    }
    setGenerating(false);
  };

  const handleSaveVariant = async () => {
    if (!variant) return;
    await addThought({
      id: `TH${Date.now()}`,
      title: variant.title || `${thought.title} (${format})`,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: variant.body }] }] },
      contentText: variant.body,
      category: format,
      stage: 'Writing',
      importance: thought.importance || 'Medium',
      pillar: thought.pillar || '',
      tags: thought.tags || [],
      sourceThoughtId: thought.id,
      reuseScore: 0,
      aiInsights: [],
      readingTime: Math.max(1, Math.ceil((variant.body || '').split(/\s+/).length / 200)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${thought.title}\n\n${thought.contentText || ''}`);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="w-96 flex-shrink-0 border-l border-[var(--color-ios-border)] bg-[var(--color-ios-surface)] h-full overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-ios-border)] sticky top-0 bg-[var(--color-ios-surface)] z-10">
        <button onClick={onClose} className="flex items-center gap-1 text-[var(--color-ios-text-muted)] hover:text-[var(--color-ios-text)]">
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-[var(--color-ios-text)]">Content Detail</span>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/thought-lab/thought/${thought.id}`)} title="Edit" className="p-1.5 rounded-lg hover:bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)]">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={share} title="Copy to clipboard" className="p-1.5 rounded-lg hover:bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)]">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-ios-text-muted)] mb-2">
            <span className="font-semibold uppercase tracking-wide text-[var(--color-ios-primary)] bg-[var(--color-ios-primary)]/10 px-2 py-0.5 rounded-full">{thought.category}</span>
            <span>Updated {formatDistanceToNow(new Date(thought.updatedAt), { addSuffix: true })}</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-ios-text)] leading-snug">{thought.title || 'Untitled'}</h2>
          {thought.contentText && (
            <p className="text-sm text-[var(--color-ios-text-muted)] mt-2 line-clamp-4">{thought.contentText}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--color-ios-surface-alt)] rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-ios-text-muted)] mb-1">Reuse Potential</p>
            <p className="text-xl font-bold text-[var(--color-ios-primary)]">{thought.reuseScore || 0}%</p>
            <div className="h-1.5 bg-white rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-[var(--color-ios-primary)] rounded-full" style={{ width: `${thought.reuseScore || 0}%` }} />
            </div>
          </div>
          <div className="bg-[var(--color-ios-surface-alt)] rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-ios-text-muted)] mb-1">Pillar Alignment</p>
            <p className="text-sm font-bold text-[var(--color-ios-text)] mt-1.5 truncate">{thought.pillar || 'Unassigned'}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ios-text-muted)]">Atomic Insights</p>
            <button onClick={handleAnalyze} disabled={analyzing} className="text-xs text-[var(--color-ios-primary)] font-medium hover:underline flex items-center gap-1 disabled:opacity-50">
              {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {analyzing ? 'Analyzing...' : 'Recalculate'}
            </button>
          </div>
          {thought.aiInsights?.length > 0 ? (
            <ul className="space-y-2">
              {thought.aiInsights.map((insight, i) => (
                <li key={i} className="text-sm text-[var(--color-ios-text)] flex gap-2">
                  <span className="text-[var(--color-ios-primary)] flex-shrink-0 mt-0.5">•</span>{insight}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--color-ios-text-muted)]">No analysis yet — click Recalculate.</p>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {!generateOpen ? (
          <button
            onClick={() => setGenerateOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-ios-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Wand2 className="w-4 h-4" /> Generate Content Variants
          </button>
        ) : (
          <div className="border border-[var(--color-ios-border)] rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <select value={format} onChange={e => setFormat(e.target.value)} className="flex-1 text-sm border border-[var(--color-ios-border)] rounded-lg px-2 py-1.5 bg-white">
                {GENERATE_FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
              <input
                value={tone}
                onChange={e => setTone(e.target.value)}
                placeholder="Tone (optional)"
                className="flex-1 text-sm border border-[var(--color-ios-border)] rounded-lg px-2 py-1.5 placeholder-gray-300"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? 'Generating...' : `Generate ${format}`}
            </button>

            {variant && (
              <div className="bg-[var(--color-ios-surface-alt)] rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold text-[var(--color-ios-text)]">{variant.title}</p>
                <p className="text-xs text-[var(--color-ios-text)] whitespace-pre-wrap max-h-48 overflow-y-auto">{variant.body}</p>
                <button
                  onClick={handleSaveVariant}
                  className="w-full py-1.5 bg-[var(--color-ios-text)] text-white text-xs font-medium rounded-lg hover:opacity-90"
                >
                  {saved ? 'Saved as Draft ✓' : 'Save as Draft Thought'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
