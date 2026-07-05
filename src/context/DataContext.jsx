import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toCamel, toSnake } from '../lib/transforms';
import { extractPdfCoverThumbnail } from '../lib/pdfCover';
import { extractEpubCoverThumbnail } from '../lib/epubCover';

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
  const [sessionPhotos, setSessionPhotos] = useState([]);
  const [sessionSubmissions, setSessionSubmissions] = useState([]);
  const [kpiDefinitions, setKpiDefinitions] = useState([]);
  const [kpiSubmissions, setKpiSubmissions] = useState([]);
  const [kpiDataPoints, setKpiDataPoints] = useState([]);
  const [kpiCertifications, setKpiCertifications] = useState([]);
  const [integrationSettings, setIntegrationSettings] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [assessmentCandidates, setAssessmentCandidates] = useState([]);
  const [assessmentAttempts, setAssessmentAttempts] = useState([]);
  const [assessmentResponses, setAssessmentResponses] = useState([]);
  const [assessmentLinks, setAssessmentLinks] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [readingHubItems, setReadingHubItems] = useState([]);
  const [readingHubIdeas, setReadingHubIdeas] = useState([]);
  const [readingHubPerspectives, setReadingHubPerspectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('connecting');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, trRes, prRes, seRes, enRes, coRes, pfRes, esRes, isRes, nlRes, snRes, saRes, baRes, bmRes, sasgRes, spRes, ssRes, kdRes, ksRes, kpRes, kcRes, asmRes, aqRes, acRes, aaRes, arRes, alRes, thRes, rhiRes, rhdRes, rhpRes] = await Promise.all([
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
        supabase.from('session_photos').select('*'),
        supabase.from('session_submissions').select('*'),
        supabase.from('kpi_definitions').select('*').order('sort_order'),
        supabase.from('kpi_submissions').select('*').order('week_ending', { ascending: false }),
        supabase.from('kpi_data_points').select('*'),
        supabase.from('kpi_certifications').select('*'),
        supabase.from('assessments').select('*').order('created_at', { ascending: false }),
        supabase.from('assessment_questions').select('*').order('sort_order'),
        supabase.from('assessment_candidates').select('*').order('registered_at', { ascending: false }),
        supabase.from('assessment_attempts').select('*').order('created_at', { ascending: false }),
        supabase.from('assessment_responses').select('*'),
        supabase.from('assessment_links').select('*'),
        supabase.from('thoughts').select('*').order('updated_at', { ascending: false }),
        supabase.from('reading_hub_items').select('*').order('created_at', { ascending: false }),
        supabase.from('reading_hub_ideas').select('*').order('created_at'),
        supabase.from('reading_hub_perspectives').select('*').order('created_at', { ascending: false }),
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
      setSessionPhotos(toCamel(spRes.data || []));
      setSessionSubmissions(toCamel(ssRes.data || []));
      setKpiDefinitions(toCamel(kdRes.data || []));
      setKpiSubmissions(toCamel(ksRes.data || []));
      setKpiDataPoints(toCamel(kpRes.data || []));
      setKpiCertifications(toCamel(kcRes.data || []));
      setIntegrationSettings(toCamel(isRes.data || []));
      setNotificationLogs(toCamel(nlRes.data || []));
      setAssessments(toCamel(asmRes.data || []));
      setAssessmentQuestions(toCamel(aqRes.data || []));
      setAssessmentCandidates(toCamel(acRes.data || []));
      setAssessmentAttempts(toCamel(aaRes.data || []));
      setAssessmentResponses(toCamel(arRes.data || []));
      setAssessmentLinks(toCamel(alRes.data || []));
      setThoughts(toCamel(thRes.data || []));
      setReadingHubItems(toCamel(rhiRes.data || []));
      setReadingHubIdeas(toCamel(rhdRes.data || []));
      setReadingHubPerspectives(toCamel(rhpRes.data || []));

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

  // ---- Session Photos ----
  async function addSessionPhoto(sessionId, file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `session-photos/${sessionId}/${Date.now()}_${safeName}`;
    console.log('[LMS] uploading photo:', filePath);
    const { error: uploadErr } = await supabase.storage.from('program-files').upload(filePath, file);
    if (uploadErr) { console.error('[LMS] photo upload error:', uploadErr); return { error: uploadErr }; }
    const { data: urlData } = supabase.storage.from('program-files').getPublicUrl(filePath);
    const photoUrl = urlData.publicUrl;
    const row = { id: `SP${Date.now()}${Math.random().toString(36).slice(2,4)}`, session_id: sessionId, name: file.name, storage_path: photoUrl };
    const { data, error } = await supabase.from('session_photos').insert(row).select();
    if (error) console.error('[LMS] photo DB insert error:', error);
    if (!error && data) {
      const photo = toCamel(data[0]);
      setSessionPhotos(prev => [...prev, photo]);
    }
    return { error };
  }
  async function removeSessionPhoto(id) {
    const photo = sessionPhotos.find(p => p.id === id);
    if (photo?.storagePath) await supabase.storage.from('program-files').remove([photo.storagePath]);
    const { error } = await supabase.from('session_photos').delete().eq('id', id);
    if (!error) setSessionPhotos(prev => prev.filter(p => p.id !== id));
    return { error };
  }

  // ---- Session Submissions ----
  async function addSessionSubmission(sub) {
    const { data, error } = await supabase.from('session_submissions').insert(toSnake(sub)).select();
    if (!error && data) setSessionSubmissions(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function updateSessionSubmission(id, updates) {
    const { data, error } = await supabase.from('session_submissions').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setSessionSubmissions(prev => prev.map(s => s.id === id ? toCamel(data[0]) : s));
    return { error };
  }
  async function removeSessionSubmission(id) {
    const { error } = await supabase.from('session_submissions').delete().eq('id', id);
    if (!error) setSessionSubmissions(prev => prev.filter(s => s.id !== id));
    return { error };
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

  // ---- KPI Definitions ----
  async function addKpiDefinition(def) {
    const { data, error } = await supabase.from('kpi_definitions').insert(toSnake(def)).select();
    if (!error && data) setKpiDefinitions(prev => [...prev, ...toCamel(data)]);
    return { error };
  }
  async function bulkAddKpiDefinitions(list) {
    const { data, error } = await supabase.from('kpi_definitions').insert(list.map(toSnake)).select();
    if (!error && data) setKpiDefinitions(prev => [...prev, ...toCamel(data)]);
    return { count: data?.length || 0, error };
  }
  async function updateKpiDefinition(id, updates) {
    const { data, error } = await supabase.from('kpi_definitions').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setKpiDefinitions(prev => prev.map(d => d.id === id ? toCamel(data[0]) : d));
    return { error };
  }
  async function deleteKpiDefinition(id) {
    const { error } = await supabase.from('kpi_definitions').delete().eq('id', id);
    if (!error) setKpiDefinitions(prev => prev.filter(d => d.id !== id));
    return { error };
  }
  async function lockBaselines(companyId, department) {
    const defs = kpiDefinitions.filter(d => d.companyId === companyId && d.department === department);
    const ids = defs.map(d => d.id);
    const { error } = await supabase.from('kpi_definitions').update({ baseline_locked: true }).in('id', ids);
    if (!error) setKpiDefinitions(prev => prev.map(d => ids.includes(d.id) ? { ...d, baselineLocked: true } : d));
    return { error };
  }
  async function unlockBaselines(companyId, department) {
    const defs = kpiDefinitions.filter(d => d.companyId === companyId && d.department === department);
    const ids = defs.map(d => d.id);
    const { error } = await supabase.from('kpi_definitions').update({ baseline_locked: false }).in('id', ids);
    if (!error) setKpiDefinitions(prev => prev.map(d => ids.includes(d.id) ? { ...d, baselineLocked: false } : d));
    return { error };
  }

  // ---- KPI Submissions ----
  async function addKpiSubmission(sub) {
    const { data, error } = await supabase.from('kpi_submissions').insert(toSnake(sub)).select();
    if (!error && data) setKpiSubmissions(prev => [...prev, ...toCamel(data)]);
    return { data: toCamel(data), error };
  }
  async function updateKpiSubmission(id, updates) {
    const { data, error } = await supabase.from('kpi_submissions').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setKpiSubmissions(prev => prev.map(s => s.id === id ? toCamel(data[0]) : s));
    return { error };
  }

  // ---- KPI Data Points ----
  async function bulkSaveKpiDataPoints(submissionId, points) {
    await supabase.from('kpi_data_points').delete().eq('submission_id', submissionId);
    setKpiDataPoints(prev => prev.filter(p => p.submissionId !== submissionId));
    if (points.length === 0) return { count: 0, error: null };
    const rows = points.map(p => ({ ...toSnake(p), submission_id: submissionId }));
    const { data, error } = await supabase.from('kpi_data_points').insert(rows).select();
    if (!error && data) setKpiDataPoints(prev => [...prev, ...toCamel(data)]);
    return { count: data?.length || 0, error };
  }

  // ---- KPI Certifications ----
  async function addKpiCertification(cert) {
    const { data, error } = await supabase.from('kpi_certifications').insert(toSnake(cert)).select();
    if (!error && data) setKpiCertifications(prev => [...prev, ...toCamel(data)]);
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

  // ---- Assessments ----
  async function addAssessment(a) {
    const payload = toSnake(a);
    if (!payload.program_id) payload.program_id = null;
    console.log('[LMS] addAssessment payload:', payload);
    const { data, error } = await supabase.from('assessments').insert(payload).select();
    if (error) console.error('[LMS] addAssessment error:', error);
    else console.log('[LMS] addAssessment success:', data);
    if (!error && data) setAssessments(prev => [...toCamel(data), ...prev]);
    return { data: toCamel(data), error };
  }
  async function updateAssessment(id, updates) {
    const { data, error } = await supabase.from('assessments').update({ ...toSnake(updates), updated_at: new Date().toISOString() }).eq('id', id).select();
    if (!error && data) setAssessments(prev => prev.map(a => a.id === id ? toCamel(data[0]) : a));
    return { error };
  }
  async function deleteAssessment(id) {
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (!error) {
      setAssessments(prev => prev.filter(a => a.id !== id));
      setAssessmentQuestions(prev => prev.filter(q => q.assessmentId !== id));
      setAssessmentLinks(prev => prev.filter(l => l.assessmentId !== id));
    }
    return { error };
  }
  async function publishAssessment(id) {
    const slug = Math.random().toString(36).slice(2, 10);
    const linkId = `AL${Date.now()}`;
    const { error: aErr } = await supabase.from('assessments').update({ status: 'Published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id);
    if (aErr) return { error: aErr };
    const { data: linkData, error: lErr } = await supabase.from('assessment_links').insert({ id: linkId, assessment_id: id, slug, is_active: true }).select();
    if (!lErr && linkData) setAssessmentLinks(prev => [...prev, ...toCamel(linkData)]);
    setAssessments(prev => prev.map(a => a.id === id ? { ...a, status: 'Published', publishedAt: new Date().toISOString() } : a));
    return { slug, error: lErr };
  }

  // ---- Assessment Questions ----
  async function addAssessmentQuestion(q) {
    const payload = toSnake(q);
    console.log('[LMS] addAssessmentQuestion payload:', payload);
    const { data, error } = await supabase.from('assessment_questions').insert(payload).select();
    if (error) console.error('[LMS] addAssessmentQuestion error:', error.message, error.code, error.details, JSON.stringify(error));
    else console.log('[LMS] addAssessmentQuestion success:', data);
    if (!error && data) setAssessmentQuestions(prev => [...prev, ...toCamel(data)]);
    return { data: toCamel(data), error };
  }
  async function updateAssessmentQuestion(id, updates) {
    const { data, error } = await supabase.from('assessment_questions').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setAssessmentQuestions(prev => prev.map(q => q.id === id ? toCamel(data[0]) : q));
    return { error };
  }
  async function deleteAssessmentQuestion(id) {
    const { error } = await supabase.from('assessment_questions').delete().eq('id', id);
    if (!error) setAssessmentQuestions(prev => prev.filter(q => q.id !== id));
    return { error };
  }

  // ---- Assessment Links ----
  async function deleteAssessmentLink(id) {
    const { error } = await supabase.from('assessment_links').delete().eq('id', id);
    if (!error) setAssessmentLinks(prev => prev.filter(l => l.id !== id));
    return { error };
  }

  // ---- Assessment Attempts (admin grading) ----
  async function updateAssessmentAttempt(id, updates) {
    const { data, error } = await supabase.from('assessment_attempts').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setAssessmentAttempts(prev => prev.map(a => a.id === id ? toCamel(data[0]) : a));
    return { error };
  }

  // ---- Thoughts ----
  async function addThought(t) {
    const payload = toSnake(t);
    const { data, error } = await supabase.from('thoughts').insert(payload).select();
    if (error) console.error('[LMS] addThought error:', error);
    if (!error && data) setThoughts(prev => [toCamel(data[0]), ...prev]);
    return { error: error?.message };
  }
  async function updateThought(id, updates) {
    const payload = toSnake({ ...updates, updatedAt: new Date().toISOString() });
    const { data, error } = await supabase.from('thoughts').update(payload).eq('id', id).select();
    if (error) console.error('[LMS] updateThought error:', error);
    if (!error && data) setThoughts(prev => prev.map(t => t.id === id ? toCamel(data[0]) : t));
    return { error: error?.message };
  }
  async function deleteThought(id) {
    const { error } = await supabase.from('thoughts').delete().eq('id', id);
    if (!error) setThoughts(prev => prev.filter(t => t.id !== id));
    return { error: error?.message };
  }

  // ---- Reading Hub Items ----
  async function addReadingHubItem(file, overrides = {}) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `reading-hub/${Date.now()}_${safeName}`;
    const { error: uploadErr } = await supabase.storage.from('program-files').upload(filePath, file);
    if (uploadErr) { console.error('[LMS] reading hub upload error:', uploadErr); return { error: uploadErr.message }; }
    const { data: urlData } = supabase.storage.from('program-files').getPublicUrl(filePath);
    const row = {
      id: `LI${Date.now()}${Math.random().toString(36).slice(2, 4)}`,
      kind: 'document',
      title: file.name.replace(/\.[^.]+$/, ''),
      category: 'Reports',
      chips: ['UPLOAD'],
      file_type: file.type === 'application/pdf' ? 'PDF' : 'DOCX',
      file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      mime_type: file.type,
      size: file.size,
      storage_path: urlData.publicUrl,
      ...toSnake(overrides),
    };
    const { data, error } = await supabase.from('reading_hub_items').insert(row).select();
    if (error) { console.error('[LMS] addReadingHubItem error:', error); return { error: error.message }; }
    setReadingHubItems(prev => [toCamel(data[0]), ...prev]);
    return { data: toCamel(data[0]), error: null };
  }
  async function addReadingHubBook(file, meta = {}) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `reading-hub/${Date.now()}_${safeName}`;
    const { error: uploadErr } = await supabase.storage.from('program-files').upload(filePath, file);
    if (uploadErr) { console.error('[LMS] addReadingHubBook upload error:', uploadErr); return { error: uploadErr.message }; }
    const { data: urlData } = supabase.storage.from('program-files').getPublicUrl(filePath);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isEpub = file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub');

    let coverImageUrl = null;
    try {
      const thumbBlob = isPdf ? await extractPdfCoverThumbnail(file) : isEpub ? await extractEpubCoverThumbnail(file) : null;
      if (thumbBlob) {
        const extByMime = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
        const coverExt = extByMime[thumbBlob.type] || 'jpg';
        const coverPath = `reading-hub/covers/${Date.now()}_${safeName}.${coverExt}`;
        const { error: coverErr } = await supabase.storage.from('program-files').upload(coverPath, thumbBlob, { contentType: thumbBlob.type || 'image/jpeg' });
        if (coverErr) console.error('[LMS] cover thumbnail upload error:', coverErr);
        else coverImageUrl = supabase.storage.from('program-files').getPublicUrl(coverPath).data.publicUrl;
      }
    } catch (err) {
      console.error('[LMS] cover extraction error:', err);
    }

    const row = {
      id: `LI${Date.now()}${Math.random().toString(36).slice(2, 4)}`,
      kind: 'book',
      title: meta.title || file.name.replace(/\.[^.]+$/, ''),
      author: meta.author || null,
      category: 'Books',
      status: 'want-to-read',
      file_type: isPdf ? 'PDF' : isEpub ? 'EPUB' : 'DOCX',
      file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      mime_type: file.type,
      size: file.size,
      storage_path: urlData.publicUrl,
      cover_image_url: coverImageUrl,
    };
    const { data, error } = await supabase.from('reading_hub_items').insert(row).select();
    if (error) { console.error('[LMS] addReadingHubBook error:', error); return { error: error.message }; }
    setReadingHubItems(prev => [toCamel(data[0]), ...prev]);
    return { data: toCamel(data[0]), error: null };
  }
  async function updateReadingHubItem(id, updates) {
    const payload = { ...toSnake(updates), updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('reading_hub_items').update(payload).eq('id', id).select();
    if (error) { console.error('[LMS] updateReadingHubItem error:', error); return { error: error.message }; }
    setReadingHubItems(prev => prev.map(i => i.id === id ? toCamel(data[0]) : i));
    return { error: null };
  }
  async function trashReadingHubItem(id) {
    return updateReadingHubItem(id, { deletedAt: new Date().toISOString() });
  }
  async function restoreReadingHubItem(id) {
    return updateReadingHubItem(id, { deletedAt: null });
  }
  async function permanentlyDeleteReadingHubItem(id) {
    const item = readingHubItems.find(i => i.id === id);
    if (item?.storagePath) {
      const path = item.storagePath.split('/program-files/')[1];
      if (path) await supabase.storage.from('program-files').remove([path]);
    }
    const { error } = await supabase.from('reading_hub_items').delete().eq('id', id);
    if (!error) {
      setReadingHubItems(prev => prev.filter(i => i.id !== id));
      setReadingHubIdeas(prev => prev.filter(idea => idea.itemId !== id));
    }
    return { error: error?.message };
  }

  // ---- Reading Hub Ideas ----
  async function addReadingHubIdea(itemId, idea) {
    const row = {
      id: `RHIDEA${Date.now()}${Math.random().toString(36).slice(2, 4)}`,
      item_id: itemId,
      chapter: idea.chapter || null,
      title: idea.title,
      quote: idea.quote || null,
      tags: idea.tags || [],
    };
    const { data, error } = await supabase.from('reading_hub_ideas').insert(row).select();
    if (error) { console.error('[LMS] addReadingHubIdea error:', error); return { error: error.message }; }
    setReadingHubIdeas(prev => [...prev, toCamel(data[0])]);
    const item = readingHubItems.find(i => i.id === itemId);
    await updateReadingHubItem(itemId, { ideaCount: (item?.ideaCount || 0) + 1 });
    return { error: null };
  }
  async function updateReadingHubIdea(id, updates) {
    const payload = {
      chapter: updates.chapter ?? null,
      title: updates.title,
      quote: updates.quote ?? null,
      tags: updates.tags || [],
    };
    const { data, error } = await supabase.from('reading_hub_ideas').update(payload).eq('id', id).select();
    if (error) { console.error('[LMS] updateReadingHubIdea error:', error); return { error: error.message }; }
    setReadingHubIdeas(prev => prev.map(i => i.id === id ? toCamel(data[0]) : i));
    return { error: null };
  }
  async function deleteReadingHubIdea(id) {
    const idea = readingHubIdeas.find(i => i.id === id);
    const { error } = await supabase.from('reading_hub_ideas').delete().eq('id', id);
    if (error) { console.error('[LMS] deleteReadingHubIdea error:', error); return { error: error.message }; }
    setReadingHubIdeas(prev => prev.filter(i => i.id !== id));
    if (idea) {
      const item = readingHubItems.find(i => i.id === idea.itemId);
      if (item) await updateReadingHubItem(item.id, { ideaCount: Math.max(0, (item.ideaCount || 0) - 1) });
    }
    return { error: null };
  }

  // ---- Reading Hub Perspectives ----
  async function addReadingHubPerspective(itemId, content) {
    const row = {
      id: `RHP${Date.now()}${Math.random().toString(36).slice(2, 4)}`,
      item_id: itemId,
      content,
    };
    const { data, error } = await supabase.from('reading_hub_perspectives').insert(row).select();
    if (error) { console.error('[LMS] addReadingHubPerspective error:', error); return { error: error.message }; }
    setReadingHubPerspectives(prev => [toCamel(data[0]), ...prev]);
    return { error: null };
  }
  async function updateReadingHubPerspective(id, content) {
    const { data, error } = await supabase.from('reading_hub_perspectives').update({ content }).eq('id', id).select();
    if (error) { console.error('[LMS] updateReadingHubPerspective error:', error); return { error: error.message }; }
    setReadingHubPerspectives(prev => prev.map(p => p.id === id ? toCamel(data[0]) : p));
    return { error: null };
  }
  async function deleteReadingHubPerspective(id) {
    const { error } = await supabase.from('reading_hub_perspectives').delete().eq('id', id);
    if (!error) setReadingHubPerspectives(prev => prev.filter(p => p.id !== id));
    return { error: error?.message };
  }

  // ---- Assessment Responses (admin grading) ----
  async function updateAssessmentResponse(id, updates) {
    const { data, error } = await supabase.from('assessment_responses').update(toSnake(updates)).eq('id', id).select();
    if (!error && data) setAssessmentResponses(prev => prev.map(r => r.id === id ? toCamel(data[0]) : r));
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
    sessionPhotos, addSessionPhoto, removeSessionPhoto,
    sessionSubmissions, addSessionSubmission, updateSessionSubmission, removeSessionSubmission,
    kpiDefinitions, addKpiDefinition, bulkAddKpiDefinitions, updateKpiDefinition, deleteKpiDefinition, lockBaselines, unlockBaselines,
    kpiSubmissions, addKpiSubmission, updateKpiSubmission,
    kpiDataPoints, bulkSaveKpiDataPoints,
    kpiCertifications, addKpiCertification,
    enrolments, addEnrolment, updateEnrolment, deleteEnrolment, bulkAddEnrolments,
    programFiles, addProgramFile, removeProgramFile,
    employeeScores, addEmployeeScore,
    integrationSettings, saveIntegrationSetting,
    notificationLogs, addNotificationLog,
    assessments, addAssessment, updateAssessment, deleteAssessment, publishAssessment,
    assessmentQuestions, addAssessmentQuestion, updateAssessmentQuestion, deleteAssessmentQuestion,
    assessmentCandidates, assessmentAttempts, updateAssessmentAttempt,
    assessmentResponses, updateAssessmentResponse,
    assessmentLinks, deleteAssessmentLink,
    thoughts, addThought, updateThought, deleteThought,
    readingHubItems, addReadingHubItem, addReadingHubBook, updateReadingHubItem, trashReadingHubItem, restoreReadingHubItem, permanentlyDeleteReadingHubItem,
    readingHubIdeas, addReadingHubIdea, updateReadingHubIdea, deleteReadingHubIdea,
    readingHubPerspectives, addReadingHubPerspective, updateReadingHubPerspective, deleteReadingHubPerspective,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
