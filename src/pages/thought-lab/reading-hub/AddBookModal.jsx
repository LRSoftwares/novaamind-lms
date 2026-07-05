import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import { useData } from '../../../context/DataContext';

const inputClass = 'w-full text-sm border border-[var(--rh-outline-variant)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--rh-primary)]/20 focus:border-[var(--rh-primary)]';

export default function AddBookModal({ open, onClose }) {
  const { addReadingHubBook } = useData();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const reset = () => {
    setTitle('');
    setAuthor('');
    setFile(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!file) { setError('Choose a PDF or EPUB to upload.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await addReadingHubBook(file, { title: title.trim(), author: author.trim() });
    setSaving(false);
    if (err) { setError(err); return; }
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add New Book">
      <div className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Book title (optional — defaults to file name)"
          className={inputClass}
        />
        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          placeholder="Author (optional)"
          className={inputClass}
        />
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf,application/epub+zip,.epub"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-2 justify-center border-2 border-dashed border-[var(--rh-outline-variant)] rounded-lg py-4 text-sm text-[var(--rh-on-surface-variant)] hover:border-[var(--rh-primary)] hover:text-[var(--rh-primary)] transition-colors"
        >
          <Upload className="w-4 h-4" /> {file ? file.name : 'Choose PDF or EPUB'}
        </button>
        <p className="text-xs text-[var(--rh-on-surface-variant)]">The book's cover is generated automatically — from the PDF's first page, or the EPUB's embedded cover image.</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !file}
            className="px-5 py-2 bg-[var(--rh-primary)] text-[var(--rh-on-primary)] text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Generating cover...' : 'Add Book'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
