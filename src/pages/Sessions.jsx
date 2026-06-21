import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Video, FileText, ChevronLeft, ChevronRight, Calendar, List, GraduationCap } from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

const SESSION_TYPES = ['In-Person', 'Online Sync', 'Online Async'];
const SESSION_STATUSES = ['Scheduled', 'Completed', 'Cancelled'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TRAINER_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-500' },
];

const emptyForm = {
  programId: '', sessionDate: '', startTime: '09:00', endTime: '17:00',
  sessionType: 'In-Person', venue: '', zoomLink: '', materialLink: '',
  capacity: 30, trainerId: '', coTrainerId: '', status: 'Scheduled',
};

export default function Sessions() {
  const { sessions, programs, trainers, addSession, updateSession, deleteSession } = useData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));

  const trainerColorMap = useMemo(() => {
    const map = {};
    trainers.forEach((t, i) => { map[t.id] = TRAINER_COLORS[i % TRAINER_COLORS.length]; });
    return map;
  }, [trainers]);

  const filtered = useMemo(() =>
    sessions.filter(s => {
      const prog = programs.find(p => p.id === s.programId);
      const matchSearch = !search || prog?.name.toLowerCase().includes(search.toLowerCase()) || s.venue?.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || s.sessionType === filterType;
      const matchTrainer = !filterTrainer || s.trainerId === filterTrainer;
      return matchSearch && matchType && matchTrainer;
    }), [sessions, search, filterType, filterTrainer, programs]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      const parts = s.sessionDate.split('-');
      const sYear = parseInt(parts[0]);
      const sMonth = parseInt(parts[1]) - 1;
      const sDay = parseInt(parts[2]);
      if (sYear === year && sMonth === month) {
        if (!map[sDay]) map[sDay] = [];
        map[sDay].push(s);
      }
    });
    return map;
  }, [filtered, year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const openNew = (prefillDate) => {
    setForm({ ...emptyForm, sessionDate: prefillDate || '' });
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (sess) => { setForm({ ...sess }); setEditing(sess.id); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateSession(editing, form);
    } else {
      await addSession({ ...form, id: `S${Date.now()}` });
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this session?')) {
      await deleteSession(id);
    }
  };

  const getProgName = (id) => programs.find(p => p.id === id)?.name || 'Unknown';
  const getProgShortCode = (id) => programs.find(p => p.id === id)?.shortCode || '';
  const getTrainerName = (id) => trainers.find(t => t.id === id)?.name || '-';

  const typeIcon = { 'In-Person': MapPin, 'Online Sync': Video, 'Online Async': FileText };
  const typeColor = { 'In-Person': 'text-blue-600 bg-blue-50', 'Online Sync': 'text-green-600 bg-green-50', 'Online Async': 'text-purple-600 bg-purple-50' };
  const statusColor = { Scheduled: 'bg-blue-100 text-blue-700', Completed: 'bg-green-100 text-green-700', Cancelled: 'bg-red-100 text-red-700' };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">Plan, schedule, and visualize training sessions</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView('calendar')} className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Calendar className="w-4 h-4" /> Calendar
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <List className="w-4 h-4" /> List
            </button>
          </div>
          <button onClick={() => openNew()} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>
      </div>

      {/* Trainer Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <GraduationCap className="w-4 h-4" /> Trainers
          </div>
          <div className="flex flex-wrap gap-3">
            {trainers.map(t => {
              const color = trainerColorMap[t.id];
              const count = sessions.filter(s => s.trainerId === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilterTrainer(filterTrainer === t.id ? '' : t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    filterTrainer === t.id ? `${color.bg} ${color.text} ${color.border} ring-2 ring-offset-1 ring-blue-300` :
                    filterTrainer ? 'bg-gray-50 text-gray-400 border-gray-200' :
                    `${color.bg} ${color.text} ${color.border}`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                  {t.name} ({count})
                </button>
              );
            })}
            {filterTrainer && (
              <button onClick={() => setFilterTrainer('')} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear filter</button>
            )}
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <h2 className="text-lg font-semibold text-gray-900 w-48 text-center">{monthName}</h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              <button onClick={goToToday} className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Today</button>
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option value="">All Types</option>
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2 bg-gray-50">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const daySessions = day ? (sessionsByDate[day] || []) : [];
              return (
                <div
                  key={i}
                  className={`min-h-[110px] border-b border-r p-1.5 ${!day ? 'bg-gray-50/50' : 'hover:bg-blue-50/30 cursor-pointer'} ${i % 7 === 6 ? 'border-r-0' : ''}`}
                  onClick={() => day && openNew(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {daySessions.slice(0, 3).map(s => {
                          const color = trainerColorMap[s.trainerId] || TRAINER_COLORS[0];
                          return (
                            <div
                              key={s.id}
                              className={`text-xs px-1.5 py-1 rounded ${color.bg} ${color.text} truncate cursor-pointer hover:ring-1 hover:ring-blue-400`}
                              onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                              title={`${getProgShortCode(s.programId)} · ${s.startTime}-${s.endTime} · ${getTrainerName(s.trainerId)}`}
                            >
                              <span className="font-medium">{s.startTime}</span> {getProgShortCode(s.programId) || getProgName(s.programId).substring(0, 12)}
                            </div>
                          );
                        })}
                        {daySessions.length > 3 && (
                          <div className="text-xs text-gray-400 pl-1">+{daySessions.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sessions..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">All Types</option>
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">Program / Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 font-medium">Trainer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sess => {
                  const TypeIcon = typeIcon[sess.sessionType] || MapPin;
                  const color = trainerColorMap[sess.trainerId] || TRAINER_COLORS[0];
                  return (
                    <tr key={sess.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{getProgName(sess.programId)}</p>
                        <p className="text-xs text-gray-400">{sess.sessionDate}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${typeColor[sess.sessionType]}`}>
                          <TypeIcon className="w-3 h-3" /> {sess.sessionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sess.startTime} - {sess.endTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{sess.venue || sess.zoomLink || sess.materialLink || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sess.capacity}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${color.bg} ${color.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                          {getTrainerName(sess.trainerId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[sess.status]}`}>{sess.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(sess)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                          <button onClick={() => handleDelete(sess.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No sessions found</div>}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Session' : 'New Session'} wide>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select required value={form.programId} onChange={e => setForm({ ...form, programId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select program</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
              <select value={form.sessionType} onChange={e => setForm({ ...form, sessionType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required value={form.sessionDate} onChange={e => setForm({ ...form, sessionDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          {form.sessionType === 'In-Person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Training Room A, Chennai HQ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}
          {form.sessionType === 'Online Sync' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
              <input value={form.zoomLink} onChange={e => setForm({ ...form, zoomLink: e.target.value })} placeholder="https://meet.google.com/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}
          {form.sessionType === 'Online Async' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Link</label>
              <input value={form.materialLink} onChange={e => setForm({ ...form, materialLink: e.target.value })} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
              <select value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {SESSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">{editing ? 'Update' : 'Create'} Session</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
