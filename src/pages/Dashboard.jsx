import { useMemo } from 'react';
import { Users, BookOpen, CalendarDays, GraduationCap, AlertTriangle, CheckCircle2, Rocket, ArrowRight, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../context/DataContext';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { employees, programs, sessions, enrolments, companies, trainers, loading, dbStatus } = useData();

  const SETUP_STEPS = useMemo(() => [
    { step: 1, title: 'Register Company', desc: 'Add your companies with details & location', path: '/companies', check: () => companies.length > 0 },
    { step: 2, title: 'Import Employees', desc: 'Add employees under a company', path: '/companies', check: () => employees.length > 0 },
    { step: 3, title: 'Add Trainers', desc: 'Add internal/external trainers with expertise areas', path: '/trainers', check: () => trainers.length > 0 },
    { step: 4, title: 'Create Programs', desc: 'Define training programs with outcomes, pass scores & files', path: '/programs', check: () => programs.length > 0 },
    { step: 5, title: 'Schedule Sessions', desc: 'Create sessions on the calendar, assign trainers', path: '/sessions', check: () => sessions.length > 0 },
    { step: 6, title: 'Enrol Employees', desc: 'Enrol employees from within each company', path: '/companies', check: () => enrolments.length > 0 },
  ], [companies, employees, trainers, programs, sessions, enrolments]);

  const isEmpty = employees.length === 0 && programs.length === 0;
  const setupProgress = SETUP_STEPS.filter(s => s.check()).length;

  const stats = useMemo(() => {
    const completed = enrolments.filter(e => e.status === 'Completed').length;
    const overdue = enrolments.filter(e => e.status === 'Overdue').length;
    const inProgress = enrolments.filter(e => e.status === 'In Progress').length;
    const notStarted = enrolments.filter(e => e.status === 'Not Started').length;
    const upcomingSessions = sessions.filter(s => s.status === 'Scheduled').length;
    const scored = enrolments.filter(e => e.avgScore > 0);
    const avgScore = scored.length > 0 ? Math.round(scored.reduce((sum, e) => sum + e.avgScore, 0) / scored.length) : 0;
    const completionRate = enrolments.length > 0 ? Math.round((completed / enrolments.length) * 100) : 0;

    return { completed, overdue, inProgress, notStarted, upcomingSessions, avgScore, completionRate };
  }, [enrolments, sessions]);

  const deptData = useMemo(() => {
    const depts = {};
    employees.forEach(emp => {
      if (!depts[emp.department]) depts[emp.department] = { name: emp.department, total: 0, enrolled: 0, completed: 0 };
      depts[emp.department].total++;
    });
    enrolments.forEach(enr => {
      const emp = employees.find(e => e.id === enr.empId);
      if (emp && depts[emp.department]) {
        depts[emp.department].enrolled++;
        if (enr.status === 'Completed') depts[emp.department].completed++;
      }
    });
    return Object.values(depts);
  }, [employees, enrolments]);

  const statusData = useMemo(() => [
    { name: 'Completed', value: stats.completed },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Not Started', value: stats.notStarted },
    { name: 'Overdue', value: stats.overdue },
  ].filter(d => d.value > 0), [stats]);

  const programProgress = useMemo(() => {
    return programs.map(prog => {
      const progEnrolments = enrolments.filter(e => e.programId === prog.id);
      const completed = progEnrolments.filter(e => e.status === 'Completed').length;
      return {
        name: prog.shortCode || prog.name.substring(0, 15),
        enrolled: progEnrolments.length,
        completed,
        rate: progEnrolments.length > 0 ? Math.round((completed / progEnrolments.length) * 100) : 0,
      };
    });
  }, [programs, enrolments]);

  const overdueList = useMemo(() => {
    return enrolments.filter(e => e.status === 'Overdue').map(enr => {
      const emp = employees.find(e => e.id === enr.empId);
      const prog = programs.find(p => p.id === enr.programId);
      return { ...enr, empName: emp?.name || 'Unknown', progName: prog?.name || 'Unknown', department: emp?.department || '' };
    });
  }, [enrolments, employees, programs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {companies.length > 0 ? `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} · ` : ''}Organization training overview
          </p>
        </div>
      </div>

      {/* DB Connection Status */}
      {dbStatus && dbStatus !== 'connected' && dbStatus !== 'connecting' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-red-800">Supabase Connection Issue</p>
          <p className="text-xs text-red-600 mt-1">{dbStatus}</p>
          <p className="text-xs text-gray-500 mt-2">Check: 1) Your .env file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY  2) Open browser DevTools (F12) → Console for detailed errors</p>
        </div>
      )}

      {/* Setup Guide */}
      {setupProgress < 6 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                {isEmpty ? 'Get Started - Set Up Your LMS' : `Setup Progress: ${setupProgress}/6 complete`}
              </h3>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{Math.round((setupProgress / 6) * 100)}%</span>
          </div>

          <div className="w-full h-2 bg-blue-100 rounded-full mb-4">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(setupProgress / 6) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {SETUP_STEPS.map(s => {
              const done = s.check();
              return (
                <button
                  key={s.step}
                  onClick={() => navigate(s.path)}
                  className={`text-left p-3 rounded-lg border transition-all ${done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? '✓' : s.step}
                    </span>
                    <span className={`text-sm font-medium ${done ? 'text-green-700' : 'text-gray-900'}`}>{s.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">{s.desc}</p>
                  {!done && <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1.5 ml-7"><ArrowRight className="w-3 h-3" /> Go to {s.title.toLowerCase()}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total Employees" value={employees.length} icon={Users} color="blue" subtitle={employees.length === 0 ? 'Import CSV to start' : undefined} />
        <StatCard title="Active Programs" value={programs.filter(p => p.status === 'Active').length} icon={BookOpen} color="purple" />
        <StatCard title="Upcoming Sessions" value={stats.upcomingSessions} icon={CalendarDays} color="indigo" />
        <StatCard title="Completion Rate" value={enrolments.length > 0 ? `${stats.completionRate}%` : '-'} icon={CheckCircle2} color="green" />
        <StatCard title="Avg Score" value={stats.avgScore > 0 ? `${stats.avgScore}%` : '-'} icon={GraduationCap} color="amber" />
        <StatCard title="Overdue" value={stats.overdue} icon={AlertTriangle} color="red" />
      </div>

      {/* Charts - only show when there's actual data */}
      {enrolments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Department Training Overview</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#e2e8f0" name="Total Employees" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Enrolment Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Program Completion Rates</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={programProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Bar dataKey="rate" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Overdue Alerts</h3>
              {overdueList.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  <CheckCircle2 className="w-6 h-6 mr-2" /> No overdue enrolments
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-auto">
                  {overdueList.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.empName}</p>
                        <p className="text-xs text-gray-500">{item.progName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Overdue</span>
                        <p className="text-xs text-gray-400 mt-1">{item.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Charts will appear once you have data</h3>
          <p className="text-sm text-gray-400">Follow the setup steps above to populate your LMS with real data.<br/>All dashboard numbers, charts, and reports compute automatically from what you enter.</p>
        </div>
      )}
    </div>
  );
}
