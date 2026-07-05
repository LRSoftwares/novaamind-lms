import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function ReadPane({ title, children }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => { if (e.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [expanded]);

  // Readers like epub.js only re-paginate on a real window "resize" event, not on
  // container-size changes — nudge them after the layout settles into its new size.
  useEffect(() => {
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return () => cancelAnimationFrame(raf);
  }, [expanded]);

  return (
    <div className={expanded ? 'fixed inset-0 z-[200] bg-[var(--rh-background)] flex flex-col p-6' : ''}>
      <div className={`flex items-center gap-3 ${expanded ? 'justify-between mb-4' : 'justify-end mb-2'}`}>
        {expanded && <p className="text-sm font-semibold text-[var(--rh-on-surface)] truncate">{title}</p>}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] hover:text-[var(--rh-primary)] transition-colors flex-shrink-0"
        >
          {expanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" /> Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" /> Expand
            </>
          )}
        </button>
      </div>
      <div className={expanded ? 'flex-1 min-h-0' : 'h-[75vh]'}>{children}</div>
    </div>
  );
}
