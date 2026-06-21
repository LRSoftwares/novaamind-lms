import { seedEmployees, seedTrainers, seedPrograms, seedSessions, seedEnrolments } from '../data/seedData';

const KEYS = {
  employees: 'lms_employees',
  trainers: 'lms_trainers',
  programs: 'lms_programs',
  sessions: 'lms_sessions',
  enrolments: 'lms_enrolments',
  company: 'lms_company',
  programFiles: 'lms_program_files',
  employeeScores: 'lms_employee_scores',
  initialized: 'lms_initialized',
};

function get(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function set(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function initStore() {
  if (localStorage.getItem(KEYS.initialized)) return;
  set(KEYS.employees, seedEmployees);
  set(KEYS.trainers, seedTrainers);
  set(KEYS.programs, seedPrograms);
  set(KEYS.sessions, seedSessions);
  set(KEYS.enrolments, seedEnrolments);
  localStorage.setItem(KEYS.initialized, 'true');
}

export function resetStore() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  initStore();
}

export function clearAllData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  set(KEYS.employees, []);
  set(KEYS.trainers, []);
  set(KEYS.programs, []);
  set(KEYS.sessions, []);
  set(KEYS.enrolments, []);
  localStorage.setItem(KEYS.initialized, 'true');
}

export const store = {
  getEmployees: () => get(KEYS.employees) || [],
  setEmployees: (data) => set(KEYS.employees, data),

  getTrainers: () => get(KEYS.trainers) || [],
  setTrainers: (data) => set(KEYS.trainers, data),

  getPrograms: () => get(KEYS.programs) || [],
  setPrograms: (data) => set(KEYS.programs, data),

  getSessions: () => get(KEYS.sessions) || [],
  setSessions: (data) => set(KEYS.sessions, data),

  getEnrolments: () => get(KEYS.enrolments) || [],
  setEnrolments: (data) => set(KEYS.enrolments, data),

  addEmployee: (emp) => {
    const all = store.getEmployees();
    all.push(emp);
    store.setEmployees(all);
    return all;
  },
  updateEmployee: (id, updates) => {
    const all = store.getEmployees().map(e => e.id === id ? { ...e, ...updates } : e);
    store.setEmployees(all);
    return all;
  },
  deleteEmployee: (id) => {
    const all = store.getEmployees().filter(e => e.id !== id);
    store.setEmployees(all);
    return all;
  },

  addProgram: (prog) => {
    const all = store.getPrograms();
    all.push(prog);
    store.setPrograms(all);
    return all;
  },
  updateProgram: (id, updates) => {
    const all = store.getPrograms().map(p => p.id === id ? { ...p, ...updates } : p);
    store.setPrograms(all);
    return all;
  },
  deleteProgram: (id) => {
    const all = store.getPrograms().filter(p => p.id !== id);
    store.setPrograms(all);
    return all;
  },

  addSession: (sess) => {
    const all = store.getSessions();
    all.push(sess);
    store.setSessions(all);
    return all;
  },
  updateSession: (id, updates) => {
    const all = store.getSessions().map(s => s.id === id ? { ...s, ...updates } : s);
    store.setSessions(all);
    return all;
  },
  deleteSession: (id) => {
    const all = store.getSessions().filter(s => s.id !== id);
    store.setSessions(all);
    return all;
  },

  addEnrolment: (enr) => {
    const all = store.getEnrolments();
    all.push(enr);
    store.setEnrolments(all);
    return all;
  },
  updateEnrolment: (id, updates) => {
    const all = store.getEnrolments().map(e => e.id === id ? { ...e, ...updates } : e);
    store.setEnrolments(all);
    return all;
  },
  deleteEnrolment: (id) => {
    const all = store.getEnrolments().filter(e => e.id !== id);
    store.setEnrolments(all);
    return all;
  },

  addTrainer: (trainer) => {
    const all = store.getTrainers();
    all.push(trainer);
    store.setTrainers(all);
    return all;
  },
  updateTrainer: (id, updates) => {
    const all = store.getTrainers().map(t => t.id === id ? { ...t, ...updates } : t);
    store.setTrainers(all);
    return all;
  },
  deleteTrainer: (id) => {
    const all = store.getTrainers().filter(t => t.id !== id);
    store.setTrainers(all);
    return all;
  },

  getCompany: () => get(KEYS.company) || {},
  setCompany: (data) => set(KEYS.company, data),

  getProgramFiles: () => get(KEYS.programFiles) || {},
  setProgramFiles: (data) => set(KEYS.programFiles, data),
  addProgramFile: (programId, file) => {
    const all = store.getProgramFiles();
    if (!all[programId]) all[programId] = [];
    all[programId].push(file);
    store.setProgramFiles(all);
    return all;
  },
  removeProgramFile: (programId, fileIndex) => {
    const all = store.getProgramFiles();
    if (all[programId]) all[programId].splice(fileIndex, 1);
    store.setProgramFiles(all);
    return all;
  },

  getEmployeeScores: () => get(KEYS.employeeScores) || [],
  setEmployeeScores: (data) => set(KEYS.employeeScores, data),
  addEmployeeScore: (score) => {
    const all = store.getEmployeeScores();
    all.push(score);
    store.setEmployeeScores(all);
    return all;
  },
};
