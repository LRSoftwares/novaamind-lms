import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useData } from '../context/DataContext';
import Papa from 'papaparse';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const { employees, programs, sessions, enrolments, trainers } = useData();

  const completionByProgram = useMemo(() =>
    programs.map(prog => {
      const progEnr = enrolments.filter(e => e.programId === prog.id);
      const completed = progEnr.filter(e => e.status === 'Completed').length;
      const overdue = progEnr.filter(e => e.status === 'Overdue').length;
      const inProgress = progEnr.filter(e => e.status === 'In Progress').length;
      return {
        name: prog.shortCode || prog.name.substring(0, 12),
        completed,
        inProgress,
        overdue,
        total: progEnr.length,
        rate: progEnr.length > 0 ? Math.round((completed / progEnr.length) * 100) : 0,
      };
    }), [programs, enrolments]);

  const deptCompliance = useMemo(() => {
    const depts = {};
    employees.forEach(emp => {
      if (!depts[emp.department]) depts[emp.department] = { name: emp.department, total: 0, enrolled: 0, completed: 0, overdue: 0, avgScore: 0, scores: [] };
      depts[emp.department].total++;
    });
    enrolments.forEach(enr => {
      const emp = employees.find(e => e.id === enr.empId);
      if (emp && depts[emp.department]) {
        depts[emp.department].enrolled++;
        if (enr.status === 'Completed') depts[emp.department].completed++;
        if (enr.status === 'Overdue') depts[emp.department].overdue++;
        if (enr.avgScore > 0) depts[emp.department].scores.push(enr.avgScore);
      }
    });
    return Object.values(depts).map(d => ({
      ...d,
      avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
      completionRate: d.enrolled > 0 ? Math.round((d.completed / d.enrolled) * 100) : 0,
    }));
  }, [employees, enrolments]);

  const trainerUtil = useMemo(() =>
    trainers.map(t => {
      const assigned = sessions.filter(s => s.trainerId === t.id).length;
      return {
        name: t.name.split(' ').slice(-1)[0],
        assigned,
        max: t.maxSessionsPerMonth,
        utilization: t.maxSessionsPerMonth > 0 ? Math.round((assigned / t.maxSessionsPerMonth) * 100) : 0,
      };
    }), [trainers, sessions]);

  const kpis = useMemo(() => {
    const total = enrolments.length;
    const completed = enrolments.filter(e => e.status === 'Completed').length;
    const overdue = enrolments.filter(e => e.status === 'Overdue').length;
    const scored = enrolments.filter(e => e.avgScore > 0);
    const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, e) => s + e.avgScore, 0) / scored.length) : 0;
    const passCount = scored.filter(e => {
      const prog = programs.find(p => p.id === e.programId);
      return e.avgScore >= (prog?.passScoreThreshold || 70);
    }).length;

    return {
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      overdueRate: total > 0 ? Math.round((overdue / total) * 100) : 0,
      avgScore,
      passRate: scored.length > 0 ? Math.round((passCount / scored.length) * 100) : 0,
    };
  }, [enrolments, programs]);

  const exportCompletionReport = () => {
    const rows = enrolments.map(enr => {
      const emp = employees.find(e => e.id === enr.empId);
      const prog = programs.find(p => p.id === enr.programId);
      return {
        'Employee ID': enr.empId,
        'Employee Name': emp?.name || '',
        'Department': emp?.department || '',
        'Program': prog?.name || '',
        'Status': enr.status,
        'Sessions Attended': enr.sessionsAttended,
        'Avg Score': enr.avgScore,
        'Enrol Date': enr.enrolDate,
      };
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'completion_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Organization-wide training metrics</p>
        </div>
        <button onClick={exportCompletionReport} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{kpis.completionRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Completion Rate</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{kpis.passRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Pass Rate</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{kpis.avgScore}%</p>
          <p className="text-sm text-gray-500 mt-1">Avg Score</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{kpis.overdueRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Overdue Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Program Completion Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={completionByProgram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="overdue" fill="#ef4444" name="Overdue" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Department Compliance</h3>
          <div className="space-y-3">
            {deptCompliance.map(dept => (
              <div key={dept.name} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">{dept.name}</span>
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${dept.completionRate}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">{dept.completionRate}%</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-20 text-right">Avg: {dept.avgScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Trainer Utilization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trainerUtil} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val, name) => name === 'utilization' ? `${val}%` : val} />
              <Bar dataKey="assigned" fill="#8b5cf6" name="Sessions Assigned" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Enrolment Summary</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b">
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Employees</th>
                  <th className="pb-2 font-medium">Enrolled</th>
                  <th className="pb-2 font-medium">Completed</th>
                  <th className="pb-2 font-medium">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {deptCompliance.map(d => (
                  <tr key={d.name} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{d.name}</td>
                    <td className="py-2 text-gray-600">{d.total}</td>
                    <td className="py-2 text-gray-600">{d.enrolled}</td>
                    <td className="py-2 text-green-600">{d.completed}</td>
                    <td className="py-2 text-red-500">{d.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
