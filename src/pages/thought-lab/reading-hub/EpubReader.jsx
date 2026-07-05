import { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { ChevronLeft, ChevronRight, Loader2, Lightbulb, Share2, X } from 'lucide-react';

export default function EpubReader({ url, onCaptureIdea, onAddPerspective }) {
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedText, setSelectedText] = useState('');

  const clearSelection = () => {
    setSelectedText('');
    renditionRef.current?.getContents().forEach(c => c.window.getSelection()?.removeAllRanges());
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSelectedText('');

    const book = ePub(url);
    const rendition = book.renderTo(viewerRef.current, { width: '100%', height: '100%', flow: 'paginated' });
    renditionRef.current = rendition;

    rendition.display()
      .then(() => { if (!cancelled) setLoading(false); })
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

    return () => {
      cancelled = true;
      document.removeEventListener('keydown', handleKey);
      book.destroy();
    };
  }, [url]);

  if (error) {
    return <p className="text-sm text-red-500 text-center py-24">{error}</p>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="relative flex-1 min-h-0 border border-[var(--rh-outline-variant)] rounded-xl overflow-hidden bg-white">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white text-[var(--rh-on-surface-variant)] z-10">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading book...
          </div>
        )}
        <div ref={viewerRef} className="w-full h-full" />
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
        <div className="flex items-center justify-center gap-4 mt-4 flex-shrink-0">
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
