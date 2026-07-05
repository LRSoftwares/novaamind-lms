import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Plus, BookOpen, Lightbulb } from 'lucide-react';
import Modal from '../../../components/Modal';
import { useData } from '../../../context/DataContext';

const PALETTE = [
  ['#0058be', '#2170e4'],
  ['#924700', '#c96a1f'],
  ['#2a1a45', '#6a3fb5'],
  ['#0f5c3d', '#1a9c6d'],
  ['#7a1f3d', '#c9427a'],
  ['#1a4a5c', '#2f8ca8'],
];

const inputClass = 'w-full text-sm border border-[var(--rh-outline-variant)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--rh-primary)]/20 focus:border-[var(--rh-primary)]';

export default function Collections() {
  const navigate = useNavigate();
  const { readingHubCollections, addReadingHubCollection, readingHubCollectionItems, readingHubItems, thoughts } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const activeItems = useMemo(() => readingHubItems.filter(i => !i.deletedAt), [readingHubItems]);

  const counts = useMemo(() => {
    const map = {};
    for (const collection of readingHubCollections) {
      const itemIds = readingHubCollectionItems.filter(ci => ci.collectionId === collection.id).map(ci => ci.itemId);
      const items = activeItems.filter(i => itemIds.includes(i.id));
      const books = items.filter(i => i.kind === 'book').length;
      const docs = items.filter(i => i.kind === 'document').length;
      const ideas = thoughts.filter(t => t.thoughtSubtype === 'idea' && itemIds.includes(t.sourceId)).length;
      map[collection.id] = { books, docs, ideas, total: items.length };
    }
    return map;
  }, [readingHubCollections, readingHubCollectionItems, activeItems, thoughts]);

  const totalAssets = useMemo(() => new Set(readingHubCollectionItems.map(ci => ci.itemId)).size, [readingHubCollectionItems]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const [colorStart, colorEnd] = PALETTE[readingHubCollections.length % PALETTE.length];
    const { data } = await addReadingHubCollection({ name: name.trim(), description: description.trim(), colorStart, colorEnd });
    setSaving(false);
    setModalOpen(false);
    setName('');
    setDescription('');
    if (data) navigate(`/reading-hub/collections/${data.id}`);
  };

  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto space-y-8">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-[var(--rh-on-surface)]">Your Collections</h2>
        <p className="text-base text-[var(--rh-on-surface-variant)] mt-1">Curate and organize your intellectual capital by topic.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => setModalOpen(true)}
          className="p-8 rounded-[24px] border-2 border-dashed border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-low)] flex flex-col items-center justify-center text-center hover:bg-[var(--rh-surface-container-high)] transition-all min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[var(--rh-primary)] mb-4 shadow-sm">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-lg font-semibold text-[var(--rh-on-surface)]">New Collection</p>
          <p className="text-xs text-[var(--rh-on-surface-variant)] mt-2">Start organizing a new topic or project</p>
        </button>

        {readingHubCollections.map(collection => {
          const c = counts[collection.id] || { books: 0, docs: 0, ideas: 0 };
          return (
            <div
              key={collection.id}
              onClick={() => navigate(`/reading-hub/collections/${collection.id}`)}
              className="p-6 rounded-[24px] border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-lowest)] flex flex-col cursor-pointer hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] hover:border-[var(--rh-primary)] transition-all"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 flex-shrink-0"
                style={{ background: `linear-gradient(155deg, ${collection.colorStart} 0%, ${collection.colorEnd} 100%)` }}
              >
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--rh-on-surface)] mb-1">{collection.name}</h3>
              <p className="text-sm text-[var(--rh-on-surface-variant)] mb-4 line-clamp-2 flex-1">{collection.description || 'No description yet.'}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--rh-outline-variant)]/50">
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[var(--rh-surface-container-high)] text-[var(--rh-on-surface-variant)]">
                  <BookOpen className="w-3.5 h-3.5" /> {c.books + c.docs} items
                </span>
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[var(--rh-surface-container-high)] text-[var(--rh-on-surface-variant)]">
                  <Lightbulb className="w-3.5 h-3.5" /> {c.ideas} ideas
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {readingHubCollections.length > 0 && (
        <div className="flex items-center gap-8 p-6 rounded-[24px] border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-low)]">
          <div>
            <p className="text-2xl font-bold text-[var(--rh-primary)] leading-none">{readingHubCollections.length}</p>
            <p className="text-xs text-[var(--rh-on-surface-variant)] mt-1.5">Active topics</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--rh-on-surface)] leading-none">{totalAssets}</p>
            <p className="text-xs text-[var(--rh-on-surface-variant)] mt-1.5">Total assets organized</p>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Collection">
        <div className="space-y-3">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Collection name" className={inputClass} />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="px-5 py-2 bg-[var(--rh-primary)] text-[var(--rh-on-primary)] text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {saving ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
