import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Plus, Zap, ArrowRight } from 'lucide-react';
import CaptureThoughtModal from './CaptureThoughtModal';
import { useData } from '../../../context/DataContext';
import { DEVELOPMENT_STATUS_COLORS } from '../constants';

const READING_ORIGINS = ['book', 'report', 'research', 'article'];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'My Thoughts' },
  { key: 'reading', label: 'From Reading' },
  { key: 'highlight', label: 'Highlights' },
  { key: 'perspective', label: 'Perspectives' },
  { key: 'question', label: 'Questions' },
  { key: 'framework_seed', label: 'Framework Seeds' },
  { key: 'content_seed', label: 'Content Seeds' },
];

function matchesFilter(thought, key) {
  switch (key) {
    case 'all': return true;
    case 'mine': return (thought.originType || 'own_thought') === 'own_thought';
    case 'reading': return READING_ORIGINS.includes(thought.originType);
    default: return thought.thoughtSubtype === key;
  }
}

function ThoughtCard({ thought, onDevelop }) {
  const statusColor = DEVELOPMENT_STATUS_COLORS[thought.developmentStatus] || DEVELOPMENT_STATUS_COLORS.captured;
  return (
    <div className="p-5 rounded-[24px] border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-lowest)] flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--rh-on-surface)] line-clamp-1">{thought.title}</h3>
      {thought.contentText && (
        <p className="text-xs text-[var(--rh-on-surface-variant)] line-clamp-2">{thought.contentText}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs text-[var(--rh-on-surface-variant)]">
        {thought.sourceTitle ? (
          <>
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{thought.sourceTitle}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Original Thought</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {thought.pillar && (
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--rh-surface-container-high)] text-[var(--rh-on-surface-variant)]">{thought.pillar}</span>
        )}
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${statusColor}`}>
          {(thought.developmentStatus || 'captured').replace('_', ' ')}
        </span>
      </div>
      <button
        onClick={onDevelop}
        className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--rh-primary)] py-2 rounded-lg border border-[var(--rh-outline-variant)] hover:bg-[var(--rh-surface-container-low)] transition-colors"
      >
        Develop <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function Thoughts() {
  const navigate = useNavigate();
  const { thoughts } = useData();
  const [filter, setFilter] = useState('all');
  const [captureOpen, setCaptureOpen] = useState(false);

  const filtered = useMemo(() => thoughts.filter(t => matchesFilter(t, filter)), [thoughts, filter]);

  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-[var(--rh-on-surface)]">Thoughts</h2>
          <p className="text-base text-[var(--rh-on-surface-variant)] mt-1 max-w-xl">
            Everything you capture, question and develop from what you read — alongside your own thinking.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('/thought-lab/board')}
            className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-full border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface)] hover:bg-[var(--rh-surface-container-low)] transition-colors"
          >
            <Zap className="w-4 h-4" /> Quick Capture
          </button>
          <button
            onClick={() => setCaptureOpen(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-full bg-[var(--rh-primary)] text-[var(--rh-on-primary)] hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Capture Thought
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[var(--rh-primary)] text-[var(--rh-on-primary)]'
                : 'bg-[var(--rh-surface-container-highest)] text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-primary)]/10 hover:text-[var(--rh-primary)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-[var(--rh-outline-variant)] rounded-[24px]">
          <Sparkles className="w-8 h-8 text-[var(--rh-on-surface-variant)] mb-3" />
          <p className="text-sm text-[var(--rh-on-surface-variant)] mb-4">Nothing here yet.</p>
          <button
            onClick={() => setCaptureOpen(true)}
            className="bg-[var(--rh-primary)] text-[var(--rh-on-primary)] px-5 py-2.5 rounded-full text-sm font-semibold hover:brightness-110 transition-all"
          >
            Capture Thought
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(thought => (
            <ThoughtCard key={thought.id} thought={thought} onDevelop={() => navigate(`/thought-lab/thought/${thought.id}`)} />
          ))}
        </div>
      )}

      <CaptureThoughtModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
