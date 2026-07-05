import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Sparkles, Bookmark, Plus, MoreHorizontal, Archive, Trash2, ArrowLeft } from 'lucide-react';

const navItems = [
  { to: '/reading-hub/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/reading-hub', label: 'Library', icon: BookOpen, end: true },
  { to: '/reading-hub/thoughts', label: 'Thoughts', icon: Sparkles },
  { to: '/reading-hub/collections', label: 'Collections', icon: Bookmark },
];

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-high)] transition-colors"
      >
        <MoreHorizontal className="w-4.5 h-4.5 flex-shrink-0" /> More
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-[var(--rh-surface-container-lowest)] border border-[var(--rh-outline-variant)] rounded-xl shadow-lg py-1.5 z-20">
          <NavLink
            to="/reading-hub/archive"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--rh-on-surface)] hover:bg-[var(--rh-surface-container-low)] transition-colors"
          >
            <Archive className="w-4 h-4" /> Archive
          </NavLink>
          <NavLink
            to="/reading-hub/trash"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--rh-on-surface)] hover:bg-[var(--rh-surface-container-low)] transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Trash
          </NavLink>
        </div>
      )}
    </div>
  );
}

export default function ReadingHubSidebar({ onAddBook }) {
  return (
    <aside className="w-[260px] flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[var(--rh-surface)] border-r border-[var(--rh-outline-variant)]">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--rh-primary)] flex items-center justify-center text-[var(--rh-on-primary)] flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-[var(--rh-primary)] leading-tight truncate">Reading Hub</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--rh-on-surface-variant)] truncate">Personal Library</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'text-[var(--rh-primary)] bg-[var(--rh-secondary-container)]/30 border-l-4 border-[var(--rh-primary)] font-bold'
                    : 'text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-high)]'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-10">
          <button
            onClick={onAddBook}
            className="w-full py-3 bg-[var(--rh-primary)] text-[var(--rh-on-primary)] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add to Library
          </button>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-[var(--rh-outline-variant)] space-y-1">
        <MoreMenu />
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-high)] transition-colors mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" /> Back to LMS
        </NavLink>
      </div>
    </aside>
  );
}
