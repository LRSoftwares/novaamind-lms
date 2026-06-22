import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Video, FileText, ChevronLeft, ChevronRight, Calendar, List, GraduationCap, ArrowLeft, StickyNote, ClipboardCheck, Download, Check, X, Clock, Users, Mail, FileDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import Papa from 'papaparse';

const SESSION_TYPES = ['In-Person', 'Online Sync', 'Online Async'];
const SESSION_STATUSES = ['Scheduled', 'Completed', 'Cancelled'];
const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Excused', 'Late'];
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

const attColor = { Present: 'bg-green-100 text-green-700', Absent: 'bg-red-100 text-red-700', Excused: 'bg-amber-100 text-amber-700', Late: 'bg-blue-100 text-blue-700' };

export default function Sessions() {
  const { sessions, programs, trainers, employees, enrolments, addSession, updateSession, deleteSession, sessionNotes, saveSessionNote, sessionAttendance, saveAttendance, bulkSaveAttendance, batches, addBatch, batchMembers, bulkAddBatchMembers, sessionAssignments, bulkAssignToSession, removeSessionAssignment, assignBatchToSession } = useData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));
  const [detailSession, setDetailSession] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);
  const [localAttendance, setLocalAttendance] = useState({});
  const [toast, setToast] = useState('');
  const [assignModal, setAssignModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({ name: '', description: '' });
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

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
  const calendarDays = useMemo(() => { const d = []; for (let i = 0; i < firstDay; i++) d.push(null); for (let i = 1; i <= daysInMonth; i++) d.push(i); return d; }, [firstDay, daysInMonth]);
  const sessionsByDate = useMemo(() => { const m = {}; filtered.forEach(s => { const p = s.sessionDate?.split('-'); if (!p || p.length < 3) return; const sy = +p[0], sm = +p[1]-1, sd = +p[2]; if (sy === year && sm === month) { if (!m[sd]) m[sd] = []; m[sd].push(s); } }); return m; }, [filtered, year, month]);
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const openNew = (prefillDate) => { setForm({ ...emptyForm, sessionDate: prefillDate || '' }); setEditing(null); setModalOpen(true); };
  const openEdit = (sess) => { setForm({ ...sess }); setEditing(sess.id); setModalOpen(true); };

  const openDetail = (sess) => {
    setDetailSession(sess);
    const existingNote = sessionNotes.find(n => n.sessionId === sess.id);
    setNotes(existingNote?.content || '');
    const attMap = {};
    sessionAttendance.filter(a => a.sessionId === sess.id).forEach(a => { attMap[a.empId] = { status: a.status, notes: a.notes || '' }; });
    setLocalAttendance(attMap);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleaned = { ...form, trainerId: form.trainerId || null, coTrainerId: form.coTrainerId || null, programId: form.programId || null };
    let result;
    if (editing) { result = await updateSession(editing, cleaned); } else { result = await addSession({ ...cleaned, id: `S${Date.now()}` }); }
    if (result?.error) { alert(`Failed to save session: ${result.error.message}`); return; }
    setModalOpen(false);
  };

  const handleDelete = async (id) => { if (confirm('Delete this session?')) await deleteSession(id); };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const result = await saveSessionNote(detailSession.id, notes);
    if (result?.error) alert(`Failed: ${result.error.message}`);
    else showToast('Notes saved');
    setSavingNotes(false);
  };

  const handleSaveAllAttendance = async () => {
    setSavingAtt(true);
    const records = Object.entries(localAttendance).map(([empId, val]) => ({
      sessionId: detailSession.id, empId, status: val.status, notes: val.notes,
    }));
    await bulkSaveAttendance(records);
    showToast(`Attendance saved for ${records.length} employees`);
    setSavingAtt(false);
  };

  const setAttStatus = (empId, status) => {
    setLocalAttendance(prev => ({ ...prev, [empId]: { ...prev[empId], status, notes: prev[empId]?.notes || '' } }));
  };

  // Get employees for a session: assigned employees if any, else fall back to all program enrollees
  const getSessionEmployees = (sess) => {
    const assigned = sessionAssignments.filter(a => a.sessionId === sess.id);
    if (assigned.length > 0) {
      return assigned.map(a => employees.find(emp => emp.id === a.empId)).filter(Boolean);
    }
    const progEnrolments = enrolments.filter(e => e.programId === sess.programId);
    return progEnrolments.map(e => employees.find(emp => emp.id === e.empId)).filter(Boolean);
  };

  const hasAssignments = (sessId) => sessionAssignments.some(a => a.sessionId === sessId);

  // Get enrollees NOT yet assigned to this session (for the assign modal)
  const getUnassignedEmployees = (sess) => {
    const assigned = new Set(sessionAssignments.filter(a => a.sessionId === sess.id).map(a => a.empId));
    const progEnrolments = enrolments.filter(e => e.programId === sess.programId);
    return progEnrolments.map(e => employees.find(emp => emp.id === e.empId)).filter(emp => emp && !assigned.has(emp.id));
  };

  const getSessionBatches = (sess) => {
    const batchIds = new Set(sessionAssignments.filter(a => a.sessionId === sess.id && a.batchId).map(a => a.batchId));
    return batches.filter(b => batchIds.has(b.id));
  };

  const getProgramBatches = (programId) => batches.filter(b => b.programId === programId);

  const handleAssignEmployees = async () => {
    if (!detailSession || selectedEmpIds.size === 0) return;
    await bulkAssignToSession(detailSession.id, Array.from(selectedEmpIds), null);
    setSelectedEmpIds(new Set());
    setAssignModal(false);
    showToast(`Assigned ${selectedEmpIds.size} employees`);
  };

  const handleRemoveAssignment = async (empId) => {
    if (!detailSession) return;
    const asg = sessionAssignments.find(a => a.sessionId === detailSession.id && a.empId === empId);
    if (asg && confirm('Remove this employee from this session?')) {
      await removeSessionAssignment(asg.id);
      showToast('Removed from session');
    }
  };

  const handleAssignBatch = async (batchId) => {
    if (!detailSession) return;
    const result = await assignBatchToSession(detailSession.id, batchId);
    showToast(`Assigned batch (${result.count} new employees)`);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!detailSession) return;
    const prog = programs.find(p => p.id === detailSession.programId);
    const result = await addBatch({ ...batchForm, id: `BA${Date.now()}`, programId: prog?.id || null });
    if (result?.error) { alert(`Failed: ${result.error.message}`); return; }
    setBatchModal(false);
    setBatchForm({ name: '', description: '' });
    showToast('Batch created');
  };

  const exportAttendance = () => {
    if (!detailSession) return;
    const sess = detailSession;
    const prog = programs.find(p => p.id === sess.programId);
    const enrolledEmps = getSessionEmployees(sess);
    const rows = enrolledEmps.map(emp => {
      const att = localAttendance[emp.id] || sessionAttendance.find(a => a.sessionId === sess.id && a.empId === emp.id);
      return {
        'Session': prog?.name || '', 'Date': sess.sessionDate, 'Time': `${sess.startTime}-${sess.endTime}`,
        'Emp ID': emp.id, 'Employee Name': emp.name, 'Department': emp.department,
        'Status': att?.status || 'Not Marked', 'Notes': att?.notes || '',
      };
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${sess.sessionDate}_${prog?.shortCode || 'session'}.csv`;
    a.click();
  };

  const [docModal, setDocModal] = useState(false);
  const [docContent, setDocContent] = useState('');

  const generateDocContent = () => {
    if (!detailSession) return '';
    const sess = detailSession;
    const prog = programs.find(p => p.id === sess.programId);
    const enrolledEmps = getSessionEmployees(sess);
    const presentCount = Object.values(localAttendance).filter(a => a.status === 'Present' || a.status === 'Late').length;
    const absentCount = Object.values(localAttendance).filter(a => a.status === 'Absent').length;

    let doc = `SESSION REPORT\n${'='.repeat(50)}\n\n`;
    doc += `Program: ${prog?.name || 'N/A'}\n`;
    doc += `Date: ${sess.sessionDate}\n`;
    doc += `Time: ${sess.startTime} - ${sess.endTime}\n`;
    doc += `Type: ${sess.sessionType}\n`;
    doc += `Venue: ${sess.venue || sess.zoomLink || 'N/A'}\n`;
    doc += `Trainer: ${getTrainerName(sess.trainerId)}\n`;
    doc += `Status: ${sess.status}\n\n`;

    doc += `ATTENDANCE SUMMARY\n${'-'.repeat(50)}\n`;
    doc += `Total Enrolled: ${enrolledEmps.length}\n`;
    doc += `Present: ${presentCount}\n`;
    doc += `Absent: ${absentCount}\n`;
    doc += `Attendance Rate: ${enrolledEmps.length > 0 ? Math.round((presentCount / enrolledEmps.length) * 100) : 0}%\n\n`;

    doc += `ATTENDANCE DETAILS\n${'-'.repeat(50)}\n`;
    doc += `${'Name'.padEnd(25)} ${'Department'.padEnd(15)} ${'Status'.padEnd(10)} Notes\n`;
    doc += `${'-'.repeat(70)}\n`;
    enrolledEmps.forEach(emp => {
      const att = localAttendance[emp.id] || { status: 'Not Marked', notes: '' };
      doc += `${emp.name.padEnd(25)} ${(emp.department || '').padEnd(15)} ${att.status.padEnd(10)} ${att.notes || ''}\n`;
    });

    doc += `\nSESSION NOTES\n${'-'.repeat(50)}\n`;
    doc += notes || '(No notes recorded)\n';
    doc += `\n\n${'-'.repeat(50)}\nGenerated on ${new Date().toLocaleString()}\nNovaamind LMS`;

    return doc;
  };

  const openDocPreview = () => {
    setDocContent(generateDocContent());
    setDocModal(true);
  };

  const downloadAsDoc = () => {
    const content = docContent || generateDocContent();
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Session Report</title>
<style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5}h1{font-size:16pt;color:#1e40af}h2{font-size:13pt;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:4px}table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #cbd5e1;padding:6px 10px;text-align:left;font-size:10pt}th{background:#f1f5f9;font-weight:600}.present{color:#16a34a}.absent{color:#dc2626}.late{color:#2563eb}.excused{color:#d97706}pre{white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:6px;font-size:10pt}</style></head>
<body>
<h1>Session Report</h1>
<table>
<tr><th>Program</th><td>${programs.find(p => p.id === detailSession.programId)?.name || ''}</td><th>Date</th><td>${detailSession.sessionDate}</td></tr>
<tr><th>Time</th><td>${detailSession.startTime} - ${detailSession.endTime}</td><th>Type</th><td>${detailSession.sessionType}</td></tr>
<tr><th>Venue</th><td>${detailSession.venue || detailSession.zoomLink || 'N/A'}</td><th>Trainer</th><td>${getTrainerName(detailSession.trainerId)}</td></tr>
</table>
<h2>Attendance (${Object.values(localAttendance).filter(a => a.status === 'Present' || a.status === 'Late').length}/${getSessionEmployees(detailSession).length} present)</h2>
<table><tr><th>Name</th><th>Department</th><th>Status</th><th>Notes</th></tr>
${getSessionEmployees(detailSession).map(emp => {
  const att = localAttendance[emp.id] || { status: 'Not Marked', notes: '' };
  const cls = att.status === 'Present' ? 'present' : att.status === 'Absent' ? 'absent' : att.status === 'Late' ? 'late' : 'excused';
  return `<tr><td>${emp.name}</td><td>${emp.department || ''}</td><td class="${cls}">${att.status}</td><td>${att.notes || ''}</td></tr>`;
}).join('')}
</table>
<h2>Session Notes</h2>
<pre>${(notes || '(No notes recorded)').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<p style="color:#94a3b8;font-size:9pt;margin-top:20px">Generated on ${new Date().toLocaleString()} — Novaamind LMS</p>
</body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const prog = programs.find(p => p.id === detailSession.programId);
    a.download = `Session_Report_${detailSession.sessionDate}_${prog?.shortCode || 'session'}.doc`;
    a.click();
  };

  const emailReport = () => {
    if (!detailSession) return;
    const prog = programs.find(p => p.id === detailSession.programId);
    const enrolledEmps = getSessionEmployees(detailSession);
    const presentCount = Object.values(localAttendance).filter(a => a.status === 'Present' || a.status === 'Late').length;
    const subject = encodeURIComponent(`Session Report: ${prog?.name || 'Training'} - ${detailSession.sessionDate}`);
    const body = encodeURIComponent(docContent || generateDocContent());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const getProgName = (id) => programs.find(p => p.id === id)?.name || 'Unknown';
  const getProgShortCode = (id) => programs.find(p => p.id === id)?.shortCode || '';
  const getTrainerName = (id) => trainers.find(t => t.id === id)?.name || '-';
  const typeIcon = { 'In-Person': MapPin, 'Online Sync': Video, 'Online Async': FileText };
  const typeColor = { 'In-Person': 'text-blue-600 bg-blue-50', 'Online Sync': 'text-green-600 bg-green-50', 'Online Async': 'text-purple-600 bg-purple-50' };
  const statusColor = { Scheduled: 'bg-blue-100 text-blue-700', Completed: 'bg-green-100 text-green-700', Cancelled: 'bg-red-100 text-red-700' };

  // ===== SESSION DETAIL VIEW =====
  if (detailSession) {
    const sess = detailSession;
    const prog = programs.find(p => p.id === sess.programId);
    const enrolledEmps = getSessionEmployees(sess);
    const markedCount = Object.keys(localAttendance).length;
    const presentCount = Object.values(localAttendance).filter(a => a.status === 'Present' || a.status === 'Late').length;

    return (
      <div>
        {toast && (
          <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease]">
            <Check className="w-5 h-5" /><p className="text-sm font-medium">{toast}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setDetailSession(null)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{prog?.name || 'Session'}</h1>
            <p className="text-sm text-gray-500">{sess.sessionDate} · {sess.startTime}-{sess.endTime} · {getTrainerName(sess.trainerId)} · {sess.venue || sess.zoomLink || 'No location'}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[sess.status]}`}>{sess.status}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Notes + Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><StickyNote className="w-4 h-4 text-amber-500" /> Session Notes</h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={10}
                placeholder="Write detailed notes about this session... agenda, key discussions, action items, observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
              />
              <button onClick={handleSaveNotes} disabled={savingNotes} className="mt-3 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium w-full justify-center disabled:opacity-50">
                {savingNotes ? <Clock className="w-4 h-4 animate-spin" /> : <StickyNote className="w-4 h-4" />} Save Notes
              </button>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Session Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Program</span><span className="font-medium">{prog?.shortCode || prog?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{sess.sessionType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="font-medium">{sess.capacity}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Enrolled</span><span className="font-medium">{enrolledEmps.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Marked</span><span className="font-medium">{markedCount}/{enrolledEmps.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Present</span><span className="font-medium text-green-600">{presentCount}</span></div>
              </div>
            </div>
          </div>

          {/* RIGHT: Attendance + Assignments */}
          <div className="lg:col-span-2 space-y-4">
            {/* Assignment controls */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    {hasAssignments(sess.id)
                      ? `${enrolledEmps.length} assigned to this session`
                      : `${enrolledEmps.length} from program (no specific assignments yet)`
                    }
                  </h3>
                  {getSessionBatches(sess).length > 0 && (
                    <div className="flex gap-1.5 mt-1.5">{getSessionBatches(sess).map(b => (
                      <span key={b.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{b.name}</span>
                    ))}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedEmpIds(new Set()); setAssignModal(true); }} className="flex items-center gap-1.5 border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-50">
                    <Plus className="w-3.5 h-3.5" /> Assign People
                  </button>
                  {getProgramBatches(sess.programId).length > 0 && (
                    <select onChange={e => { if (e.target.value) handleAssignBatch(e.target.value); e.target.value = ''; }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs" defaultValue="">
                      <option value="" disabled>Assign Batch...</option>
                      {getProgramBatches(sess.programId).map(b => <option key={b.id} value={b.id}>{b.name} ({batchMembers.filter(m => m.batchId === b.id).length})</option>)}
                    </select>
                  )}
                  <button onClick={() => setBatchModal(true)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 underline">
                    + New Batch
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="bg-white rounded-xl border">
              <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-blue-500" /> Attendance</h3>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={exportAttendance} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50"><Download className="w-3.5 h-3.5" /> CSV</button>
                  <button onClick={openDocPreview} className="flex items-center gap-1.5 border border-purple-300 text-purple-700 px-3 py-1.5 rounded-lg text-xs hover:bg-purple-50"><FileDown className="w-3.5 h-3.5" /> Report</button>
                  <button onClick={() => { enrolledEmps.forEach(emp => setAttStatus(emp.id, 'Present')); }} className="flex items-center gap-1.5 border border-green-300 text-green-700 px-3 py-1.5 rounded-lg text-xs hover:bg-green-50"><Check className="w-3.5 h-3.5" /> All Present</button>
                  <button onClick={handleSaveAllAttendance} disabled={savingAtt} className="flex items-center gap-1.5 bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-800 disabled:opacity-50">
                    {savingAtt ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />} Save
                  </button>
                </div>
              </div>

              {enrolledEmps.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p>No employees assigned to this session yet.</p>
                  <p className="text-xs mt-1">Click "Assign People" above to add employees, or assign a batch.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {enrolledEmps.map(emp => {
                    const att = localAttendance[emp.id] || { status: '', notes: '' };
                    return (
                      <div key={emp.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">{emp.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.id} · {emp.department}</p>
                        </div>
                        <div className="flex gap-1">
                          {ATTENDANCE_STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => setAttStatus(emp.id, s)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                att.status === s ? attColor[s] + ' border-current ring-1 ring-offset-1' :
                                'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <input
                          value={att.notes}
                          onChange={e => setLocalAttendance(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], status: prev[emp.id]?.status || 'Present', notes: e.target.value } }))}
                          placeholder="Notes..."
                          className="w-32 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                        />
                        {hasAssignments(sess.id) && (
                          <button onClick={() => handleRemoveAssignment(emp.id)} className="p-1 rounded hover:bg-red-50" title="Remove from session">
                            <X className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Assign People Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Employees to This Session" wide>
        {detailSession && (() => {
          const unassigned = getUnassignedEmployees(detailSession);
          return (
            <div className="space-y-4">
              {unassigned.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">All enrolled employees are already assigned to this session.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">{unassigned.length} enrollees not yet assigned</p>
                    <button onClick={() => setSelectedEmpIds(new Set(unassigned.map(e => e.id)))} className="text-xs text-blue-600 hover:underline">Select All</button>
                  </div>
                  <div className="max-h-[350px] overflow-auto divide-y border rounded-lg">
                    {unassigned.map(emp => (
                      <label key={emp.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={selectedEmpIds.has(emp.id)} onChange={() => {
                          setSelectedEmpIds(prev => { const n = new Set(prev); n.has(emp.id) ? n.delete(emp.id) : n.add(emp.id); return n; });
                        }} className="rounded border-gray-300" />
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">{emp.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.department} · {emp.id}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-3 border-t">
                <button onClick={() => setAssignModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleAssignEmployees} disabled={selectedEmpIds.size === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  Assign {selectedEmpIds.size > 0 ? `(${selectedEmpIds.size})` : ''}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Create Batch Modal */}
      <Modal open={batchModal} onClose={() => setBatchModal(false)} title="Create New Batch">
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
            <input required value={batchForm.name} onChange={e => setBatchForm({ ...batchForm, name: e.target.value })} placeholder="e.g., Marketing Batch 1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input value={batchForm.description} onChange={e => setBatchForm({ ...batchForm, description: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <p className="text-xs text-gray-400">After creating, go to Companies → Enrolments to add employees to this batch, then assign the batch to sessions.</p>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setBatchModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Create Batch</button>
          </div>
        </form>
      </Modal>

      <Modal open={docModal} onClose={() => setDocModal(false)} title="Session Report" wide>
        <div className="space-y-4">
          <div className="flex gap-2 mb-3">
            <button onClick={downloadAsDoc} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <FileDown className="w-4 h-4" /> Download .doc
            </button>
            <button onClick={exportAttendance} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              <Download className="w-4 h-4" /> Download CSV
            </button>
            <button onClick={emailReport} className="flex items-center gap-1.5 border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">
              <Mail className="w-4 h-4" /> Email Report
            </button>
          </div>
          <textarea value={docContent} onChange={e => setDocContent(e.target.value)} rows={22}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none resize-y bg-gray-50" />
          <p className="text-xs text-gray-400">Edit the report above before downloading or emailing. Changes here are for this export only.</p>
        </div>
      </Modal>
    </div>
    );
  }

  // ===== MAIN VIEW (Calendar / List) =====
  return (
    <div>
      {toast && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease]">
          <Check className="w-5 h-5" /><p className="text-sm font-medium">{toast}</p>
        </div>
      )}

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
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700"><GraduationCap className="w-4 h-4" /> Trainers</div>
          <div className="flex flex-wrap gap-3">
            {trainers.map(t => {
              const color = trainerColorMap[t.id];
              const count = sessions.filter(s => s.trainerId === t.id).length;
              return (
                <button key={t.id} onClick={() => setFilterTrainer(filterTrainer === t.id ? '' : t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    filterTrainer === t.id ? `${color.bg} ${color.text} ${color.border} ring-2 ring-offset-1 ring-blue-300` :
                    filterTrainer ? 'bg-gray-50 text-gray-400 border-gray-200' : `${color.bg} ${color.text} ${color.border}`}`}>
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />{t.name} ({count})
                </button>
              );
            })}
            {filterTrainer && <button onClick={() => setFilterTrainer('')} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>}
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white rounded-xl border border-gray-200">
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
          <div className="grid grid-cols-7 border-b">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-500 py-2 bg-gray-50">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const daySessions = day ? (sessionsByDate[day] || []) : [];
              return (
                <div key={i} className={`min-h-[110px] border-b border-r p-1.5 ${!day ? 'bg-gray-50/50' : 'hover:bg-blue-50/30 cursor-pointer'} ${i % 7 === 6 ? 'border-r-0' : ''}`}
                  onClick={() => day && openNew(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}>
                  {day && (<>
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{day}</div>
                    <div className="space-y-1">
                      {daySessions.slice(0, 3).map(s => {
                        const color = trainerColorMap[s.trainerId] || TRAINER_COLORS[0];
                        return (
                          <div key={s.id} className={`text-xs px-1.5 py-1 rounded ${color.bg} ${color.text} truncate cursor-pointer hover:ring-1 hover:ring-blue-400`}
                            onClick={(e) => { e.stopPropagation(); openDetail(s); }}
                            title={`${getProgShortCode(s.programId)} · ${s.startTime}-${s.endTime} · ${getTrainerName(s.trainerId)}`}>
                            <span className="font-medium">{s.startTime}</span> {getProgShortCode(s.programId) || getProgName(s.programId).substring(0, 12)}
                          </div>
                        );
                      })}
                      {daySessions.length > 3 && <div className="text-xs text-gray-400 pl-1">+{daySessions.length - 3} more</div>}
                    </div>
                  </>)}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
              <thead><tr className="text-left text-xs text-gray-500 uppercase border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Program / Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
                <th className="px-4 py-3 font-medium">Trainer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(sess => {
                  const TypeIcon = typeIcon[sess.sessionType] || MapPin;
                  const color = trainerColorMap[sess.trainerId] || TRAINER_COLORS[0];
                  const attCount = sessionAttendance.filter(a => a.sessionId === sess.id).length;
                  const enrolledCount = enrolments.filter(e => e.programId === sess.programId).length;
                  return (
                    <tr key={sess.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(sess)}>
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
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{sess.venue || sess.zoomLink || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${attCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {attCount > 0 ? `${attCount}/${enrolledCount}` : 'Not taken'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${color.bg} ${color.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />{getTrainerName(sess.trainerId)}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[sess.status]}`}>{sess.status}</span></td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select required value={form.programId} onChange={e => setForm({ ...form, programId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select program</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <select value={form.sessionType} onChange={e => setForm({ ...form, sessionType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" required value={form.sessionDate} onChange={e => setForm({ ...form, sessionDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label><input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label><input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          {form.sessionType === 'In-Person' && <div><label className="block text-sm font-medium text-gray-700 mb-1">Venue</label><input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Training Room A, Chennai HQ" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
          {form.sessionType === 'Online Sync' && <div><label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label><input value={form.zoomLink} onChange={e => setForm({ ...form, zoomLink: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
          {form.sessionType === 'Online Async' && <div><label className="block text-sm font-medium text-gray-700 mb-1">Material Link</label><input value={form.materialLink} onChange={e => setForm({ ...form, materialLink: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label><input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Trainer</label><select value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"><option value="">Select</option>{trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">{SESSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
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
