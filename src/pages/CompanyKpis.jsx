import { useState, useMemo } from 'react';
import { Target, TrendingUp, Heart, Zap, Plus, Lock, Unlock, Settings, X, Check, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { KPI_TEMPLATES, PILLAR_INFO, calcProgress, getHealthColor, getHealthLabel } from '../data/kpiTemplates';
import KpiProgressBar from '../components/KpiProgressBar';
import Modal from '../components/Modal';

const PILLAR_ICONS = { S: TrendingUp, E: Heart, O: Zap };

export default function CompanyKpis({ companyId }) {
  const {
    kpiDefinitions, bulkAddKpiDefinitions, updateKpiDefinition, deleteKpiDefinition, lockBaselines, unlockBaselines,
    kpiSubmissions, kpiDataPoints, employees,
  } = useData();

  const [view, setView] = useState('dashboard');
  const [selectedDept, setSelectedDept] = useState('');
  const [baselineDept, setBaselineDept] = useState('');
  const [baselineRows, setBaselineRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [customModal, setCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ metricName: '', pillar: 'S', unit: '', direction: 'higher_better' });
  const [addDeptModal, setAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const companyDefs = useMemo(() => kpiDefinitions.filter(d => d.companyId === companyId), [kpiDefinitions, companyId]);
  const companyEmployees = useMemo(() => employees.filter(e => e.companyId === companyId), [employees, companyId]);

  const departments = useMemo(() => {
    const depts = new Set(companyDefs.map(d => d.department));
    return Array.from(depts).sort();
  }, [companyDefs]);

  const templateDepts = Object.keys(KPI_TEMPLATES);

  const allDepts = useMemo(() => {
    const set = new Set([...templateDepts, ...departments]);
    return Array.from(set).sort();
  }, [templateDepts, departments]);

  const handleAddDept = () => {
    const name = newDeptName.trim();
    if (!name || allDepts.includes(name)) return;
    setAddDeptModal(false);
    setNewDeptName('');
    initBaselineForDept(name);
  };

  const handleDeleteDept = async (dept) => {
    const deptDefs = companyDefs.filter(d => d.department === dept);
    if (deptDefs.some(d => d.baselineLocked)) {
      showToast('Cannot delete — baselines are locked. Unlock first.');
      return;
    }
    if (!confirm(`Delete department "${dept}" and all its ${deptDefs.length} KPI metric(s)?`)) return;
    setSaving(true);
    for (const def of deptDefs) {
      await deleteKpiDefinition(def.id);
    }
    setSaving(false);
    if (baselineDept === dept) {
      setBaselineDept('');
      setBaselineRows([]);
    }
    showToast(`Department "${dept}" removed`);
  };

  // Get latest value for a definition
  const getLatestValue = (defId) => {
    const validatedSubs = kpiSubmissions.filter(s => s.companyId === companyId && s.status === 'validated');
    for (const sub of validatedSubs) {
      const dp = kpiDataPoints.find(p => p.submissionId === sub.id && p.definitionId === defId);
      if (dp) return dp.value;
    }
    return null;
  };

  // Dashboard metrics
  const dashboardData = useMemo(() => {
    const defs = selectedDept ? companyDefs.filter(d => d.department === selectedDept) : companyDefs;
    const pillars = { S: [], E: [], O: [] };

    defs.forEach(def => {
      const current = getLatestValue(def.id);
      const progress = calcProgress(def.baselineValue, current, def.targetValue, def.direction);
      pillars[def.pillar]?.push({ ...def, current, progress });
    });

    const allProgress = Object.values(pillars).flat().map(m => m.progress).filter(p => p != null);
    const overall = allProgress.length > 0 ? Math.round(allProgress.reduce((a, b) => a + b, 0) / allProgress.length) : null;

    const pillarAverages = {};
    Object.entries(pillars).forEach(([key, metrics]) => {
      const progs = metrics.map(m => m.progress).filter(p => p != null);
      pillarAverages[key] = progs.length > 0 ? Math.round(progs.reduce((a, b) => a + b, 0) / progs.length) : null;
    });

    return { pillars, overall, pillarAverages };
  }, [companyDefs, selectedDept, kpiSubmissions, kpiDataPoints]);

  // Baseline setup helpers
  const initBaselineForDept = (dept) => {
    const existing = companyDefs.filter(d => d.department === dept);
    if (existing.length > 0) {
      setBaselineRows(existing.map(d => ({
        id: d.id, metricName: d.metricName, pillar: d.pillar, unit: d.metricUnit,
        direction: d.direction, baselineValue: d.baselineValue ?? '', targetValue: d.targetValue ?? '',
        locked: d.baselineLocked, existing: true,
      })));
    } else {
      const template = KPI_TEMPLATES[dept] || [];
      setBaselineRows(template.map((t, i) => ({
        id: null, metricName: t.metricName, pillar: t.pillar, unit: t.unit,
        direction: t.direction, baselineValue: '', targetValue: '', locked: false, existing: false,
      })));
    }
    setBaselineDept(dept);
  };

  const handleSaveBaseline = async () => {
    if (!baselineDept) return;
    setSaving(true);

    const newRows = baselineRows.filter(r => !r.existing && r.metricName.trim());
    const existingRows = baselineRows.filter(r => r.existing);

    // Update existing
    for (const row of existingRows) {
      if (!row.locked) {
        await updateKpiDefinition(row.id, {
          metricName: row.metricName, pillar: row.pillar, metricUnit: row.unit,
          direction: row.direction, baselineValue: row.baselineValue === '' ? null : Number(row.baselineValue),
          targetValue: row.targetValue === '' ? null : Number(row.targetValue),
        });
      }
    }

    // Insert new
    if (newRows.length > 0) {
      const inserts = newRows.map((r, i) => ({
        id: `KD${Date.now()}${i}${Math.random().toString(36).slice(2, 4)}`,
        companyId, department: baselineDept, pillar: r.pillar, metricName: r.metricName,
        metricUnit: r.unit, direction: r.direction,
        baselineValue: r.baselineValue === '' ? null : Number(r.baselineValue),
        targetValue: r.targetValue === '' ? null : Number(r.targetValue),
        baselineLocked: false, sortOrder: existingRows.length + i,
      }));
      await bulkAddKpiDefinitions(inserts);
    }

    setSaving(false);
    showToast(`Baseline saved for ${baselineDept}`);
    initBaselineForDept(baselineDept);
  };

  const handleLockBaseline = async () => {
    setSaving(true);
    await lockBaselines(companyId, baselineDept);
    setSaving(false);
    showToast(`Baselines locked for ${baselineDept}`);
    initBaselineForDept(baselineDept);
  };

  const handleUnlockBaseline = async () => {
    setSaving(true);
    await unlockBaselines(companyId, baselineDept);
    setSaving(false);
    showToast(`Baselines unlocked for ${baselineDept}`);
    initBaselineForDept(baselineDept);
  };

  const addCustomMetric = () => {
    setBaselineRows(prev => [...prev, {
      id: null, metricName: customForm.metricName, pillar: customForm.pillar,
      unit: customForm.unit, direction: customForm.direction,
      baselineValue: '', targetValue: '', locked: false, existing: false,
    }]);
    setCustomModal(false);
    setCustomForm({ metricName: '', pillar: 'S', unit: '', direction: 'higher_better' });
  };

  const removeBaselineRow = (index) => {
    setBaselineRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateBaselineRow = (index, field, value) => {
    setBaselineRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const overallColor = getHealthColor(dashboardData.overall);
  const colorClasses = {
    green: { ring: 'border-green-500', text: 'text-green-600', bg: 'bg-green-50' },
    amber: { ring: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    red: { ring: 'border-red-500', text: 'text-red-600', bg: 'bg-red-50' },
    gray: { ring: 'border-gray-300', text: 'text-gray-500', bg: 'bg-gray-50' },
  };
  const oc = colorClasses[overallColor];

  return (
    <div>
      {toast && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.3s_ease]">
          <Check className="w-5 h-5" /><p className="text-sm font-medium">{toast}</p>
        </div>
      )}

      {/* ===== DASHBOARD VIEW ===== */}
      {view === 'dashboard' && (
        <div>
          {companyDefs.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No KPI Metrics Set Up</h3>
              <p className="text-sm text-gray-400 mb-4">Initialize baseline metrics for your departments to start tracking program impact.</p>
              <button onClick={() => setView('baseline')} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium">
                <Settings className="w-4 h-4 inline mr-1.5" /> Setup Baseline
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  {/* Overall health badge */}
                  <div className={`w-20 h-20 rounded-full border-4 ${oc.ring} flex flex-col items-center justify-center ${oc.bg}`}>
                    <span className={`text-xl font-bold ${oc.text}`}>{dashboardData.overall ?? '-'}%</span>
                    <span className={`text-xs ${oc.text}`}>{getHealthLabel(dashboardData.overall)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">KPI Health</h3>
                    <p className="text-sm text-gray-500">{companyDefs.length} metrics across {departments.length} departments</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button onClick={() => setView('baseline')} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                    <Settings className="w-4 h-4" /> Setup
                  </button>
                </div>
              </div>

              {/* 3 Pillar Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {['S', 'E', 'O'].map(pillarKey => {
                  const info = PILLAR_INFO[pillarKey];
                  const Icon = PILLAR_ICONS[pillarKey];
                  const metrics = dashboardData.pillars[pillarKey];
                  const avg = dashboardData.pillarAverages[pillarKey];
                  const avgColor = getHealthColor(avg);

                  return (
                    <div key={pillarKey} className="bg-white rounded-xl border overflow-hidden">
                      {/* Pillar header */}
                      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: info.bgColor }}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" style={{ color: info.color }} />
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{info.name} ({pillarKey})</h4>
                            <p className="text-xs text-gray-500">{info.description}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${colorClasses[avgColor].bg} ${colorClasses[avgColor].text}`}>
                          {avg ?? '-'}%
                        </span>
                      </div>

                      {/* Metrics list */}
                      <div className="p-5 space-y-4">
                        {metrics.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-2">No metrics defined</p>
                        ) : (
                          metrics.map(m => (
                            <KpiProgressBar
                              key={m.id}
                              baseline={m.baselineValue}
                              current={m.current}
                              target={m.targetValue}
                              direction={m.direction}
                              label={m.metricName}
                              unit={m.metricUnit}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Department comparison mini table */}
              {!selectedDept && departments.length > 1 && (
                <div className="bg-white rounded-xl border mt-5 overflow-hidden">
                  <div className="px-5 py-3 border-b"><h4 className="font-semibold text-gray-900 text-sm">Department Overview</h4></div>
                  <table className="w-full">
                    <thead><tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <th className="px-5 py-2.5 font-medium">Department</th>
                      <th className="px-5 py-2.5 font-medium">S (Scaling)</th>
                      <th className="px-5 py-2.5 font-medium">E (Experience)</th>
                      <th className="px-5 py-2.5 font-medium">O (Optimization)</th>
                      <th className="px-5 py-2.5 font-medium">Overall</th>
                    </tr></thead>
                    <tbody>{departments.map(dept => {
                      const deptDefs = companyDefs.filter(d => d.department === dept);
                      const pillarAvg = (pillar) => {
                        const pDefs = deptDefs.filter(d => d.pillar === pillar);
                        const progs = pDefs.map(d => calcProgress(d.baselineValue, getLatestValue(d.id), d.targetValue, d.direction)).filter(p => p != null);
                        return progs.length > 0 ? Math.round(progs.reduce((a, b) => a + b, 0) / progs.length) : null;
                      };
                      const allProgs = deptDefs.map(d => calcProgress(d.baselineValue, getLatestValue(d.id), d.targetValue, d.direction)).filter(p => p != null);
                      const overall = allProgs.length > 0 ? Math.round(allProgs.reduce((a, b) => a + b, 0) / allProgs.length) : null;

                      const ProgressCell = ({ value }) => {
                        const c = getHealthColor(value);
                        return (
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-12 h-2 ${colorClasses[c].bg} rounded-full overflow-hidden`}>
                                <div className={`h-full rounded-full ${c === 'green' ? 'bg-green-500' : c === 'amber' ? 'bg-amber-500' : c === 'red' ? 'bg-red-500' : 'bg-gray-300'}`} style={{ width: `${value ?? 0}%` }} />
                              </div>
                              <span className={`text-xs font-medium ${colorClasses[c].text}`}>{value ?? '-'}%</span>
                            </div>
                          </td>
                        );
                      };

                      return (
                        <tr key={dept} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDept(dept)}>
                          <td className="px-5 py-2.5 text-sm font-medium text-gray-900">{dept}</td>
                          <ProgressCell value={pillarAvg('S')} />
                          <ProgressCell value={pillarAvg('E')} />
                          <ProgressCell value={pillarAvg('O')} />
                          <ProgressCell value={overall} />
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== BASELINE SETUP VIEW ===== */}
      {view === 'baseline' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Baseline Setup</h3>
              <p className="text-sm text-gray-500">Define KPI metrics with baseline and target values per department</p>
            </div>
          </div>

          {/* Department selector */}
          <div className="flex gap-2 flex-wrap mb-5">
            {allDepts.map(d => {
              const hasData = companyDefs.some(def => def.department === d);
              const locked = companyDefs.some(def => def.department === d && def.baselineLocked);
              return (
                <div key={d} className="relative group">
                  <button onClick={() => initBaselineForDept(d)}
                    className={`px-3 py-2 rounded-lg text-sm border font-medium transition-colors ${
                      baselineDept === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                    }`}>
                    {d}
                    {locked && <Lock className="w-3 h-3 inline ml-1 opacity-60" />}
                    {hasData && !locked && <Check className="w-3 h-3 inline ml-1 text-green-500" />}
                  </button>
                  {hasData && !locked && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDept(d); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title={`Remove ${d}`}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <button onClick={() => setAddDeptModal(true)}
              className="px-3 py-2 rounded-lg text-sm border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Department
            </button>
          </div>

          {baselineDept ? (
            <div className="bg-white rounded-xl border">
              <div className="px-5 py-3 border-b flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{baselineDept} — KPI Metrics</h4>
                <div className="flex gap-2">
                  <button onClick={() => setCustomModal(true)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    <Plus className="w-3.5 h-3.5" /> Custom Metric
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <th className="px-4 py-2.5 font-medium w-8">#</th>
                    <th className="px-4 py-2.5 font-medium">Metric Name</th>
                    <th className="px-4 py-2.5 font-medium w-16">Pillar</th>
                    <th className="px-4 py-2.5 font-medium w-20">Unit</th>
                    <th className="px-4 py-2.5 font-medium w-24">Direction</th>
                    <th className="px-4 py-2.5 font-medium w-28">Baseline</th>
                    <th className="px-4 py-2.5 font-medium w-28">Target</th>
                    <th className="px-4 py-2.5 font-medium w-10"></th>
                  </tr></thead>
                  <tbody>
                    {baselineRows.map((row, i) => {
                      const pillarInfo = PILLAR_INFO[row.pillar];
                      return (
                        <tr key={i} className={`border-b last:border-0 ${row.locked ? 'bg-gray-50' : 'hover:bg-blue-50/30'}`}>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2.5">
                            {row.locked ? (
                              <span className="text-sm text-gray-700">{row.metricName}</span>
                            ) : (
                              <input value={row.metricName} onChange={e => updateBaselineRow(i, 'metricName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" />
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: pillarInfo?.bgColor, color: pillarInfo?.color }}>
                              {row.pillar}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{row.unit}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs ${row.direction === 'lower_better' ? 'text-amber-600' : 'text-blue-600'}`}>
                              {row.direction === 'lower_better' ? '↓ Lower' : '↑ Higher'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {row.locked ? (
                              <span className="text-sm font-medium text-gray-700">{row.baselineValue} <Lock className="w-3 h-3 inline text-gray-400" /></span>
                            ) : (
                              <input type="number" value={row.baselineValue} onChange={e => updateBaselineRow(i, 'baselineValue', e.target.value)}
                                placeholder="0" className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" />
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="number" value={row.targetValue} onChange={e => updateBaselineRow(i, 'targetValue', e.target.value)}
                              placeholder="0" className="w-full px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" disabled={row.locked} />
                          </td>
                          <td className="px-4 py-2.5">
                            {!row.locked && !row.existing && (
                              <button onClick={() => removeBaselineRow(i)} className="p-1 rounded hover:bg-red-50"><X className="w-3.5 h-3.5 text-red-400" /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-4 border-t flex items-center justify-between">
                <p className="text-xs text-gray-400">{baselineRows.filter(r => r.locked).length > 0 ? 'Some metrics are locked and cannot be edited.' : 'Set baseline and target values, then save.'}</p>
                <div className="flex gap-2">
                  {baselineRows.some(r => r.locked) && (
                    <button onClick={handleUnlockBaseline} disabled={saving} className="flex items-center gap-1.5 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                      <Unlock className="w-4 h-4" /> Release Lock
                    </button>
                  )}
                  {baselineRows.some(r => r.existing && !r.locked) && (
                    <button onClick={handleLockBaseline} disabled={saving} className="flex items-center gap-1.5 border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 disabled:opacity-50">
                      <Lock className="w-4 h-4" /> Lock Baselines
                    </button>
                  )}
                  <button onClick={handleSaveBaseline} disabled={saving} className="flex items-center gap-1.5 bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Baseline
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <Settings className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p>Select a department above to set up KPI baselines</p>
            </div>
          )}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal open={addDeptModal} onClose={() => setAddDeptModal(false)} title="Add Department">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="e.g., Finance, IT, Customer Support"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => { if (e.key === 'Enter') handleAddDept(); }}
              autoFocus />
            {newDeptName.trim() && allDepts.includes(newDeptName.trim()) && (
              <p className="text-xs text-red-500 mt-1">This department already exists</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button onClick={() => { setAddDeptModal(false); setNewDeptName(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
            <button onClick={handleAddDept} disabled={!newDeptName.trim() || allDepts.includes(newDeptName.trim())} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Add Department</button>
          </div>
        </div>
      </Modal>

      {/* Custom Metric Modal */}
      <Modal open={customModal} onClose={() => setCustomModal(false)} title="Add Custom Metric">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric Name</label>
            <input value={customForm.metricName} onChange={e => setCustomForm({ ...customForm, metricName: e.target.value })} placeholder="e.g., Response time to queries" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pillar</label>
              <select value={customForm.pillar} onChange={e => setCustomForm({ ...customForm, pillar: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="S">S (Scaling)</option>
                <option value="E">E (Experience)</option>
                <option value="O">O (Optimization)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input value={customForm.unit} onChange={e => setCustomForm({ ...customForm, unit: e.target.value })} placeholder="%, days, count" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select value={customForm.direction} onChange={e => setCustomForm({ ...customForm, direction: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="higher_better">↑ Higher is better</option>
                <option value="lower_better">↓ Lower is better</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button onClick={() => setCustomModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
            <button onClick={addCustomMetric} disabled={!customForm.metricName.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Add Metric</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
