import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toCamel, toSnake } from '../lib/transforms';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [employees, setEmployees] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [enrolments, setEnrolments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [programFiles, setProgramFiles] = useState({});
  const [employeeScores, setEmployeeScores] = useState([]);
  const [sessionNotes, setSessionNotes] = useState([]);
  const [sessionAttendance, setSessionAttendance] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchMembers, setBatchMembers] = useState([]);
  const [sessionAssignments, setSessionAssignments] = useState([]);
  const [integrationSettings, setIntegrationSettings] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('connecting');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, trRes, prRes, seRes, enRes, coRes, pfRes, esRes, isRes, nlRes, snRes, saRes, baRes, bmRes, sasgRes] = await Promise.all([
        supabase.from('employees').select('*').order('name'),
        supabase.from('trainers').select('*').order('name'),
        supabase.from('programs').select('*').order('name'),
        supabase.from('sessions').select('*').order('session_date'),
        supabase.from('enrolments').select('*'),
        supabase.from('companies').select('*').order('name'),
        supabase.from('program_files').select('*'),
        supabase.from('employee_scores').select('*'),
        supabase.from('integration_settings').select('*'),
        supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('session_notes').select('*'),
        supabase.from('session_attendance').select('*'),
        supabase.from('batches').select('*'),
        supabase.from('batch_members').select('*'),
        supabase.from('session_assignments').select('*'),
      ]);

      const allResults = [empRes, trRes, prRes, seRes, enRes, coRes, pfRes, esRes, isRes, nlRes];
      const errors = allResults.filter(r => r.error);
      if (errors.length > 0) {
        console.error('[LMS] Supabase load errors:', errors.map(r => r.error));
        setDbStatus(`error: ${errors[0].error.message || errors[0].error.code}`);
      } else {
        setDbStatus('connected');
      }

      setEmployees(toCamel(empRes.data || []));
      setTrainers(toCamel(trRes.data || []));
      setPrograms(toCamel(prRes.data || []));
      setSessions(toCamel(seRes.data || []));
      setEnrolments(toCamel(enRes.data || []));
      setCompanies(toCamel(coRes.data || []));
      setEmployeeScores(toCamel(esRes.data || []));
      setSessionNotes(toCamel(snRes.data || []));
      setSessionAttendance(toCamel(saRes.data || []));
      setBatches(toCamel(baRes.data || []));
      setBatchMembers(toCamel(bmRes.data || []));
      setSessionAssignments(toCamel(sasgRes.data || []));
      setIntegrationSettings(toCamel(isRes.data || []));
      setNotificationLogs(toCamel(nlRes.data || []));

      const filesMap = {};
      (pfRes.data || []).forEach(f => {
        const cf = toCamel(f);
        if (!filesMap[cf.programId]) filesMap[cf.programId] = [];
        filesMap[cf.programId].push(cf);
      });
      setProgramFiles(filesMap);
    } catch (err) {
      console.error('[LMS] Failed to load data:', err);
      setDbStatus(`error: ${err.message}`);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ---- Companies ----
  async function addCompany(c) {
    const payload = toSnake(c);
    console.log('[LMS] addCompany payload:', payload);
    const { data, error } = await supabase.from('companies').insert(payload).select();
    if (error) console.error('[LMS] addCompany error:', error);
    else console.log('[LMS] addCompany success:', data);
    if (!error && data) setCompanies(prev => [...prev, ...toCamel(data)]);
    return { data: toCamel(data), error };
  }
  async function updateCompany(id, updates) {
    const { data, error } = await supabase.from('companies').update({ ...toSnake(updates), updated_at: new Date().toISOString() }).eq('id', id).select();
    if (!error && data) setCompanies(prev => prev.map(c => c.id === id ? toCamel(data[0]) : c));
    return { error };
  }
  async function deleteCompany(id) {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (!error) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      setEmployees(prev => prev.filter(e => e.companyId !== id));
    }
    return { error };
  }

  // ---- Employees ----
  async function addEmployee(emp) {
    const payload = toSnake(emp);
    console.log('[LMS] addEmployee payload:', payload);
    const { data, error } = await supabase.from('employees').insert(payload).select();
    if (error) console.error('[LMS] addEmployee error:', error);
    if (!error && data) setEmployees(prev => [...prev, ...toCamel(data)]);
    return { data: toCamel(data), error };
  }
  async function updateEmployee(id, updates) {
    const { data, error } = await supabase.from('employees').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setEmployees(prev => prev.map(e => e.id === id ? toCamel(data[0]) : e));
    return { error };
  }
  async function deleteEmployee(id) {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) setEmployees(prev => prev.filter(e => e.id !== id));
    return { error };
  }
  async function bulkImportEmployees(list) {
    const payload = list.map(toSnake);
    console.log('[LMS] bulkImport payload (first 2):', payload.slice(0, 2), `...total: ${payload.length}`);
    const { data, error } = await supabase.from('employees').insert(payload).select();
    if (error) console.error('[LMS] bulkImport error:', error);
    else console.log('[LMS] bulkImport success:', data?.length, 'rows');
    if (!error && data) setEmployees(prev => [...prev, ...toCamel(data)]);
    return { data: toCamel(data), error, count: data?.length || 0 };
  }

  // ---- Trainers ----
  async function addTrainer(t) {
    const { data, error } = await supabase.from('trainers').insert(toSnake(t)).select();
    if (!error && data) setTrainers(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function updateTrainer(id, updates) {
    const { data, error } = await supabase.from('trainers').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setTrainers(prev => prev.map(t => t.id === id ? toCamel(data[0]) : t));
    return { error };
  }
  async function deleteTrainer(id) {
    const { error } = await supabase.from('trainers').delete().eq('id', id);
    if (!error) setTrainers(prev => prev.filter(t => t.id !== id));
    return { error };
  }

  // ---- Programs ----
  async function addProgram(p) {
    const { data, error } = await supabase.from('programs').insert(toSnake(p)).select();
    if (!error && data) setPrograms(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function updateProgram(id, updates) {
    const { data, error } = await supabase.from('programs').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setPrograms(prev => prev.map(p => p.id === id ? toCamel(data[0]) : p));
    return { error };
  }
  async function deleteProgram(id) {
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (!error) setPrograms(prev => prev.filter(p => p.id !== id));
    return { error };
  }

  // ---- Sessions ----
  async function addSession(s) {
    const { data, error } = await supabase.from('sessions').insert(toSnake(s)).select();
    if (!error && data) setSessions(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function updateSession(id, updates) {
    const { data, error } = await supabase.from('sessions').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setSessions(prev => prev.map(s => s.id === id ? toCamel(data[0]) : s));
    return { error };
  }
  async function deleteSession(id) {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (!error) setSessions(prev => prev.filter(s => s.id !== id));
    return { error };
  }

  // ---- Session Notes ----
  async function saveSessionNote(sessionId, content) {
    const existing = sessionNotes.find(n => n.sessionId === sessionId);
    if (existing) {
      const { data, error } = await supabase.from('session_notes').update({ content, updated_at: new Date().toISOString() }).eq('id', existing.id).select();
      if (!error && data) setSessionNotes(prev => prev.map(n => n.id === existing.id ? toCamel(data[0]) : n));
      return { error };
    } else {
      const { data, error } = await supabase.from('session_notes').insert({ id: `SN${Date.now()}`, session_id: sessionId, content }).select();
      if (!error && data) setSessionNotes(prev => [...prev, ...toCamel(data)]);
      return { error };
    }
  }

  // ---- Session Attendance ----
  async function saveAttendance(sessionId, empId, status, notes) {
    const existing = sessionAttendance.find(a => a.sessionId === sessionId && a.empId === empId);
    if (existing) {
      const { data, error } = await supabase.from('session_attendance').update(toSnake({ status, notes })).eq('id', existing.id).select();
      if (!error && data) setSessionAttendance(prev => prev.map(a => a.id === existing.id ? toCamel(data[0]) : a));
      return { error };
    } else {
      const row = { id: `SA${Date.now()}${Math.random().toString(36).slice(2, 5)}`, session_id: sessionId, emp_id: empId, status, notes: notes || '' };
      const { data, error } = await supabase.from('session_attendance').insert(row).select();
      if (!error && data) setSessionAttendance(prev => [...prev, ...toCamel(data)]);
      return { error };
    }
  }
  async function bulkSaveAttendance(records) {
    const results = [];
    for (const r of records) {
      const res = await saveAttendance(r.sessionId, r.empId, r.status, r.notes);
      results.push(res);
    }
    return { errors: results.filter(r => r.error) };
  }

  // ---- Batches ----
  async function addBatch(b) {
    const { data, error } = await supabase.from('batches').insert(toSnake(b)).select();
    if (!error && data) setBatches(prev => [...prev, ...toCamel(data)]);
    return { data: toCamel(data), error };
  }
  async function updateBatch(id, updates) {
    const { data, error } = await supabase.from('batches').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setBatches(prev => prev.map(b => b.id === id ? toCamel(data[0]) : b));
    return { error };
  }
  async function deleteBatch(id) {
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (!error) {
      setBatches(prev => prev.filter(b => b.id !== id));
      setBatchMembers(prev => prev.filter(m => m.batchId !== id));
    }
    return { error };
  }

  // ---- Batch Members ----
  async function addBatchMember(batchId, empId) {
    const { data, error } = await supabase.from('batch_members').insert({ id: `BM${Date.now()}${Math.random().toString(36).slice(2,5)}`, batch_id: batchId, emp_id: empId }).select();
    if (!error && data) setBatchMembers(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function bulkAddBatchMembers(batchId, empIds) {
    const rows = empIds.map(empId => ({ id: `BM${Date.now()}${Math.random().toString(36).slice(2,5)}`, batch_id: batchId, emp_id: empId }));
    const { data, error } = await supabase.from('batch_members').insert(rows).select();
    if (!error && data) setBatchMembers(prev => [...prev, ...toCamel(data)]);
    return { count: data?.length || 0, error };
  }
  async function removeBatchMember(id) {
    const { error } = await supabase.from('batch_members').delete().eq('id', id);
    if (!error) setBatchMembers(prev => prev.filter(m => m.id !== id));
    return { error };
  }

  // ---- Session Assignments ----
  async function assignEmployeeToSession(sessionId, empId, batchId) {
    const row = { id: `SASG${Date.now()}${Math.random().toString(36).slice(2,5)}`, session_id: sessionId, emp_id: empId, batch_id: batchId || null };
    const { data, error } = await supabase.from('session_assignments').insert(row).select();
    if (!error && data) setSessionAssignments(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function bulkAssignToSession(sessionId, empIds, batchId) {
    const rows = empIds.map(empId => ({ id: `SASG${Date.now()}${Math.random().toString(36).slice(2,5)}`, session_id: sessionId, emp_id: empId, batch_id: batchId || null }));
    const { data, error } = await supabase.from('session_assignments').insert(rows).select();
    if (!error && data) setSessionAssignments(prev => [...prev, ...toCamel(data)]);
    return { count: data?.length || 0, error };
  }
  async function removeSessionAssignment(id) {
    const { error } = await supabase.from('session_assignments').delete().eq('id', id);
    if (!error) setSessionAssignments(prev => prev.filter(a => a.id !== id));
    return { error };
  }
  async function assignBatchToSession(sessionId, batchId) {
    const members = batchMembers.filter(m => m.batchId === batchId);
    const existing = new Set(sessionAssignments.filter(a => a.sessionId === sessionId).map(a => a.empId));
    const newEmpIds = members.map(m => m.empId).filter(id => !existing.has(id));
    if (newEmpIds.length === 0) return { count: 0, error: null };
    return await bulkAssignToSession(sessionId, newEmpIds, batchId);
  }

  // ---- Enrolments ----
  async function addEnrolment(e) {
    const { data, error } = await supabase.from('enrolments').insert(toSnake(e)).select();
    if (!error && data) setEnrolments(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function updateEnrolment(id, updates) {
    const { data, error } = await supabase.from('enrolments').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setEnrolments(prev => prev.map(e => e.id === id ? toCamel(data[0]) : e));
    return { error };
  }
  async function deleteEnrolment(id) {
    const { error } = await supabase.from('enrolments').delete().eq('id', id);
    if (!error) setEnrolments(prev => prev.filter(e => e.id !== id));
    return { error };
  }
  async function bulkAddEnrolments(list) {
    const { data, error } = await supabase.from('enrolments').insert(list.map(toSnake)).select();
    if (!error && data) setEnrolments(prev => [...prev, ...toCamel(data)]);
    return { count: data?.length || 0, error };
  }

  // ---- Program Files ----
  async function addProgramFile(programId, file) {
    const filePath = `${programId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('program-files').upload(filePath, file);
    if (uploadErr) return { error: uploadErr };
    const { data: urlData } = supabase.storage.from('program-files').getPublicUrl(filePath);
    const meta = { id: `PF${Date.now()}`, program_id: programId, name: file.name, size: file.size, type: file.type, storage_path: filePath };
    const { data, error } = await supabase.from('program_files').insert(meta).select();
    if (!error && data) {
      const cf = toCamel(data[0]);
      cf.url = urlData.publicUrl;
      setProgramFiles(prev => ({ ...prev, [programId]: [...(prev[programId] || []), cf] }));
    }
    return { error };
  }
  async function removeProgramFile(programId, fileId) {
    const file = (programFiles[programId] || []).find(f => f.id === fileId);
    if (file?.storagePath) await supabase.storage.from('program-files').remove([file.storagePath]);
    const { error } = await supabase.from('program_files').delete().eq('id', fileId);
    if (!error) setProgramFiles(prev => ({ ...prev, [programId]: (prev[programId] || []).filter(f => f.id !== fileId) }));
    return { error };
  }

  // ---- Employee Scores ----
  async function addEmployeeScore(score) {
    const { data, error } = await supabase.from('employee_scores').insert(toSnake(score)).select();
    if (!error && data) setEmployeeScores(prev => [...prev, ...toCamel(data)]);
    return { error };
  }

  // ---- Integration Settings ----
  async function saveIntegrationSetting(id, config, enabled) {
    const { data, error } = await supabase.from('integration_settings')
      .update({ config, enabled, updated_at: new Date().toISOString() }).eq('id', id).select();
    if (!error && data) setIntegrationSettings(prev => prev.map(s => s.id === id ? toCamel(data[0]) : s));
    return { error };
  }

  // ---- Notification Logs ----
  async function addNotificationLog(log) {
    const { data, error } = await supabase.from('notification_logs').insert(toSnake(log)).select();
    if (!error && data) setNotificationLogs(prev => [toCamel(data[0]), ...prev]);
    return { error };
  }

  const value = {
    loading, dbStatus, refresh: loadAll,
    companies, addCompany, updateCompany, deleteCompany,
    employees, addEmployee, updateEmployee, deleteEmployee, bulkImportEmployees,
    trainers, addTrainer, updateTrainer, deleteTrainer,
    programs, addProgram, updateProgram, deleteProgram,
    sessions, addSession, updateSession, deleteSession,
    sessionNotes, saveSessionNote,
    sessionAttendance, saveAttendance, bulkSaveAttendance,
    batches, addBatch, updateBatch, deleteBatch,
    batchMembers, addBatchMember, bulkAddBatchMembers, removeBatchMember,
    sessionAssignments, assignEmployeeToSession, bulkAssignToSession, removeSessionAssignment, assignBatchToSession,
    enrolments, addEnrolment, updateEnrolment, deleteEnrolment, bulkAddEnrolments,
    programFiles, addProgramFile, removeProgramFile,
    employeeScores, addEmployeeScore,
    integrationSettings, saveIntegrationSetting,
    notificationLogs, addNotificationLog,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
