import { useState } from 'react';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';

const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

const CATEGORY_OPTIONS = ['Agreements', 'Governance'];
const PRIORITY_OPTIONS = ['P0', 'P1', 'P2'];

export default function NewTemplateModal({ open, onClose, onCreated }) {
  const { addLegalTemplate } = useData();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Agreements');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('P2');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setCategory('Agreements');
    setType('');
    setDescription('');
    setPriority('P2');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim() || !type.trim()) return;
    setSaving(true);
    const result = await addLegalTemplate({
      name: name.trim(),
      category,
      type: type.trim(),
      description: description.trim(),
      priority,
    });
    setSaving(false);
    if (result?.data) {
      reset();
      onCreated(result.data.id);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="New Template">
      <div className="space-y-3">
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className={inputClass} />
        <input value={type} onChange={e => setType(e.target.value)} placeholder="Type (e.g. NDA, MSA, SOW)" className={inputClass} />
        <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} className={inputClass}>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="Short description"
          className={`${inputClass} resize-none`}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim() || !type.trim()}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
