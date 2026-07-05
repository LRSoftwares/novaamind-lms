import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, MapPinned, FlaskConical, Database, Compass, BookMarked,
  MonitorPlay, BarChart3, Settings, CircleUserRound, ArrowLeft,
} from 'lucide-react';

const navItems = [
  { to: '/thought-lab', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/thought-lab/capture', label: 'Capture', icon: MapPinned },
  { to: '/thought-lab/board', label: 'Thought Lab', icon: FlaskConical },
  { to: '/thought-lab/knowledge-base', label: 'Knowledge Base', icon: Database },
  { to: '/thought-lab/framework-library', label: 'Framework Library', icon: Compass },
  { to: '/thought-lab/story-bank', label: 'Story Bank', icon: BookMarked },
  { to: '/thought-lab/content-studio', label: 'Content Studio', icon: MonitorPlay },
  { to: '/thought-lab/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function IOSSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[var(--color-ios-surface)] border-r border-[var(--color-ios-border)]">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-ios-primary)] flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight text-[var(--color-ios-primary)] truncate">NovaaMind</p>
            <p className="text-[11px] font-medium tracking-wider text-[var(--color-ios-text-muted)] uppercase truncate">Intellectual OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--color-ios-primary)]/10 text-[var(--color-ios-primary)] font-semibold'
                  : 'text-[var(--color-ios-text)] hover:bg-[var(--color-ios-surface-alt)]'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-[var(--color-ios-border)] space-y-0.5">
        <NavLink
          to="/integrations"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--color-ios-text)] hover:bg-[var(--color-ios-surface-alt)] transition-colors"
        >
          <Settings className="w-4.5 h-4.5 flex-shrink-0" /> Settings
        </NavLink>
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--color-ios-text)] hover:bg-[var(--color-ios-surface-alt)] transition-colors"
        >
          <CircleUserRound className="w-4.5 h-4.5 flex-shrink-0" /> Profile
        </NavLink>
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--color-ios-text-muted)] hover:bg-[var(--color-ios-surface-alt)] transition-colors mt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" /> Back to LMS
        </NavLink>
      </div>
    </aside>
  );
}
