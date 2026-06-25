import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarDays, Building2, GraduationCap, BarChart3, LogOut, Menu, ChevronLeft, Plug, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/programs', icon: BookOpen, label: 'Programs' },
  { path: '/sessions', icon: CalendarDays, label: 'Sessions' },
  { path: '/companies', icon: Building2, label: 'Companies' },
  { path: '/trainers', icon: GraduationCap, label: 'Trainers' },
  { path: '/assessments', icon: ClipboardCheck, label: 'Assessments' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/integrations', icon: Plug, label: 'Integrations' },
];

export default function Sidebar({ open, onToggle }) {
  const { signOut, profile } = useAuth();

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-sidebar text-white transition-all duration-300 z-50 flex flex-col ${open ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {open && (
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-400" />
            <span className="font-bold text-lg">Novaamind LMS</span>
          </div>
        )}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors">
          {open ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {open && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        {open && profile && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-gray-400 truncate">{profile.fullName || profile.full_name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{profile.role}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-600/20 hover:text-red-300 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
