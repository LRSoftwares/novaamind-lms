import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Lightbulb, FileText, FileType, CalendarDays, Star, Plus, MoreVertical, Loader2, Play } from 'lucide-react';
import BookCover from './BookCover';
import { useData } from '../../../context/DataContext';
import { STATUS_OPTIONS, CATEGORY_GROUPS, groupCategory, SORT_OPTIONS } from './constants';

const selectClass = 'text-sm px-3 py-1.5 rounded-lg border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-lowest)] text-[var(--rh-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--rh-primary)]/20 focus:border-[var(--rh-primary)]';

const STATUS_BADGE = {
  'currently-reading': { label: 'CURRENTLY READING', className: 'bg-[var(--rh-primary)] text-[var(--rh-on-primary)]' },
  paused: { label: 'PAUSED', className: 'bg-[var(--rh-surface-container-highest)] text-[var(--rh-on-surface-variant)]' },
  completed: { label: 'COMPLETED', className: 'bg-green-100 text-green-700' },
  'want-to-read': { label: 'WANT TO READ', className: 'bg-[var(--rh-surface-container-highest)] text-[var(--rh-on-surface-variant)]' },
};

const FILE_ICON = { PDF: { Icon: FileText, className: 'text-red-600' }, DOCX: { Icon: FileType, className: 'text-[var(--rh-primary)]' } };

function BookCard({ item, ideaCount, onOpen, onContinueReading, onDelete }) {
  const badge = STATUS_BADGE[item.status];
  return (
    <div
      onClick={onOpen}
      className="bg-[var(--rh-surface-container-lowest)] border border-[var(--rh-outline-variant)] rounded-[24px] overflow-hidden flex flex-col group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:border-[var(--rh-primary)]"
    >
      <div className="relative h-56 overflow-hidden">
        <BookCover title={item.title} author={item.author} palette={[item.coverStart, item.coverEnd]} imageUrl={item.coverImageUrl} className="group-hover:scale-105 transition-transform duration-500" />
        {badge && (
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 text-[10px] font-bold tracking-wide rounded-full ${badge.className}`}>{badge.label}</span>
          </div>
        )}
        {ideaCount > 0 && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow-sm flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-[var(--rh-primary)]" />
            <span className="text-xs font-bold text-[var(--rh-on-surface)]">{ideaCount} Ideas</span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="text-lg font-semibold text-[var(--rh-on-surface)] line-clamp-1">{item.title}</h3>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] transition-colors flex-shrink-0">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
        <p className="text-sm text-[var(--rh-on-surface-variant)] mb-4">{item.author}</p>
        <div className="mt-auto">
          {item.status === 'completed' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-[var(--rh-on-surface-variant)]">
                <CalendarDays className="w-4 h-4" /> Finished {item.finishedAt}
              </div>
              <div className="flex items-center gap-0.5 text-yellow-500">
                {[0, 1, 2, 3, 4].map(i => (
                  <Star key={i} className="w-3.5 h-3.5" fill={i < item.rating ? 'currentColor' : 'none'} />
                ))}
              </div>
            </div>
          ) : item.status === 'currently-reading' || item.status === 'paused' || item.progress != null ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-[var(--rh-on-surface-variant)]">Progress</span>
                <span className="text-[var(--rh-primary)]">{item.progress ?? 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--rh-surface-container-high)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--rh-primary)] rounded-full" style={{ width: `${item.progress ?? 0}%` }} />
              </div>
              {item.readingLocation != null && item.totalLocations != null && (
                <p className="text-[11px] text-[var(--rh-on-surface-variant)]">Chapter {item.readingLocation} of {item.totalLocations}</p>
              )}
              <button
                onClick={e => { e.stopPropagation(); onContinueReading(); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--rh-primary)] py-1.5 rounded-lg border border-[var(--rh-outline-variant)] hover:bg-[var(--rh-surface-container-low)] transition-colors mt-1"
              >
                <Play className="w-3 h-3" fill="currentColor" /> Continue Reading
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ item, onDelete }) {
  const fileIcon = FILE_ICON[item.fileType] || { Icon: FileText, className: 'text-[var(--rh-on-surface-variant)]' };
  const Icon = fileIcon.Icon;
  return (
    <div
      onClick={() => item.storagePath && window.open(item.storagePath, '_blank', 'noopener,noreferrer')}
      className={`bg-[var(--rh-surface-container-lowest)] border border-[var(--rh-outline-variant)] rounded-[24px] overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:border-[var(--rh-primary)] ${item.storagePath ? 'cursor-pointer' : ''}`}
    >
      <div className="h-56 bg-[var(--rh-surface-container-low)] flex flex-col items-center justify-center p-8 text-center border-b border-[var(--rh-outline-variant)]/30">
        <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${fileIcon.className}`}>
          <Icon className="w-8 h-8" />
        </div>
        <span className="px-2 py-1 bg-white text-[var(--rh-on-surface-variant)] text-[10px] font-bold tracking-wide rounded-md border border-[var(--rh-outline-variant)]">
          {item.fileType} • {item.fileSize}
        </span>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="text-lg font-semibold text-[var(--rh-on-surface)] line-clamp-2">{item.title}</h3>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] transition-colors flex-shrink-0">
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
        <p className="text-sm text-[var(--rh-on-surface-variant)] mb-4">{item.author}</p>
        <div className="mt-auto flex items-center gap-2 flex-wrap">
          {(item.chips || []).map(chip => (
            <span
              key={chip}
              className={`px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-md ${
                chip === 'URGENT' ? 'bg-[var(--rh-primary-container)] text-[var(--rh-on-primary-container)]' : 'bg-[var(--rh-surface-container-high)] text-[var(--rh-on-surface-variant)]'
              }`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyLibrary({ search }) {
  const navigate = useNavigate();
  const { readingHubItems, addReadingHubItem, trashReadingHubItem, readingHubCollections, readingHubCollectionItems, thoughts } = useData();
  const [viewMode, setViewMode] = useState('grid');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const ideaCountByItem = useMemo(() => {
    const map = {};
    for (const t of thoughts) {
      if (t.sourceId) map[t.sourceId] = (map[t.sourceId] || 0) + 1;
    }
    return map;
  }, [thoughts]);

  const handleDelete = (item) => {
    if (window.confirm(`Move "${item.title}" to Trash?`)) trashReadingHubItem(item.id);
  };

  const filtered = useMemo(() => {
    let list = readingHubItems.filter(i => !i.deletedAt);
    if (categoryFilter !== 'All') list = list.filter(i => groupCategory(i.category) === categoryFilter);
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (collectionFilter !== 'all') {
      const memberIds = readingHubCollectionItems.filter(ci => ci.collectionId === collectionFilter).map(ci => ci.itemId);
      list = list.filter(i => memberIds.includes(i.id));
    }
    if (search?.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.author?.toLowerCase().includes(q));
    }
    const sorted = [...list];
    switch (sort) {
      case 'title': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'author': sorted.sort((a, b) => (a.author || '').localeCompare(b.author || '')); break;
      case 'progress': sorted.sort((a, b) => (b.progress ?? -1) - (a.progress ?? -1)); break;
      case 'ideas': sorted.sort((a, b) => (ideaCountByItem[b.id] || 0) - (ideaCountByItem[a.id] || 0)); break;
      default: sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  }, [readingHubItems, categoryFilter, statusFilter, collectionFilter, sort, search, readingHubCollectionItems, ideaCountByItem]);

  const handleFiles = async (fileList) => {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      await addReadingHubItem(file);
    }
    setUploading(false);
  };

  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => e.target.files?.length && handleFiles(e.target.files)}
      />

      <div className="mb-8 space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--rh-on-surface)]">Library</h2>
            <p className="text-base text-[var(--rh-on-surface-variant)] mt-1">Everything that shapes how you think.</p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--rh-surface-container-low)] p-1 rounded-xl border border-[var(--rh-outline-variant)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--rh-primary)]' : 'text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-high)]'
              }`}
            >
              <LayoutGrid className="w-4.5 h-4.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-[var(--rh-primary)]' : 'text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-high)]'
              }`}
            >
              <List className="w-4.5 h-4.5" /> List
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === 'All' ? 'bg-[var(--rh-primary)] text-[var(--rh-on-primary)]' : 'bg-[var(--rh-surface-container-highest)] text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-primary)]/10 hover:text-[var(--rh-primary)]'
            }`}
          >
            All
          </button>
          {CATEGORY_GROUPS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat ? 'bg-[var(--rh-primary)] text-[var(--rh-on-primary)]' : 'bg-[var(--rh-surface-container-highest)] text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-primary)]/10 hover:text-[var(--rh-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 py-2 border-y border-[var(--rh-outline-variant)]/30">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)} className={selectClass}>
            <option value="all">All Collections</option>
            {readingHubCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className={selectClass}>
            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(item =>
            item.kind === 'book' ? (
              <BookCard
                key={item.id}
                item={item}
                ideaCount={ideaCountByItem[item.id] || 0}
                onOpen={() => navigate(`/reading-hub/book/${item.id}`)}
                onContinueReading={() => navigate(`/reading-hub/book/${item.id}`, { state: { tab: 'Read' } })}
                onDelete={() => handleDelete(item)}
              />
            ) : (
              <DocumentCard key={item.id} item={item} onDelete={() => handleDelete(item)} />
            )
          )}
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className="bg-[var(--rh-surface-container-low)] border-2 border-dashed border-[var(--rh-outline-variant)] rounded-[24px] flex flex-col items-center justify-center p-8 group cursor-pointer hover:bg-[var(--rh-surface-container-high)] transition-all min-h-[280px]"
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[var(--rh-primary)] mb-4 group-hover:scale-110 transition-transform shadow-sm">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
            </div>
            <p className="text-lg font-semibold text-[var(--rh-on-surface)]">{uploading ? 'Uploading...' : 'Add to Library'}</p>
            <p className="text-xs text-[var(--rh-on-surface-variant)] text-center mt-2 px-4">Upload PDFs, EPUBs, or link online articles to start reading.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--rh-outline-variant)] divide-y divide-[var(--rh-outline-variant)]/60 overflow-hidden bg-[var(--rh-surface-container-lowest)]">
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => {
                if (item.kind === 'book') navigate(`/reading-hub/book/${item.id}`);
                else if (item.storagePath) window.open(item.storagePath, '_blank', 'noopener,noreferrer');
              }}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-[var(--rh-surface-container-low)] transition-colors ${item.kind === 'book' || item.storagePath ? 'cursor-pointer' : ''}`}
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--rh-primary)]/10 flex items-center justify-center flex-shrink-0">
                {item.kind === 'book' ? <FileText className="w-4.5 h-4.5 text-[var(--rh-primary)]" /> : <FileType className="w-4.5 h-4.5 text-[var(--rh-primary)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--rh-on-surface)] truncate">{item.title}</p>
                <p className="text-xs text-[var(--rh-on-surface-variant)] truncate">{item.author} · {item.category}</p>
              </div>
              {item.progress != null && (
                <span className="text-xs font-bold text-[var(--rh-primary)] flex-shrink-0">{item.progress}%</span>
              )}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(item); }}
                className="p-2 rounded-lg hover:bg-red-50 text-[var(--rh-on-surface-variant)] hover:text-red-500 flex-shrink-0"
                title="Move to Trash"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-sm text-[var(--rh-on-surface-variant)]">No items match your filters.</div>
          )}
        </div>
      )}

      <button
        onClick={() => !uploading && inputRef.current?.click()}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--rh-primary)] text-[var(--rh-on-primary)] rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
      >
        {uploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Plus className="w-7 h-7" />}
      </button>
    </div>
  );
}
