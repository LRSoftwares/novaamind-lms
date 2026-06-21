import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, GraduationCap, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

const EXPERTISE_OPTIONS = ['AI Tools', 'Data Science', 'Technical Training', 'Leadership', 'Management', 'Communication', 'Compliance', 'Data Privacy', 'Legal', 'Product Management', 'AI Strategy', 'Innovation', 'Sales', 'Marketing'];

const emptyForm = {
  name: '', email: '', department: 'Tech', expertise: [],
  maxSessionsPerMonth: 10, preferredSessionType: 'Mixed', status: 'Active',
};

export default function Trainers() {
  const { trainers, sessions, programs, addTrainer, updateTrainer, deleteTrainer } = useData();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() =>
    trainers.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())),
    [trainers, search]);

  const getSessionCount = (trainerId) => sessions.filter(s => s.trainerId === trainerId).length;
  const getUpcomingCount = (trainerId) => sessions.filter(s => s.trainerId === trainerId && s.status === 'Scheduled').length;

  const isTrainerAssigned = (trainerId) => {
    const hasActiveSessions = sessions.some(s => s.trainerId === trainerId && s.status === 'Scheduled');
    const hasActivePrograms = programs.some(p => p.trainerId === trainerId && p.status === 'Active');
    return hasActiveSessions || hasActivePrograms;
  };

  const openNew = () => { setForm({ ...emptyForm }); setEditing(null); setModalOpen(true); };
  const openEdit = (t) => { setForm({ ...t }); setEditing(t.id); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateTrainer(editing, form);
    } else {
      const newTrainer = { ...form, id: `T${String(Date.now()).slice(-4)}` };
      await addTrainer(newTrainer);
    }
    setModalOpen(false);
  };

  const handleDelete = async (trainer) => {
    const assigned = isTrainerAssigned(trainer.id);
    const msg = assigned
      ? `${trainer.name} has active sessions or programs assigned. Deleting will leave those without a trainer. Continue?`
      : `Remove ${trainer.name} from trainers?`;
    if (confirm(msg)) {
      await deleteTrainer(trainer.id);
    }
  };

  const toggleExpertise = (exp) => {
    setForm(f => ({
      ...f,
      expertise: f.expertise.includes(exp) ? f.expertise.filter(e => e !== exp) : [...f.expertise, exp],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
          <p className="text-gray-500 text-sm mt-1">{trainers.length} trainer{trainers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Trainer
        </button>
      </div>

      {trainers.length > 2 && (
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trainers..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {filtered.map(trainer => {
          const assigned = isTrainerAssigned(trainer.id);
          return (
            <div key={trainer.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{trainer.name}</p>
                    <p className="text-xs text-gray-400">{trainer.department}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => openEdit(trainer)} className="p-1.5 rounded hover:bg-gray-100" title="Edit">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(trainer)} className="p-1.5 rounded hover:bg-red-50" title="Remove trainer">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-2">{trainer.email}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {trainer.expertise?.map(exp => (
                  <span key={exp} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{exp}</span>
                ))}
              </div>

              {assigned && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mb-3">
                  <AlertCircle className="w-3 h-3" /> Has active assignments
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{getSessionCount(trainer.id)}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{getUpcomingCount(trainer.id)}</p>
                  <p className="text-xs text-gray-400">Upcoming</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{trainer.maxSessionsPerMonth}</p>
                  <p className="text-xs text-gray-400">Max/Mo</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400">{search ? 'No trainers match your search' : 'No trainers added yet'}</p>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Trainer' : 'Add Trainer'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {['Tech', 'HR', 'Marketing', 'Sales', 'Operations'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Sessions/Month</label>
              <input type="number" min="1" value={form.maxSessionsPerMonth} onChange={e => setForm({ ...form, maxSessionsPerMonth: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Session Type</label>
            <select value={form.preferredSessionType} onChange={e => setForm({ ...form, preferredSessionType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {['In-Person', 'Online Sync', 'Mixed'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expertise</label>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map(exp => (
                <button key={exp} type="button" onClick={() => toggleExpertise(exp)} className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${form.expertise?.includes(exp) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>{exp}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">{editing ? 'Update' : 'Add'} Trainer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
