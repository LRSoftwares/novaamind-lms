import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, Play, CheckCircle2, Lightbulb, Share2, Plus, FileType } from 'lucide-react';
import BookCover from './BookCover';
import { useData } from '../../../context/DataContext';

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="p-5 rounded-[24px] border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-lowest)] flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-[var(--rh-primary)]/10 text-[var(--rh-primary)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[var(--rh-on-surface)] leading-none">{value}</p>
        <p className="text-xs text-[var(--rh-on-surface-variant)] mt-1.5">{label}</p>
      </div>
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const { readingHubItems, thoughts } = useData();

  const activeItems = useMemo(() => readingHubItems.filter(i => !i.deletedAt), [readingHubItems]);
  const bookIdeas = useMemo(() => thoughts.filter(t => t.thoughtSubtype === 'idea' && t.sourceType === 'book'), [thoughts]);
  const bookPerspectives = useMemo(() => thoughts.filter(t => t.thoughtSubtype === 'perspective' && t.sourceType === 'book'), [thoughts]);

  const stats = useMemo(() => ({
    total: activeItems.length,
    currentlyReading: activeItems.filter(i => i.status === 'currently-reading').length,
    completed: activeItems.filter(i => i.status === 'completed').length,
    ideas: bookIdeas.length,
    perspectives: bookPerspectives.length,
  }), [activeItems, bookIdeas, bookPerspectives]);

  const currentlyReading = useMemo(
    () => activeItems.filter(i => i.kind === 'book' && i.status === 'currently-reading'),
    [activeItems]
  );

  const recentlyAdded = useMemo(
    () => [...activeItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [activeItems]
  );

  const recentActivity = useMemo(() => {
    const ideaEvents = bookIdeas.map(t => ({
      kind: 'idea', id: t.id, itemId: t.sourceId, createdAt: t.createdAt, title: t.title, detail: t.originalHighlight,
    }));
    const perspectiveEvents = bookPerspectives.map(t => ({
      kind: 'perspective', id: t.id, itemId: t.sourceId, createdAt: t.createdAt, title: 'New perspective', detail: t.myPerspective || t.contentText,
    }));
    return [...ideaEvents, ...perspectiveEvents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [bookIdeas, bookPerspectives]);

  const itemById = (itemId) => readingHubItems.find(i => i.id === itemId);

  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto space-y-8">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-[var(--rh-on-surface)]">Overview</h2>
        <p className="text-base text-[var(--rh-on-surface-variant)] mt-1">Your reading at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatTile icon={BookOpen} label="Total items" value={stats.total} />
        <StatTile icon={Play} label="Currently reading" value={stats.currentlyReading} />
        <StatTile icon={CheckCircle2} label="Completed" value={stats.completed} />
        <StatTile icon={Lightbulb} label="Ideas captured" value={stats.ideas} />
        <StatTile icon={Share2} label="Perspectives captured" value={stats.perspectives} />
      </div>

      {currentlyReading.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--rh-on-surface)]">Continue Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentlyReading.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/reading-hub/book/${item.id}`, { state: { tab: 'Read' } })}
                className="flex gap-4 p-4 rounded-[24px] border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-lowest)] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:border-[var(--rh-primary)] transition-all cursor-pointer"
              >
                <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <BookCover title={item.title} author={item.author} palette={[item.coverStart, item.coverEnd]} imageUrl={item.coverImageUrl} />
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <h4 className="text-sm font-semibold text-[var(--rh-on-surface)] line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-[var(--rh-on-surface-variant)] mb-3">{item.author}</p>
                  <div className="mt-auto space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[var(--rh-on-surface-variant)]">Progress</span>
                      <span className="text-[var(--rh-primary)]">{item.progress ?? 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--rh-surface-container-high)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--rh-primary)] rounded-full" style={{ width: `${item.progress ?? 0}%` }} />
                    </div>
                    {item.readingLocation != null && item.totalLocations != null && (
                      <p className="text-[11px] text-[var(--rh-on-surface-variant)]">Chapter {item.readingLocation} of {item.totalLocations}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--rh-on-surface)]">Recently Added</h3>
            <button onClick={() => navigate('/reading-hub')} className="text-[var(--rh-primary)] text-sm hover:underline">
              View library
            </button>
          </div>
          {recentlyAdded.length === 0 ? (
            <p className="text-sm text-[var(--rh-on-surface-variant)]">Nothing added yet.</p>
          ) : (
            <div className="rounded-2xl border border-[var(--rh-outline-variant)] divide-y divide-[var(--rh-outline-variant)]/60 overflow-hidden bg-[var(--rh-surface-container-lowest)]">
              {recentlyAdded.map(item => (
                <div
                  key={item.id}
                  onClick={() => item.kind === 'book' && navigate(`/reading-hub/book/${item.id}`)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--rh-surface-container-low)] transition-colors ${item.kind === 'book' ? 'cursor-pointer' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--rh-primary)]/10 flex items-center justify-center flex-shrink-0">
                    {item.kind === 'book' ? <BookOpen className="w-4 h-4 text-[var(--rh-primary)]" /> : <FileType className="w-4 h-4 text-[var(--rh-primary)]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--rh-on-surface)] truncate">{item.title}</p>
                    <p className="text-xs text-[var(--rh-on-surface-variant)] truncate">{item.category}</p>
                  </div>
                  <span className="text-xs text-[var(--rh-on-surface-variant)] flex-shrink-0">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--rh-on-surface)]">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--rh-on-surface-variant)]">No ideas or perspectives captured yet.</p>
          ) : (
            <div className="rounded-2xl border border-[var(--rh-outline-variant)] divide-y divide-[var(--rh-outline-variant)]/60 overflow-hidden bg-[var(--rh-surface-container-lowest)]">
              {recentActivity.map(event => {
                const book = itemById(event.itemId);
                return (
                  <div
                    key={`${event.kind}-${event.id}`}
                    onClick={() => book && navigate(`/reading-hub/book/${book.id}`)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--rh-surface-container-low)] transition-colors ${book ? 'cursor-pointer' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--rh-primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {event.kind === 'idea' ? <Lightbulb className="w-4 h-4 text-[var(--rh-primary)]" /> : <Share2 className="w-4 h-4 text-[var(--rh-primary)]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--rh-on-surface)] truncate">{event.title}</p>
                      {event.detail && <p className="text-xs text-[var(--rh-on-surface-variant)] italic line-clamp-1">"{event.detail}"</p>}
                      <p className="text-xs text-[var(--rh-on-surface-variant)] mt-0.5">
                        {book ? book.title : 'Unknown book'} · {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {stats.total === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-[var(--rh-outline-variant)] rounded-[24px]">
          <Plus className="w-8 h-8 text-[var(--rh-on-surface-variant)] mb-3" />
          <p className="text-sm text-[var(--rh-on-surface-variant)]">Your library is empty — add a book to get started.</p>
        </div>
      )}
    </div>
  );
}
