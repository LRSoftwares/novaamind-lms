import { useState } from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';

const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

const CATEGORY_OPTIONS = ['Agreements', 'Governance'];

export default function NewDocumentModal({ open, onClose, onCreated }) {
  const { legalTemplates, addLegalDocument } = useData();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null); // template row, or { blank: true }
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Agreements');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(1);
    setSelected(null);
    setTitle('');
    setCategory('Agreements');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pick = (option) => {
    setSelected(option);
    setTitle(option.blank ? '' : option.name);
    if (!option.blank) setCategory(option.category);
    setStep(2);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const result = await addLegalDocument({
      title: title.trim(),
      category: selected.blank ? category : selected.category,
      type: selected.blank ? 'Other' : selected.type,
      templateId: selected.blank ? null : selected.id,
      content: selected.blank ? { type: 'doc', content: [] } : selected.content,
    });
    setSaving(false);
    if (result?.data) onCreated(result.data.id);
  };

  return (
    <Modal open={open} onClose={handleClose} title="New Document" wide={step === 1}>
      {step === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {legalTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => pick(t)}
              className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.category}</p>
            </button>
          ))}
          <button
            onClick={() => pick({ blank: true })}
            className="text-left p-4 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-sm font-semibold text-gray-900">Blank Document</p>
            <p className="text-xs text-gray-400 mt-0.5">Start from scratch</p>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Document name" className={inputClass} />
          {selected?.blank && (
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
