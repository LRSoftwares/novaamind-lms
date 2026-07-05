import { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { ChevronLeft, ChevronRight, Loader2, Lightbulb, Share2, X, List, PanelLeftClose } from 'lucide-react';

const SAVE_DEBOUNCE_MS = 1500;
const HEARTBEAT_MS = 25000;

function stripHash(href) {
  return href ? href.split('#')[0] : href;
}

function TocList({ items, activeHref, onSelect, depth = 0 }) {
  return (
    <ul className={depth === 0 ? 'space-y-0.5' : 'space-y-0.5 mt-0.5'}>
      {items.map(item => {
        const isActive = stripHash(item.href) === activeHref;
        return (
          <li key={item.id || item.href}>
            <button
              onClick={() => onSelect(item.href)}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
              className={`w-full text-left text-xs py-1.5 pr-3 rounded-lg transition-colors line-clamp-2 ${
                isActive
                  ? 'bg-[var(--rh-primary)]/10 text-[var(--rh-primary)] font-semibold'
                  : 'text-[var(--rh-on-surface-variant)] hover:bg-[var(--rh-surface-container-low)] hover:text-[var(--rh-on-surface)]'
              }`}
            >
              {item.label?.trim() || 'Untitled'}
            </button>
            {item.subitems?.length > 0 && (
              <TocList items={item.subitems} activeHref={activeHref} onSelect={onSelect} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function EpubReader({ url, initialCfi, onPositionChange, onOpen, onCaptureIdea, onAddPerspective }) {
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [toc, setToc] = useState([]);
  const [tocOpen, setTocOpen] = useState(true);
  const [activeHref, setActiveHref] = useState('');

  const clearSelection = () => {
    setSelectedText('');
    renditionRef.current?.getContents().forEach(c => c.window.getSelection()?.removeAllRanges());
  };

  const handleTocSelect = (href) => {
    renditionRef.current?.display(href);
  };

  // Refs so the effect below can stay scoped to [url] — these callbacks are
  // recreated every parent render, and putting them in the dependency array
  // would tear down and rebuild the whole book/rendition on every position save.
  const onPositionChangeRef = useRef(onPositionChange);
  const onOpenRef = useRef(onOpen);
  useEffect(() => { onPositionChangeRef.current = onPositionChange; }, [onPositionChange]);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);

  useEffect(() => {
    let cancelled = false;
    let saveTimer = null;
    let heartbeatTimer = null;
    setLoading(true);
    setError('');
    setSelectedText('');
    setToc([]);
    setActiveHref('');

    onOpenRef.current?.();

    const book = ePub(url);
    bookRef.current = book;
    const rendition = book.renderTo(viewerRef.current, { width: '100%', height: '100%', flow: 'paginated' });
    renditionRef.current = rendition;

    book.ready
      .then(() => { if (!cancelled) setToc(book.navigation?.toc || []); })
      .catch(err => console.error('[ReadingHub] EPUB navigation error:', err));

    // Chapter position, derived straight from the CFI's own encoded spine index —
    // synchronous and reliable, unlike epub.js's char-count `locations` system
    // (locations.generate()/locationFromCfi proved unreliable: total counts varied
    // between sessions and the computed position stayed stuck near the start
    // regardless of how deep into the book the CFI actually was).
    const positionDataFor = (cfi) => {
      let location = null, totalLocations = null, percentage = null;
      const totalSpineItems = book.spine?.spineItems?.length;
      const section = totalSpineItems ? book.spine.get(cfi) : null;
      if (section && totalSpineItems) {
        location = section.index + 1;
        totalLocations = totalSpineItems;
        percentage = (section.index + 1) / totalSpineItems;
      }
      return { cfi, location, totalLocations, percentage };
    };

    const updateActiveHref = (cfi) => {
      const section = book.spine?.get?.(cfi);
      if (section && !cancelled) setActiveHref(stripHash(section.href));
    };

    const savePosition = (cfi) => {
      if (!cfi) return;
      onPositionChangeRef.current?.(positionDataFor(cfi));
    };

    // rendition.currentLocation() throws if called before display() has resolved
    // (no manager attached yet) — e.g. the user navigates away while the book is
    // still loading, or React StrictMode's dev-only double-invoke of this effect.
    const safeCurrentLocation = () => {
      try {
        return rendition.currentLocation();
      } catch {
        return null;
      }
    };

    const scheduleSave = (cfi) => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => savePosition(cfi), SAVE_DEBOUNCE_MS);
    };

    rendition.on('relocated', (location) => {
      updateActiveHref(location.start.cfi);
      scheduleSave(location.start.cfi);
    });

    rendition.display(initialCfi || undefined)
      .then(() => {
        if (cancelled) return;
        setLoading(false);
        const current = safeCurrentLocation();
        if (current?.start?.cfi) {
          updateActiveHref(current.start.cfi);
          savePosition(current.start.cfi);
        }
      })
      .catch(err => {
        console.error('[ReadingHub] EPUB render error:', err);
        if (!cancelled) { setError("Couldn't open this EPUB."); setLoading(false); }
      });

    const handleSelected = (cfiRange, contents) => {
      const text = contents.window.getSelection()?.toString().trim();
      if (text) setSelectedText(text);
    };
    rendition.on('selected', handleSelected);

    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') rendition.prev();
      if (e.key === 'ArrowRight') rendition.next();
    };
    document.addEventListener('keydown', handleKey);

    const handleVisibility = () => {
      if (document.hidden) {
        const current = safeCurrentLocation();
        if (current?.start?.cfi) savePosition(current.start.cfi);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    heartbeatTimer = setInterval(() => {
      if (!document.hidden) {
        const current = safeCurrentLocation();
        if (current?.start?.cfi) savePosition(current.start.cfi);
      }
    }, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      if (saveTimer) clearTimeout(saveTimer);
      clearInterval(heartbeatTimer);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('visibilitychange', handleVisibility);
      const current = safeCurrentLocation();
      if (current?.start?.cfi) savePosition(current.start.cfi);
      try { book.destroy(); } catch { /* already torn down */ }
    };
    // initialCfi is only read once, at the moment this effect starts — intentionally
    // excluded so the reader doesn't remount when it changes mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (error) {
    return <p className="text-sm text-red-500 text-center py-24">{error}</p>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="relative flex-1 min-h-0 flex gap-3">
        {tocOpen && (
          <div className="w-56 flex-shrink-0 border border-[var(--rh-outline-variant)] rounded-xl overflow-y-auto bg-[var(--rh-surface-container-lowest)] p-2">
            {toc.length === 0 ? (
              <p className="text-xs text-[var(--rh-on-surface-variant)] p-2">
                {loading ? 'Loading contents...' : 'No table of contents in this book.'}
              </p>
            ) : (
              <TocList items={toc} activeHref={activeHref} onSelect={handleTocSelect} />
            )}
          </div>
        )}

        <div className="relative flex-1 min-h-0 border border-[var(--rh-outline-variant)] rounded-xl overflow-hidden bg-white">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white text-[var(--rh-on-surface-variant)] z-10">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading book...
            </div>
          )}
          <div ref={viewerRef} className="w-full h-full" />
        </div>
      </div>

      {selectedText && (
        <div className="mt-3 flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border border-[var(--rh-outline-variant)] bg-[var(--rh-surface-container-low)]">
          <p className="flex-1 text-xs text-[var(--rh-on-surface-variant)] italic line-clamp-2 min-w-0">"{selectedText}"</p>
          <button
            onClick={() => { onCaptureIdea?.(selectedText); clearSelection(); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--rh-primary)] text-[var(--rh-on-primary)] hover:brightness-110 transition-all flex-shrink-0"
          >
            <Lightbulb className="w-3.5 h-3.5" /> Capture Idea
          </button>
          <button
            onClick={() => { onAddPerspective?.(selectedText); clearSelection(); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface)] hover:bg-white transition-colors flex-shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" /> Add Perspective
          </button>
          <button onClick={clearSelection} className="text-[var(--rh-on-surface-variant)] hover:text-red-500 flex-shrink-0" title="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!loading && (
        <div className="flex items-center justify-center gap-4 mt-4 flex-shrink-0 relative">
          <button
            onClick={() => setTocOpen(o => !o)}
            title={tocOpen ? 'Hide contents' : 'Show contents'}
            className="absolute left-0 p-2 rounded-lg border border-[var(--rh-outline-variant)] hover:bg-[var(--rh-surface-container-low)] text-[var(--rh-on-surface)]"
          >
            {tocOpen ? <PanelLeftClose className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
          <button
            onClick={() => renditionRef.current?.prev()}
            className="p-2 rounded-lg border border-[var(--rh-outline-variant)] hover:bg-[var(--rh-surface-container-low)] text-[var(--rh-on-surface)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => renditionRef.current?.next()}
            className="p-2 rounded-lg border border-[var(--rh-outline-variant)] hover:bg-[var(--rh-surface-container-low)] text-[var(--rh-on-surface)]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
