import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Pencil, Trash2, Plus, X, FileType } from 'lucide-react';
import BookCover from './BookCover';
import Modal from '../../../components/Modal';
import { useData } from '../../../context/DataContext';

const inputClass = 'w-full text-sm border border-[var(--rh-outline-variant)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--rh-primary)]/20 focus:border-[var(--rh-primary)]';

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    readingHubCollections, updateReadingHubCollection, deleteReadingHubCollection,
    readingHubCollectionItems, addItemToCollection, removeItemFromCollection,
    readingHubItems,
  } = useData();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const collection = readingHubCollections.find(c => c.id === id);
  const activeItems = useMemo(() => readingHubItems.filter(i => !i.deletedAt), [readingHubItems]);
  const memberIds = useMemo(
    () => readingHubCollectionItems.filter(ci => ci.collectionId === id).map(ci => ci.itemId),
    [readingHubCollectionItems, id]
  );
  const members = useMemo(() => activeItems.filter(i => memberIds.includes(i.id)), [activeItems, memberIds]);
  const nonMembers = useMemo(() => activeItems.filter(i => !memberIds.includes(i.id)), [activeItems, memberIds]);

  if (!collection) {
    return (
      <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto text-center py-24">
        <p className="text-[var(--rh-on-surface-variant)]">Collection not found.</p>
        <button onClick={() => navigate('/reading-hub/collections')} className="mt-4 text-[var(--rh-primary)] font-semibold hover:underline">
          Back to Collections
        </button>
      </div>
    );
  }

  const openEditModal = () => {
    setName(collection.name);
    setDescription(collection.description || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!name.trim()) return;
    setSavingEdit(true);
    await updateReadingHubCollection(collection.id, { name: name.trim(), description: description.trim() });
    setSavingEdit(false);
    setEditModalOpen(false);
  };

  const handleDeleteCollection = () => {
    if (window.confirm(`Delete the "${collection.name}" collection? Books and documents stay in your library.`)) {
      deleteReadingHubCollection(collection.id);
      navigate('/reading-hub/collections');
    }
  };

  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto space-y-8">
      <button
        onClick={() => navigate('/reading-hub/collections')}
        className="flex items-center gap-2 text-sm text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Collections
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: `linear-gradient(155deg, ${collection.colorStart} 0%, ${collection.colorEnd} 100%)` }}
          >
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--rh-on-surface)]">{collection.name}</h2>
            <p className="text-base text-[var(--rh-on-surface-variant)] mt-1 max-w-xl">{collection.description || 'No description yet.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface)] hover:bg-[var(--rh-surface-container-low)] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={handleDeleteCollection}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-[var(--rh-outline-variant)] text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {members.map(item => (
          <div key={item.id} className="rounded-[24px] border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-lowest)] overflow-hidden flex flex-col group">
            <div
              onClick={() => item.kind === 'book' && navigate(`/reading-hub/book/${item.id}`)}
              className={`relative h-40 ${item.kind === 'book' ? 'cursor-pointer' : ''}`}
            >
              {item.kind === 'book' ? (
                <BookCover title={item.title} author={item.author} palette={[item.coverStart, item.coverEnd]} imageUrl={item.coverImageUrl} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--rh-surface-container-low)]">
                  <FileType className="w-8 h-8 text-[var(--rh-on-surface-variant)]" />
                </div>
              )}
            </div>
            <div className="p-4 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--rh-on-surface)] truncate">{item.title}</p>
                <p className="text-xs text-[var(--rh-on-surface-variant)] truncate">{item.author}</p>
              </div>
              <button
                onClick={() => removeItemFromCollection(collection.id, item.id)}
                className="text-[var(--rh-on-surface-variant)] hover:text-red-500 transition-colors flex-shrink-0"
                title="Remove from collection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => setAddModalOpen(true)}
          className="rounded-[24px] border-2 border-dashed border-[var(--rh-outline-variant)] flex flex-col items-center justify-center p-8 text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] hover:bg-[var(--rh-surface-container-low)] transition-colors min-h-[220px]"
        >
          <Plus className="w-7 h-7 mb-2" />
          <p className="text-sm font-bold">Add Books</p>
        </button>
      </div>

      {members.length === 0 && (
        <p className="text-sm text-[var(--rh-on-surface-variant)] text-center">This collection is empty — add some books or documents to it.</p>
      )}

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Collection">
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
            <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-sm text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit || !name.trim()}
              className="px-5 py-2 bg-[var(--rh-primary)] text-[var(--rh-on-primary)] text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add to Collection">
        <div className="space-y-1 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {nonMembers.length === 0 ? (
            <p className="text-sm text-[var(--rh-on-surface-variant)] text-center py-6">Everything in your library is already in this collection.</p>
          ) : (
            nonMembers.map(item => (
              <button
                key={item.id}
                onClick={() => addItemToCollection(collection.id, item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--rh-surface-container-low)] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--rh-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-[var(--rh-primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--rh-on-surface)] truncate">{item.title}</p>
                  <p className="text-xs text-[var(--rh-on-surface-variant)] truncate">{item.author} · {item.category}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
