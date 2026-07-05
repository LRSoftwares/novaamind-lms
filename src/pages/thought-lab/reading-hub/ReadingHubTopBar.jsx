import { Search, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function ReadingHubTopBar({ search, onSearchChange, showSearch = true, placeholder = 'Search books, reports, research and sources...' }) {
  const { profile } = useAuth();
  const initial = (profile?.fullName || profile?.full_name || 'R').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--rh-surface)]/80 backdrop-blur-md border-b border-[var(--rh-outline-variant)] flex items-center justify-between px-8">
      {showSearch ? (
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rh-on-surface-variant)]" />
          <input
            value={search ?? ''}
            onChange={e => onSearchChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[var(--rh-surface-container-low)] border border-[var(--rh-outline-variant)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rh-primary)]/20 focus:border-[var(--rh-primary)] transition-all"
          />
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-4 flex-shrink-0">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] transition-colors">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] transition-colors">
          <Settings className="w-4.5 h-4.5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--rh-primary)]/10 text-[var(--rh-primary)] flex items-center justify-center text-sm font-semibold flex-shrink-0 border border-[var(--rh-outline-variant)]">
          {initial}
        </div>
      </div>
    </header>
  );
}
