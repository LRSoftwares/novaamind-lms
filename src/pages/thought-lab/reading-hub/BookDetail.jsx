import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Play, PlusCircle, Share2, Info, Brain, Wand2, Lightbulb, Plus, Trash2, BookOpen, Pencil, FileSpreadsheet } from 'lucide-react';
import BookCover from './BookCover';
import EpubReader from './EpubReader';
import ReadPane from './ReadPane';
import CaptureThoughtModal from './CaptureThoughtModal';
import { useData } from '../../../context/DataContext';
import { exportBookContentIdeasToExcel } from '../../../utils/exportBookExcel';

const TABS = ['Overview', 'Read', 'Ideas', 'Highlights', 'Perspectives', 'Content'];

function IdeaCard({ thought, onEdit, onDelete }) {
  return (
    <div className="p-6 rounded-[24px] border border-[var(--rh-outline-variant)] bg-white/80 backdrop-blur hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <Lightbulb className="w-5 h-5 text-[var(--rh-primary)]" fill="currentColor" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--rh-on-surface-variant)]">{thought.sourceChapter}</span>
          <button onClick={onEdit} className="text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] transition-colors" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="text-[var(--rh-on-surface-variant)] hover:text-red-500 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold text-[var(--rh-on-surface)] mb-2 line-clamp-2">{thought.title}</p>
      {thought.originalHighlight && <p className="text-xs text-[var(--rh-on-surface-variant)] italic mb-4">"{thought.originalHighlight}"</p>}
      <div className="flex gap-2 flex-wrap">
        {(thought.tags || []).map(tag => (
          <span key={tag} className="text-[10px] bg-[var(--rh-surface-container-high)] px-2 py-0.5 rounded text-[var(--rh-on-surface-variant)]">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function PerspectiveCard({ thought, onEdit, onDelete }) {
  return (
    <div className="p-6 rounded-[24px] border border-[var(--rh-outline-variant)] bg-white/80 backdrop-blur hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <Share2 className="w-5 h-5 text-[var(--rh-primary)]" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--rh-on-surface-variant)]">{formatDistanceToNow(new Date(thought.createdAt), { addSuffix: true })}</span>
          <button onClick={onEdit} className="text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] transition-colors" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="text-[var(--rh-on-surface-variant)] hover:text-red-500 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-[var(--rh-on-surface)] leading-relaxed whitespace-pre-wrap">{thought.myPerspective || thought.contentText}</p>
    </div>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { readingHubItems, thoughts, deleteThought, updateReadingHubItem } = useData();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'Overview');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureSubtype, setCaptureSubtype] = useState('idea');
  const [captureContent, setCaptureContent] = useState('');
  const [editingThought, setEditingThought] = useState(null);
  const [exporting, setExporting] = useState(false);
  const item = readingHubItems.find(i => i.id === id);

  const bookThoughts = useMemo(() => thoughts.filter(t => t.sourceId === item?.id), [thoughts, item?.id]);
  const topIdeas = useMemo(() => bookThoughts.filter(t => t.thoughtSubtype === 'idea'), [bookThoughts]);
  const perspectives = useMemo(() => bookThoughts.filter(t => t.thoughtSubtype === 'perspective'), [bookThoughts]);

  if (!item || item.kind !== 'book') {
    return (
      <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto text-center py-24">
        <p className="text-[var(--rh-on-surface-variant)]">Book not found.</p>
        <button onClick={() => navigate('/reading-hub')} className="mt-4 text-[var(--rh-primary)] font-semibold hover:underline">
          Back to Library
        </button>
      </div>
    );
  }

  const hasSummary = item.summaryCoreTheme || item.summaryKeyTakeaway || item.summaryApplication;

  const openCapture = (subtype, prefillContent = '') => {
    setEditingThought(null);
    setCaptureSubtype(subtype);
    setCaptureContent(prefillContent);
    setCaptureOpen(true);
  };

  const openEditCapture = (thought) => {
    setEditingThought(thought);
    setCaptureOpen(true);
  };

  const handleDeleteThought = (thought) => {
    if (window.confirm('Delete this thought?')) deleteThought(thought.id);
  };

  const handleOpen = () => updateReadingHubItem(item.id, { lastOpenedAt: new Date().toISOString() });

  const handleExport = () => {
    if (bookThoughts.length === 0 || exporting) return;
    setExporting(true);
    exportBookContentIdeasToExcel(item, bookThoughts).finally(() => setExporting(false));
  };

  const handlePositionChange = ({ cfi, location: readingLocation, totalLocations, percentage }) => {
    const updates = { readingCfi: cfi, lastSavedAt: new Date().toISOString() };
    if (readingLocation != null) updates.readingLocation = readingLocation;
    if (totalLocations != null) updates.totalLocations = totalLocations;
    if (percentage != null) updates.progress = Math.round(percentage * 100);
    if (item.status === 'want-to-read') updates.status = 'currently-reading';
    updateReadingHubItem(item.id, updates);
  };

  const captureSource = {
    sourceId: item.id,
    sourceType: 'book',
    sourceTitle: item.title,
    sourceAuthor: item.author,
  };

  return (
    <div className="pt-8 pb-12 px-8 max-w-[1440px] mx-auto">
      <button
        onClick={() => navigate('/reading-hub')}
        className="flex items-center gap-2 text-sm text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-3">
          <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden shadow-2xl border border-[var(--rh-outline-variant)]">
            <BookCover title={item.title} author={item.author} palette={[item.coverStart, item.coverEnd]} imageUrl={item.coverImageUrl} />
          </div>
          {item.progress != null && (
            <div className="mt-6 bg-[var(--rh-surface-container-low)] p-4 rounded-xl border border-[var(--rh-outline-variant)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--rh-on-surface-variant)]">Reading Progress</span>
                <span className="text-xs font-bold text-[var(--rh-primary)]">{item.progress}%</span>
              </div>
              <div className="w-full bg-[var(--rh-surface-container-highest)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--rh-primary)] h-full" style={{ width: `${item.progress}%` }} />
              </div>
              {item.readingLocation != null && item.totalLocations != null && (
                <p className="text-[11px] text-[var(--rh-on-surface-variant)] mt-2">
                  Chapter {item.readingLocation} of {item.totalLocations}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-9 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {item.badge && (
                <span className="bg-[var(--rh-secondary-container)] text-[var(--rh-on-secondary-container)] px-3 py-1 rounded-full text-xs font-semibold">
                  {item.badge}
                </span>
              )}
              {item.tag && (
                <span className="bg-[var(--rh-tertiary-fixed)] text-[var(--rh-on-tertiary-fixed)] px-3 py-1 rounded-full text-xs font-semibold">
                  {item.tag}
                </span>
              )}
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-[var(--rh-on-surface)] mb-2">{item.title}</h2>
            <p className="text-xl text-[var(--rh-on-surface-variant)] font-medium">{item.author}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => item.storagePath && setActiveTab('Read')}
              disabled={!item.storagePath}
              className="bg-[var(--rh-primary)] text-[var(--rh-on-primary)] px-8 py-3.5 rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-[var(--rh-primary)]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
            >
              <Play className="w-4.5 h-4.5" fill="currentColor" /> Continue Reading
            </button>
            <button
              onClick={() => openCapture('idea')}
              className="bg-[var(--rh-surface-container-lowest)] border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface)] px-6 py-3.5 rounded-full font-semibold flex items-center gap-2 hover:bg-[var(--rh-surface-container-low)] active:scale-95 transition-all"
            >
              <PlusCircle className="w-4.5 h-4.5" /> Capture Idea
            </button>
            <button
              onClick={() => openCapture('perspective')}
              className="bg-[var(--rh-surface-container-lowest)] border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface)] px-6 py-3.5 rounded-full font-semibold flex items-center gap-2 hover:bg-[var(--rh-surface-container-low)] active:scale-95 transition-all"
            >
              <Share2 className="w-4.5 h-4.5" /> Add Perspective
            </button>
            <button
              onClick={handleExport}
              disabled={bookThoughts.length === 0 || exporting}
              title={bookThoughts.length === 0 ? 'No ideas or perspectives available to export yet.' : undefined}
              className="bg-[var(--rh-surface-container-lowest)] border border-[var(--rh-outline-variant)] text-[var(--rh-on-surface)] px-6 py-3.5 rounded-full font-semibold flex items-center gap-2 hover:bg-[var(--rh-surface-container-low)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4.5 h-4.5" /> {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
          {bookThoughts.length === 0 && (
            <p className="text-xs text-[var(--rh-on-surface-variant)] -mt-2">
              No ideas or perspectives available to export yet.
            </p>
          )}

          <div className="border-b border-[var(--rh-outline-variant)] flex gap-8 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                  activeTab === tab ? 'text-[var(--rh-primary)] font-bold border-b-2 border-[var(--rh-primary)]' : 'text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)]'
                }`}
              >
                {tab}
                {tab === 'Ideas' && topIdeas.length > 0 && (
                  <span className="bg-[var(--rh-surface-container-high)] px-2 rounded-full text-xs">{topIdeas.length}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-8 bg-[var(--rh-surface-container-lowest)] rounded-[24px] border border-[var(--rh-outline-variant)] shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3 text-[var(--rh-primary)]">
                  <Info className="w-5 h-5" />
                  <h3 className="text-lg font-bold">About the Book</h3>
                </div>
                <p className="text-base text-[var(--rh-on-surface-variant)] leading-relaxed">
                  {item.about || 'No description yet.'}
                </p>
              </div>

              <div className="p-8 bg-[var(--rh-primary-container)] text-[var(--rh-on-primary-container)] rounded-[24px] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Why I Am Reading This</h3>
                </div>
                <p className="text-base leading-relaxed opacity-90">
                  {item.whyReading || "You haven't captured this yet."}
                </p>
              </div>

              {hasSummary && (
                <div className="md:col-span-2 p-8 bg-[var(--rh-surface-container-lowest)] rounded-[24px] border border-[var(--rh-outline-variant)] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3 text-[var(--rh-tertiary)]">
                      <Wand2 className="w-5 h-5" />
                      <h3 className="text-lg font-bold text-[var(--rh-on-surface)]">My Summary</h3>
                    </div>
                    <button className="text-[var(--rh-primary)] text-sm font-semibold">Edit</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wide text-[var(--rh-on-surface-variant)]">Core Theme</h4>
                      <p className="text-sm text-[var(--rh-on-surface)]">{item.summaryCoreTheme}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wide text-[var(--rh-on-surface-variant)]">Key Takeaway</h4>
                      <p className="text-sm text-[var(--rh-on-surface)]">{item.summaryKeyTakeaway}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wide text-[var(--rh-on-surface-variant)]">Application</h4>
                      <p className="text-sm text-[var(--rh-on-surface)]">{item.summaryApplication}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[var(--rh-on-surface)]">Top Ideas</h3>
                  {topIdeas.length > 0 && (
                    <button onClick={() => setActiveTab('Ideas')} className="text-[var(--rh-primary)] text-sm hover:underline">
                      View all {topIdeas.length} ideas
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topIdeas.map(thought => (
                    <IdeaCard key={thought.id} thought={thought} onEdit={() => openEditCapture(thought)} onDelete={() => handleDeleteThought(thought)} />
                  ))}
                  <button
                    onClick={() => openCapture('idea')}
                    className="p-6 rounded-[24px] border-2 border-dashed border-[var(--rh-outline-variant)] flex flex-col items-center justify-center text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] cursor-pointer transition-colors"
                  >
                    <Plus className="w-7 h-7 mb-2" />
                    <p className="text-sm font-bold">New Top Idea</p>
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'Read' ? (
            <div className="pt-4">
              {!item.storagePath ? (
                <div className="flex flex-col items-center justify-center text-center py-20 text-[var(--rh-on-surface-variant)]">
                  <BookOpen className="w-8 h-8 mb-3" />
                  <p className="text-sm">No file attached to this book yet.</p>
                </div>
              ) : (
                <ReadPane title={item.title}>
                  {item.fileType === 'EPUB' ? (
                    <EpubReader
                      url={item.storagePath}
                      initialCfi={item.readingCfi}
                      onPositionChange={handlePositionChange}
                      onOpen={handleOpen}
                      onCaptureIdea={(text) => openCapture('idea', text)}
                      onAddPerspective={(text) => openCapture('perspective', text)}
                    />
                  ) : (
                    <iframe
                      src={item.storagePath}
                      title={item.title}
                      className="w-full h-full rounded-xl border border-[var(--rh-outline-variant)]"
                    />
                  )}
                </ReadPane>
              )}
            </div>
          ) : activeTab === 'Ideas' ? (
            <div className="pt-4">
              {topIdeas.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 text-[var(--rh-on-surface-variant)]">
                  <Lightbulb className="w-8 h-8 mb-3" />
                  <p className="text-sm mb-4">No ideas captured yet.</p>
                  <button
                    onClick={() => openCapture('idea')}
                    className="bg-[var(--rh-primary)] text-[var(--rh-on-primary)] px-5 py-2.5 rounded-full text-sm font-semibold hover:brightness-110 transition-all"
                  >
                    Capture Idea
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topIdeas.map(thought => (
                    <IdeaCard key={thought.id} thought={thought} onEdit={() => openEditCapture(thought)} onDelete={() => handleDeleteThought(thought)} />
                  ))}
                  <button
                    onClick={() => openCapture('idea')}
                    className="p-6 rounded-[24px] border-2 border-dashed border-[var(--rh-outline-variant)] flex flex-col items-center justify-center text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] cursor-pointer transition-colors"
                  >
                    <Plus className="w-7 h-7 mb-2" />
                    <p className="text-sm font-bold">New Idea</p>
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'Perspectives' ? (
            <div className="pt-4">
              {perspectives.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 text-[var(--rh-on-surface-variant)]">
                  <Share2 className="w-8 h-8 mb-3" />
                  <p className="text-sm mb-4">No perspectives captured yet.</p>
                  <button
                    onClick={() => openCapture('perspective')}
                    className="bg-[var(--rh-primary)] text-[var(--rh-on-primary)] px-5 py-2.5 rounded-full text-sm font-semibold hover:brightness-110 transition-all"
                  >
                    Add Perspective
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {perspectives.map(thought => (
                    <PerspectiveCard key={thought.id} thought={thought} onEdit={() => openEditCapture(thought)} onDelete={() => handleDeleteThought(thought)} />
                  ))}
                  <button
                    onClick={() => openCapture('perspective')}
                    className="p-6 rounded-[24px] border-2 border-dashed border-[var(--rh-outline-variant)] flex flex-col items-center justify-center text-[var(--rh-on-surface-variant)] hover:text-[var(--rh-primary)] cursor-pointer transition-colors min-h-[140px]"
                  >
                    <Plus className="w-7 h-7 mb-2" />
                    <p className="text-sm font-bold">New Perspective</p>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 text-[var(--rh-on-surface-variant)]">
              <p className="text-sm">The "{activeTab}" tab is coming soon.</p>
            </div>
          )}
        </div>
      </div>

      <CaptureThoughtModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        initialSource={captureSource}
        initialSubtype={captureSubtype}
        initialContent={captureContent}
        editingThought={editingThought}
      />
    </div>
  );
}
