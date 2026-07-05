import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Bell, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function IOSTopBar({ search, onSearchChange, searchPlaceholder = 'Search Thought Lab...', children }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const initial = (profile?.fullName || profile?.full_name || 'R').charAt(0).toUpperCase();

  return (
    <header className="flex items-center gap-4 px-6 py-3.5 border-b border-[var(--color-ios-border)] bg-[var(--color-ios-surface)] sticky top-0 z-30">
      <div className="relative w-72 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ios-text-muted)]" />
        <input
          value={search ?? ''}
          onChange={e => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--color-ios-surface-alt)] border border-transparent focus:border-[var(--color-ios-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ios-primary)]/20 placeholder:text-[var(--color-ios-text-muted)]"
        />
      </div>

      <div className="flex-1 flex items-center gap-5 text-sm font-medium text-[var(--color-ios-text-muted)] min-w-0">
        {children}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="p-2 rounded-lg hover:bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)]" title="AI Context Engine">
          <Sparkles className="w-4.5 h-4.5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-[var(--color-ios-surface-alt)] text-[var(--color-ios-text-muted)]" title="Notifications">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={() => navigate('/thought-lab/capture')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Capture
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--color-ios-primary)]/10 text-[var(--color-ios-primary)] flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {initial}
        </div>
      </div>
    </header>
  );
}
