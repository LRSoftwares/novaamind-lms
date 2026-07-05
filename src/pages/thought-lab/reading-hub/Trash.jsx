import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, FileText, FileType, RotateCcw, X } from 'lucide-react';
import { useData } from '../../../context/DataContext';

export default function Trash() {
  const { readingHubItems, restoreReadingHubItem, permanentlyDeleteReadingHubItem } = useData();
  const trashed = useMemo(
    () => readingHubItems.filter(i => i.deletedAt).sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)),
    [readingHubItems]
  );

  const handlePermanentDelete = (item) => {
    if (window.confirm(`Permanently delete "${item.title}"? This can't be undone.`)) {
      permanentlyDeleteReadingHubItem(item.id);
    }
  };

  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold tracking-tight text-[var(--rh-on-surface)] flex items-center gap-3">
          <Trash2 className="w-8 h-8" /> Trash
        </h2>
        <p className="text-base text-[var(--rh-on-surface-variant)] mt-1">Deleted items stay here until you remove them permanently.</p>
      </div>

      {trashed.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-[var(--rh-outline-variant)] rounded-[24px]">
          <Trash2 className="w-10 h-10 text-[var(--rh-on-surface-variant)] mb-4" />
          <p className="text-[var(--rh-on-surface)] font-semibold">Trash is empty</p>
          <p className="text-sm text-[var(--rh-on-surface-variant)] mt-1.5">Items you delete from My Library will show up here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--rh-outline-variant)] divide-y divide-[var(--rh-outline-variant)]/60 overflow-hidden bg-[var(--rh-surface-container-lowest)]">
          {trashed.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--rh-surface-container-high)] flex items-center justify-center flex-shrink-0">
                {item.kind === 'book' ? <FileText className="w-4.5 h-4.5 text-[var(--rh-on-surface-variant)]" /> : <FileType className="w-4.5 h-4.5 text-[var(--rh-on-surface-variant)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--rh-on-surface)] truncate">{item.title}</p>
                <p className="text-xs text-[var(--rh-on-surface-variant)] truncate">
                  Deleted {formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => restoreReadingHubItem(item.id)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface)] hover:bg-[var(--rh-surface-container-low)] flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore
              </button>
              <button
                onClick={() => handlePermanentDelete(item)}
                className="p-2 rounded-lg hover:bg-red-50 text-[var(--rh-on-surface-variant)] hover:text-red-500 flex-shrink-0"
                title="Delete permanently"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
