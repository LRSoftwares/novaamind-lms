import { useState, useMemo, useRef, useEffect } from 'react';
import { Building2, Users, BarChart3, Save, Plus, Edit2, Trash2, Search, Upload, Download, Star, ClipboardCheck, Eye, X, CheckCircle, ArrowLeft, UserPlus, MapPin, Globe, Phone } from 'lucide-react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DEPARTMENTS = ['Marketing', 'Tech', 'Sales', 'Operations', 'HR'];
const DEPT_COLORS = { Marketing: '#3b82f6', Tech: '#8b5cf6', Sales: '#f59e0b', Operations: '#10b981', HR: '#ef4444' };
const ENROL_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Overdue', 'Remedial'];

const emptyCompanyForm = {
  name: '', industry: '', founded: '', website: '', phone: '', email: '',
  address: '', city: '', state: '', country: 'India', about: '', vision: '', mission: '',
};

const emptyEmpForm = {
  name: '', department: 'Marketing', designation: '', siteLocation: '',
  email: '', gender: 'Male', hireDate: '', status: 'Active',
};

export default function Company() {
  const {
    companies, addCompany, updateCompany, deleteCompany,
    employees, addEmployee, updateEmployee, deleteEmployee, bulkImportEmployees,
    enrolments, programs, addEnrolment, updateEnrolment, deleteEnrolment, bulkAddEnrolments,
    employeeScores, addEmployeeScore,
  } = useData();

  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('employees');
  const [companyModal, setCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [saveToast, setSaveToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  const showToast = (msg) => { setSaveToast(msg); setTimeout(() => setSaveToast(''), 3000); };
  const showError = (msg) => { setErrorToast(msg); setTimeout(() => setErrorToast(''), 5000); };

  const selectedCompany = companies.find(c => c.id === selectedId);

  // ===== COMPANY CARDS VIEW (no company selected) =====

  const openNewCompany = () => { setCompanyForm({ ...emptyCompanyForm }); setEditingCompany(null); setCompanyModal(true); };
  const openEditCompany = (c) => { setCompanyForm({ ...c }); setEditingCompany(c.id); setCompanyModal(true); };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    let result;
    if (editingCompany) {
      result = await updateCompany(editingCompany, companyForm);
    } else {
      result = await addCompany({ ...companyForm, id: `CO${Date.now()}` });
    }
    if (result?.error) {
      showError(`Failed to save: ${result.error.message || result.error.code || 'Check if Supabase tables are set up (run the SQL schema)'}`);
      return;
    }
    setCompanyModal(false);
    showToast('Company saved');
  };

  const handleDeleteCompany = async (id) => {
    const empCount = employees.filter(e => e.companyId === id).length;
    const msg = empCount > 0
      ? `This company has ${empCount} employees. Deleting will remove all of them. Continue?`
      : 'Delete this company?';
    if (confirm(msg)) {
      await deleteCompany(id);
      if (selectedId === id) setSelectedId(null);
    }
  };

  const getCompanyEmpCount = (companyId) => employees.filter(e => e.companyId === companyId).length;

  // ===== INSIDE A COMPANY =====

  const companyEmployees = useMemo(() =>
    employees.filter(e => e.companyId === selectedId),
    [employees, selectedId]);

  const companyEnrolments = useMemo(() => {
    const empIds = new Set(companyEmployees.map(e => e.id));
    return enrolments.filter(en => empIds.has(en.empId));
  }, [enrolments, companyEmployees]);

  // Employee management
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState(emptyEmpForm);
  const [profileModal, setProfileModal] = useState(null);
  const [scoreModal, setScoreModal] = useState(null);
  const [scoreForm, setScoreForm] = useState({ category: 'Performance', score: 75, notes: '', date: new Date().toISOString().split('T')[0] });
  const fileRef = useRef();

  // Enrolment management
  const [enrolModal, setEnrolModal] = useState(false);
  const [bulkEnrolModal, setBulkEnrolModal] = useState(false);
  const [enrolForm, setEnrolForm] = useState({ empId: '', programId: '', enrolDate: '', status: 'Not Started', sessionsAttended: 0, avgScore: 0 });
  const [bulkEnrolForm, setBulkEnrolForm] = useState({ programId: '', department: '', enrolDate: '' });
  const [editingEnrol, setEditingEnrol] = useState(null);
  const [enrolSearch, setEnrolSearch] = useState('');
  const [enrolFilterStatus, setEnrolFilterStatus] = useState('');

  const filteredEmps = useMemo(() =>
    companyEmployees.filter(e => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase());
      const matchDept = !filterDept || e.department === filterDept;
      return matchSearch && matchDept;
    }), [companyEmployees, search, filterDept]);

  const deptCounts = useMemo(() => {
    const counts = {};
    companyEmployees.forEach(e => { counts[e.department] = (counts[e.department] || 0) + 1; });
    return counts;
  }, [companyEmployees]);

  const enrichedEnrolments = useMemo(() =>
    companyEnrolments.map(enr => {
      const emp = employees.find(e => e.id === enr.empId);
      const prog = programs.find(p => p.id === enr.programId);
      return { ...enr, empName: emp?.name || 'Unknown', department: emp?.department || '', progName: prog?.name || 'Unknown', passScore: prog?.passScoreThreshold || 70 };
    }).filter(e => {
      const matchSearch = !enrolSearch || e.empName.toLowerCase().includes(enrolSearch.toLowerCase()) || e.progName.toLowerCase().includes(enrolSearch.toLowerCase());
      const matchStatus = !enrolFilterStatus || e.status === enrolFilterStatus;
      return matchSearch && matchStatus;
    }), [companyEnrolments, employees, programs, enrolSearch, enrolFilterStatus]);

  const deptStats = useMemo(() =>
    DEPARTMENTS.map(dept => {
      const deptEmps = companyEmployees.filter(e => e.department === dept);
      const deptEnr = companyEnrolments.filter(en => {
        const emp = employees.find(e => e.id === en.empId);
        return emp?.department === dept;
      });
      const completed = deptEnr.filter(e => e.status === 'Completed').length;
      const overdue = deptEnr.filter(e => e.status === 'Overdue').length;
      const scored = deptEnr.filter(e => e.avgScore > 0);
      return {
        name: dept, employees: deptEmps.length, enrolled: deptEnr.length, completed, overdue,
        avgScore: scored.length > 0 ? Math.round(scored.reduce((s, e) => s + e.avgScore, 0) / scored.length) : 0,
        completionRate: deptEnr.length > 0 ? Math.round((completed / deptEnr.length) * 100) : 0,
      };
    }).filter(d => d.employees > 0), [companyEmployees, companyEnrolments, employees]);

  const pieData = useMemo(() =>
    DEPARTMENTS.map(d => ({ name: d, value: deptCounts[d] || 0 })).filter(d => d.value > 0),
    [deptCounts]);

  const getEmpEnrolments = (empId) => enrolments.filter(e => e.empId === empId);
  const getEmpScores = (empId) => employeeScores.filter(s => s.empId === empId);

  // Handlers
  const openNewEmp = () => { setEmpForm({ ...emptyEmpForm, id: `NAT${String(Date.now()).slice(-5)}`, companyId: selectedId }); setEditingEmp(null); setEmpModalOpen(true); };
  const openEditEmp = (emp) => { setEmpForm({ ...emp }); setEditingEmp(emp.id); setEmpModalOpen(true); };

  const handleSaveEmp = async (e) => {
    e.preventDefault();
    if (editingEmp) await updateEmployee(editingEmp, empForm);
    else await addEmployee({ ...empForm, companyId: selectedId });
    setEmpModalOpen(false);
  };
  const handleDeleteEmp = async (id) => { if (confirm('Delete this employee?')) await deleteEmployee(id); };

  const handleAddScore = async (e) => {
    e.preventDefault();
    await addEmployeeScore({ ...scoreForm, empId: scoreModal, id: `SC${Date.now()}` });
    setScoreModal(null);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      let text = evt.target.result;
      text = text.replace(/^﻿/, '');

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const cleanRow = (r) => {
            const clean = {};
            Object.entries(r).forEach(([k, v]) => {
              clean[k.trim().replace(/^﻿/, '')] = typeof v === 'string' ? v.trim() : v;
            });
            return clean;
          };

          const imported = results.data.map(cleanRow).filter(r => {
            const id = r['Emp ID'] || r['Emp_ID'] || r['EmpID'] || r['Emp Id'] || r['ID'];
            const name = r['Name'] || r['Emp_Name'] || r['Emp Name'] || r['EmpName'] || r['Employee Name'];
            return id || name;
          }).map(r => ({
            id: r['Emp ID'] || r['Emp_ID'] || r['EmpID'] || r['Emp Id'] || r['ID'] || `NAT${String(Date.now()).slice(-5)}${Math.random().toString(36).slice(2, 5)}`,
            companyId: selectedId,
            name: r['Name'] || r['Emp_Name'] || r['Emp Name'] || r['EmpName'] || r['Employee Name'] || '',
            department: r['Department'] || 'Marketing',
            designation: r['Designation'] || '',
            siteLocation: r['Site_Location'] || r['Site Location'] || r['Sitelocation'] || r['Location'] || '',
            email: r['Email'] || r['email'] || '',
            gender: r['Gender'] || r['gender'] || 'Male',
            hireDate: r['Hire_Date'] || r['Hire Date'] || r['HireDate'] || '',
            status: 'Active',
          }));

          if (imported.length === 0) {
            alert(`No employees found in CSV. Check that your file has headers like: Emp ID, Emp Name, Department, Designation.\n\nDetected headers: ${results.meta.fields?.join(', ')}`);
            return;
          }

          const result = await bulkImportEmployees(imported);
          if (result.error) {
            alert(`Import failed: ${result.error.message}`);
          } else {
            alert(`Imported ${result.count} employees into ${selectedCompany?.name}`);
          }
        },
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const csv = Papa.unparse(filteredEmps.map(e => ({
      'Emp ID': e.id, 'Name': e.name, 'Department': e.department,
      'Designation': e.designation, 'Location': e.siteLocation, 'Email': e.email, 'Status': e.status,
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedCompany?.name || 'company'}_employees.csv`;
    a.click();
  };

  const downloadTemplate = () => {
    const template = 'Emp ID,Emp Name,Department,Designation,Email,Gender,Sitelocation\nNAT001,John Doe,Marketing,Executive,john@company.com,Male,Chennai\nNAT002,Jane Smith,Tech,Manager,jane@company.com,Female,Bangalore';
    const blob = new Blob([template], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'employee_import_template.csv';
    a.click();
  };

  // Enrolment handlers
  const openNewEnrol = () => { setEnrolForm({ empId: '', programId: '', enrolDate: new Date().toISOString().split('T')[0], status: 'Not Started', sessionsAttended: 0, avgScore: 0 }); setEditingEnrol(null); setEnrolModal(true); };
  const openEditEnrol = (enr) => { setEnrolForm({ ...enr }); setEditingEnrol(enr.id); setEnrolModal(true); };

  const handleSaveEnrol = async (e) => {
    e.preventDefault();
    const cleaned = { ...enrolForm, empId: enrolForm.empId || null, programId: enrolForm.programId || null };
    let result;
    if (editingEnrol) result = await updateEnrolment(editingEnrol, cleaned);
    else result = await addEnrolment({ ...cleaned, id: `E${Date.now()}` });
    if (result?.error) { alert(`Failed: ${result.error.message}`); return; }
    setEnrolModal(false);
  };
  const handleDeleteEnrol = async (id) => { if (confirm('Remove this enrolment?')) await deleteEnrolment(id); };

  const handleBulkEnrol = async (e) => {
    e.preventDefault();
    const deptEmps = companyEmployees.filter(emp => emp.department === bulkEnrolForm.department);
    const existing = new Set(enrolments.filter(en => en.programId === bulkEnrolForm.programId).map(en => en.empId));
    const newEnrols = deptEmps.filter(emp => !existing.has(emp.id)).map((emp, i) => ({
      id: `E${Date.now()}${i}`, empId: emp.id, programId: bulkEnrolForm.programId,
      enrolDate: bulkEnrolForm.enrolDate || new Date().toISOString().split('T')[0],
      status: 'Not Started', sessionsAttended: 0, avgScore: 0,
    }));
    if (newEnrols.length === 0) { alert('All employees in this department are already enrolled.'); return; }
    const result = await bulkAddEnrolments(newEnrols);
    alert(`Enrolled ${result.count} employees from ${bulkEnrolForm.department}`);
    setBulkEnrolModal(false);
  };

  const statusColor = {
    'Not Started': 'bg-gray-100 text-gray-600', 'In Progress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700', 'Overdue': 'bg-red-100 text-red-700', 'Remedial': 'bg-amber-100 text-amber-700',
  };

  const profileEmp = profileModal ? employees.find(e => e.id === profileModal) : null;

  // ===== RENDER =====

  // --- CARDS VIEW ---
  if (!selectedId) {
    return (
      <div className="relative">
        {saveToast && (
          <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease]">
            <CheckCircle className="w-5 h-5" /><p className="text-sm font-medium">{saveToast}</p>
          </div>
        )}
        {errorToast && (
          <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease] max-w-md">
            <X className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{errorToast}</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-500 text-sm mt-1">{companies.length} registered {companies.length === 1 ? 'company' : 'companies'}</p>
          </div>
          <button onClick={openNewCompany} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No companies registered yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add your first company to start managing employees and enrolments.</p>
            <button onClick={openNewCompany} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1" /> Register Company
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map(c => {
              const empCount = getCompanyEmpCount(c.id);
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group" onClick={() => { setSelectedId(c.id); setTab('employees'); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold">
                        {c.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{c.name}</h3>
                        {c.industry && <p className="text-xs text-gray-400">{c.industry}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditCompany(c)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                      <button onClick={() => handleDeleteCompany(c.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                    {c.city && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{c.city}{c.state ? `, ${c.state}` : ''}</div>}
                    {c.website && <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" />{c.website}</div>}
                    {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.phone}</div>}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{empCount}</p>
                      <p className="text-xs text-gray-400">Employees</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{enrolments.filter(en => companyEmployees.some(ce => ce.companyId === c.id && ce.id === en.empId) && en.status === 'Completed').length}</p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{c.founded || '-'}</p>
                      <p className="text-xs text-gray-400">Founded</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Company Modal */}
        <Modal open={companyModal} onClose={() => setCompanyModal(false)} title={editingCompany ? 'Edit Company' : 'Register New Company'} wide>
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input required value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input value={companyForm.industry} onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Founded</label>
                <input value={companyForm.founded} onChange={e => setCompanyForm({ ...companyForm, founded: e.target.value })} placeholder="2020" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input value={companyForm.city} onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input value={companyForm.state} onChange={e => setCompanyForm({ ...companyForm, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input value={companyForm.country} onChange={e => setCompanyForm({ ...companyForm, country: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea value={companyForm.about} onChange={e => setCompanyForm({ ...companyForm, about: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button type="button" onClick={() => setCompanyModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">{editingCompany ? 'Update' : 'Register'} Company</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // --- DETAIL VIEW (company selected) ---
  const TABS = [
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'enrolments', label: 'Enrolments', icon: UserPlus },
    { key: 'departments', label: 'Dept Tracker', icon: BarChart3 },
    { key: 'details', label: 'Company Details', icon: Building2 },
  ];

  return (
    <div className="relative">
      {saveToast && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease]">
          <CheckCircle className="w-5 h-5" /><p className="text-sm font-medium">{saveToast}</p>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease] max-w-md">
          <X className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{errorToast}</p>
        </div>
      )}

      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setSelectedId(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {selectedCompany?.name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selectedCompany?.name}</h1>
            <p className="text-xs text-gray-400">
              {selectedCompany?.industry ? `${selectedCompany.industry} · ` : ''}{companyEmployees.length} employees · {companyEnrolments.length} enrolments
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1.5 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ===== EMPLOYEES TAB ===== */}
      {tab === 'employees' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterDept('')} className={`px-3 py-1.5 rounded-lg text-sm border ${!filterDept ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>All ({companyEmployees.length})</button>
              {DEPARTMENTS.filter(d => deptCounts[d]).map(d => (
                <button key={d} onClick={() => setFilterDept(d)} className={`px-3 py-1.5 rounded-lg text-sm border ${filterDept === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>{d} ({deptCounts[d]})</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="file" ref={fileRef} accept=".csv" onChange={handleImport} className="hidden" />
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-blue-600 px-3 py-1.5 rounded-lg text-xs hover:bg-blue-50 underline">CSV Template</button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"><Upload className="w-3.5 h-3.5" /> Import</button>
              <button onClick={handleExport} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"><Download className="w-3.5 h-3.5" /> Export</button>
              <button onClick={openNewEmp} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium"><Plus className="w-3.5 h-3.5" /> Add Employee</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-xs text-gray-500 uppercase border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Training</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>{filteredEmps.map(emp => {
                  const empEnr = getEmpEnrolments(emp.id);
                  const trainingAvg = empEnr.filter(e => e.avgScore > 0).length > 0 ? Math.round(empEnr.filter(e => e.avgScore > 0).reduce((s, e) => s + e.avgScore, 0) / empEnr.filter(e => e.avgScore > 0).length) : null;
                  return (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">{emp.name.charAt(0)}</div>
                        <div><p className="text-sm font-medium text-gray-900">{emp.name}</p><p className="text-xs text-gray-400">{emp.id}</p></div>
                      </div></td>
                      <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{emp.department}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.designation}</td>
                      <td className="px-4 py-3">{trainingAvg !== null ? <span className={`text-sm font-medium ${trainingAvg >= 75 ? 'text-green-600' : 'text-amber-600'}`}>{trainingAvg}%</span> : <span className="text-xs text-gray-300">-</span>}</td>
                      <td className="px-4 py-3"><div className="flex gap-1">
                        <button onClick={() => setProfileModal(emp.id)} className="p-1.5 rounded hover:bg-blue-50"><Eye className="w-4 h-4 text-blue-500" /></button>
                        <button onClick={() => { setScoreForm({ category: 'Performance', score: 75, notes: '', date: new Date().toISOString().split('T')[0] }); setScoreModal(emp.id); }} className="p-1.5 rounded hover:bg-amber-50"><Star className="w-4 h-4 text-amber-500" /></button>
                        <button onClick={() => openEditEmp(emp)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                        <button onClick={() => handleDeleteEmp(emp.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div></td>
                    </tr>);
                })}</tbody>
              </table>
              {filteredEmps.length === 0 && <div className="text-center py-12 text-gray-400">No employees found</div>}
            </div>
          </div>
        </div>
      )}

      {/* ===== ENROLMENTS TAB ===== */}
      {tab === 'enrolments' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{companyEnrolments.length} enrolments for {selectedCompany?.name}</p>
            <div className="flex gap-2">
              <button onClick={() => { setBulkEnrolForm({ programId: '', department: '', enrolDate: new Date().toISOString().split('T')[0] }); setBulkEnrolModal(true); }} className="flex items-center gap-2 border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50"><Users className="w-3.5 h-3.5" /> Bulk Enrol</button>
              <button onClick={openNewEnrol} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium"><Plus className="w-3.5 h-3.5" /> New Enrolment</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={enrolSearch} onChange={(e) => setEnrolSearch(e.target.value)} placeholder="Search employee or program..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <select value={enrolFilterStatus} onChange={e => setEnrolFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">All Statuses</option>
                {ENROL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-xs text-gray-500 uppercase border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Enrolled</th>
                  <th className="px-4 py-3 font-medium">Sessions</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>{enrichedEnrolments.map(enr => (
                  <tr key={enr.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{enr.empName}</p><p className="text-xs text-gray-400">{enr.department}</p></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{enr.progName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{enr.enrolDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{enr.sessionsAttended}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${enr.avgScore >= enr.passScore ? 'text-green-600' : enr.avgScore > 0 ? 'text-red-500' : 'text-gray-400'}`}>{enr.avgScore > 0 ? `${enr.avgScore}%` : '-'}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[enr.status]}`}>{enr.status}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button onClick={() => openEditEnrol(enr)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDeleteEnrol(enr.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
              {enrichedEnrolments.length === 0 && <div className="text-center py-12 text-gray-400">No enrolments yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* ===== DEPT TRACKER TAB ===== */}
      {tab === 'departments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Headcount</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {pieData.map(d => <Cell key={d.name} fill={DEPT_COLORS[d.name] || '#94a3b8'} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Training Completion</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue" fill="#ef4444" name="Overdue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b"><h3 className="font-semibold text-gray-900">Department Scorecard</h3></div>
            <table className="w-full"><thead><tr className="text-left text-xs text-gray-500 uppercase border-b bg-gray-50">
              <th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Headcount</th><th className="px-4 py-3 font-medium">Enrolled</th>
              <th className="px-4 py-3 font-medium">Completed</th><th className="px-4 py-3 font-medium">Avg Score</th><th className="px-4 py-3 font-medium">Rate</th>
            </tr></thead>
            <tbody>{deptStats.map(d => (
              <tr key={d.name} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: DEPT_COLORS[d.name] }} /><span className="text-sm font-medium">{d.name}</span></div></td>
                <td className="px-4 py-3 text-sm">{d.employees}</td><td className="px-4 py-3 text-sm">{d.enrolled}</td>
                <td className="px-4 py-3 text-sm text-green-600">{d.completed}</td>
                <td className="px-4 py-3 text-sm">{d.avgScore > 0 ? `${d.avgScore}%` : '-'}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${d.completionRate >= 75 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${d.completionRate}%` }} /></div><span className="text-xs">{d.completionRate}%</span></div></td>
              </tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== DETAILS TAB ===== */}
      {tab === 'details' && selectedCompany && (
        <div className="bg-white rounded-xl border p-6">
          <CompanyDetailsForm company={selectedCompany} onSave={async (data) => { await updateCompany(selectedId, data); setSaveToast(true); setTimeout(() => setSaveToast(false), 3000); }} />
        </div>
      )}

      {/* ===== MODALS ===== */}
      <Modal open={empModalOpen} onClose={() => setEmpModalOpen(false)} title={editingEmp ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSaveEmp} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <input value={empForm.id} onChange={e => setEmpForm({ ...empForm, id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" disabled={!!editingEmp} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input required value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <input value={empForm.designation} onChange={e => setEmpForm({ ...empForm, designation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input value={empForm.siteLocation} onChange={e => setEmpForm({ ...empForm, siteLocation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setEmpModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">{editingEmp ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!scoreModal} onClose={() => setScoreModal(null)} title={`Score: ${employees.find(e => e.id === scoreModal)?.name || ''}`}>
        <form onSubmit={handleAddScore} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={scoreForm.category} onChange={e => setScoreForm({ ...scoreForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            {['Performance', 'Technical Skills', 'Communication', 'Leadership', 'Teamwork', 'Problem Solving'].map(c => <option key={c}>{c}</option>)}
          </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
          <input type="number" min="0" max="100" value={scoreForm.score} onChange={e => setScoreForm({ ...scoreForm, score: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={scoreForm.notes} onChange={e => setScoreForm({ ...scoreForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setScoreModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">Save Score</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!profileModal} onClose={() => setProfileModal(null)} title={`Profile: ${profileEmp?.name || ''}`} wide>
        {profileEmp && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold">{profileEmp.name.charAt(0)}</div>
              <div><h3 className="text-lg font-semibold">{profileEmp.name}</h3><p className="text-sm text-gray-500">{profileEmp.designation} · {profileEmp.department}</p><p className="text-xs text-gray-400">{profileEmp.id} · {profileEmp.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-blue-500" /> Enrolments</h4>
              {getEmpEnrolments(profileEmp.id).length === 0 ? <p className="text-sm text-gray-400">None</p> : getEmpEnrolments(profileEmp.id).map(en => {
                const prog = programs.find(p => p.id === en.programId);
                return <div key={en.id} className="p-2 bg-gray-50 rounded border text-sm mb-2"><div className="flex justify-between"><span className="font-medium">{prog?.name}</span><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[en.status]}`}>{en.status}</span></div><p className="text-xs text-gray-400">Score: {en.avgScore > 0 ? `${en.avgScore}%` : '-'}</p></div>;
              })}</div>
              <div><h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> Scores</h4>
              {getEmpScores(profileEmp.id).length === 0 ? <p className="text-sm text-gray-400">None</p> : getEmpScores(profileEmp.id).map(sc => (
                <div key={sc.id} className="p-2 bg-gray-50 rounded border text-sm mb-2"><div className="flex justify-between"><span className="font-medium">{sc.category}</span><span className={`font-bold ${sc.score >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{sc.score}/100</span></div>{sc.notes && <p className="text-xs text-gray-400">{sc.notes}</p>}</div>
              ))}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={enrolModal} onClose={() => setEnrolModal(false)} title={editingEnrol ? 'Edit Enrolment' : 'New Enrolment'}>
        <form onSubmit={handleSaveEnrol} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select required value={enrolForm.empId} onChange={e => setEnrolForm({ ...enrolForm, empId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" disabled={!!editingEnrol}>
            <option value="">Select</option>{companyEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
          </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select required value={enrolForm.programId} onChange={e => setEnrolForm({ ...enrolForm, programId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" disabled={!!editingEnrol}>
            <option value="">Select</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={enrolForm.enrolDate} onChange={e => setEnrolForm({ ...enrolForm, enrolDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={enrolForm.status} onChange={e => setEnrolForm({ ...enrolForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
              {ENROL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select></div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setEnrolModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium">{editingEnrol ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={bulkEnrolModal} onClose={() => setBulkEnrolModal(false)} title="Bulk Enrol by Department">
        <form onSubmit={handleBulkEnrol} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select required value={bulkEnrolForm.programId} onChange={e => setBulkEnrolForm({ ...bulkEnrolForm, programId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">Select</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select required value={bulkEnrolForm.department} onChange={e => setBulkEnrolForm({ ...bulkEnrolForm, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">Select</option>{DEPARTMENTS.filter(d => deptCounts[d]).map(d => <option key={d}>{d} ({deptCounts[d]} employees)</option>)}
          </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Enrol Date</label>
          <input type="date" value={bulkEnrolForm.enrolDate} onChange={e => setBulkEnrolForm({ ...bulkEnrolForm, enrolDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setBulkEnrolModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium">Enrol Department</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CompanyDetailsForm({ company, onSave }) {
  const [form, setForm] = useState({ ...company });
  useEffect(() => { setForm({ ...company }); }, [company]);

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
        <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
        <input value={form.industry || ''} onChange={e => setForm({ ...form, industry: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Founded</label><input value={form.founded || ''} onChange={e => setForm({ ...form, founded: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">About</label><textarea value={form.about || ''} onChange={e => setForm({ ...form, about: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Vision</label><textarea value={form.vision || ''} onChange={e => setForm({ ...form, vision: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Mission</label><textarea value={form.mission || ''} onChange={e => setForm({ ...form, mission: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
      <div className="flex justify-end pt-3 border-t">
        <button type="submit" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium"><Save className="w-4 h-4" /> Save Details</button>
      </div>
    </form>
  );
}
