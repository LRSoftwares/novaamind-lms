import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { formatDistanceToNow } from 'date-fns';
import { Plus } from 'lucide-react';
import IOSTopBar from './IOSTopBar';
import { STAGE_COLORS } from './constants';

export default function FilteredThoughtView({ title, categories, emptyHint }) {
  const { thoughts } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = thoughts.filter(t => categories.includes(t.category));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.contentText?.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [thoughts, categories, search]);

  return (
    <div>
      <IOSTopBar search={search} onSearchChange={setSearch} searchPlaceholder={`Search ${title}...`} />

      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ios-text)] tracking-tight">{title}</h1>
            <p className="text-sm text-[var(--color-ios-text-muted)] mt-0.5">{filtered.length} thought{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => navigate('/thought-lab/thought/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Thought
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[var(--color-ios-border)] rounded-2xl">
            <p className="text-sm text-[var(--color-ios-text-muted)]">{emptyHint || 'Nothing here yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/thought-lab/thought/${t.id}`)}
                className="bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)] p-4 hover:border-[var(--color-ios-primary)]/40 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ios-primary)] bg-[var(--color-ios-primary)]/10 px-2 py-0.5 rounded-full">
                    {t.category}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${STAGE_COLORS[t.stage] || 'bg-gray-100 text-gray-600'}`}>{t.stage}</span>
                </div>
                <h3 className="font-semibold text-[var(--color-ios-text)] text-sm leading-snug line-clamp-2 mb-1.5">{t.title || 'Untitled'}</h3>
                {t.contentText && <p className="text-xs text-[var(--color-ios-text-muted)] line-clamp-2 mb-2">{t.contentText}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ios-primary)] font-medium">Reuse: {t.reuseScore || 0}%</span>
                  <span className="text-[11px] text-gray-300">{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
