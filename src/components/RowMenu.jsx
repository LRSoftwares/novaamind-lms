import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export default function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { setOpen(false); item.onClick(); }}
              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 ${item.danger ? 'text-red-600' : 'text-gray-700'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
