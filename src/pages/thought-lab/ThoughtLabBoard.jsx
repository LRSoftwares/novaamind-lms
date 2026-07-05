import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { formatDistanceToNow } from 'date-fns';
import { LayoutGrid, List, Kanban as KanbanIcon, Table as TableIcon, Plus, AlertCircle } from 'lucide-react';
import IOSTopBar from './IOSTopBar';
import ContentDetailPanel from './ContentDetailPanel';
import { STAGES, CATEGORIES, PILLARS, IMPORTANCE_LEVELS, STAGE_COLORS, IMPORTANCE_COLORS } from './constants';

const VIEWS = [
  { id: 'kanban', label: 'Kanban', icon: KanbanIcon },
  { id: 'list', label: 'List', icon: List },
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'table', label: 'Table', icon: TableIcon },
];

export default function ThoughtLabBoard() {
  const { thoughts, updateThought } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('kanban');
  const [filterPillar, setFilterPillar] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterImportance, setFilterImportance] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const filtered = useMemo(() => {
    let list = thoughts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.contentText?.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (filterPillar) list = list.filter(t => t.pillar === filterPillar);
    if (filterCategory) list = list.filter(t => t.category === filterCategory);
    if (filterImportance) list = list.filter(t => t.importance === filterImportance);
    return [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [thoughts, search, filterPillar, filterCategory, filterImportance]);

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach(s => { map[s] = []; });
    filtered.forEach(t => { if (map[t.stage]) map[t.stage].push(t); else (map.Idea = map.Idea || []).push(t); });
    return map;
  }, [filtered]);

  const selected = thoughts.find(t => t.id === selectedId) || null;

  const handleDrop = async (stage, e) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const thought = thoughts.find(t => t.id === id);
    if (thought && thought.stage !== stage) await updateThought(id, { stage });
  };

  function Card({ t, compact }) {
    return (
      <div
        draggable
        onDragStart={e => e.dataTransfer.setData('text/plain', t.id)}
        onClick={() => setSelectedId(t.id)}
        className={`bg-[var(--color-ios-surface)] rounded-2xl border cursor-pointer transition-colors ${
          selectedId === t.id ? 'border-[var(--color-ios-primary)]' : 'border-[var(--color-ios-border)] hover:border-[var(--color-ios-primary)]/40'
        } ${compact ? 'p-3' : 'p-4'}`}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ios-primary)] bg-[var(--color-ios-primary)]/10 px-2 py-0.5 rounded-full">
            {t.category}
          </span>
          {t.importance === 'High' && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
        </div>
        <h4 className="font-semibold text-sm text-[var(--color-ios-text)] leading-snug line-clamp-2 mb-1.5">{t.title || 'Untitled'}</h4>
        {t.pillar && <p className="text-xs text-[var(--color-ios-text-muted)] mb-2">Pillar: {t.pillar}</p>}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-ios-primary)] font-medium">Reuse: {t.reuseScore || 0}%</span>
          <span className={`font-medium ${IMPORTANCE_COLORS[t.importance] || 'text-gray-400'}`}>{t.importance}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <IOSTopBar search={search} onSearchChange={setSearch} searchPlaceholder="Search Thought Lab...">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-1 ${view === v.id ? 'text-[var(--color-ios-primary)] font-semibold' : 'hover:text-[var(--color-ios-text)]'}`}
            >
              <v.icon className="w-4 h-4" /> {v.label}
            </button>
          ))}
        </IOSTopBar>

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--color-ios-border)] flex-wrap">
          <select value={filterPillar} onChange={e => setFilterPillar(e.target.value)} className="text-xs border border-[var(--color-ios-border)] rounded-full px-3 py-1.5 bg-white text-[var(--color-ios-text)]">
            <option value="">Pillar: All</option>
            {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="text-xs border border-[var(--color-ios-border)] rounded-full px-3 py-1.5 bg-white text-[var(--color-ios-text)]">
            <option value="">Type: All</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterImportance} onChange={e => setFilterImportance(e.target.value)} className="text-xs border border-[var(--color-ios-border)] rounded-full px-3 py-1.5 bg-white text-[var(--color-ios-text)]">
            <option value="">Importance: All</option>
            {IMPORTANCE_LEVELS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {(filterPillar || filterCategory || filterImportance) && (
            <button
              onClick={() => { setFilterPillar(''); setFilterCategory(''); setFilterImportance(''); }}
              className="text-xs text-[var(--color-ios-text-muted)] hover:text-[var(--color-ios-text)] underline"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => navigate('/thought-lab/thought/new')}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[var(--color-ios-primary)] text-white rounded-full hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" /> New Thought
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-sm text-[var(--color-ios-text-muted)]">No thoughts match these filters.</div>
          ) : view === 'kanban' ? (
            <div className="flex gap-4 h-full items-start">
              {STAGES.map(stage => (
                <div
                  key={stage}
                  onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={e => handleDrop(stage, e)}
                  className={`w-72 flex-shrink-0 rounded-2xl p-2 ${dragOverStage === stage ? 'bg-[var(--color-ios-primary)]/5 ring-2 ring-[var(--color-ios-primary)]/30' : ''}`}
                >
                  <div className="flex items-center gap-2 px-2 py-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-ios-text-muted)]">{stage}</span>
                    <span className={`text-[11px] px-1.5 rounded-full ${STAGE_COLORS[stage]}`}>{byStage[stage].length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {byStage[stage].map(t => <Card key={t.id} t={t} compact />)}
                  </div>
                </div>
              ))}
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(t => <Card key={t.id} t={t} />)}
            </div>
          ) : view === 'list' ? (
            <div className="space-y-2">
              {filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedId === t.id ? 'border-[var(--color-ios-primary)] bg-[var(--color-ios-primary)]/5' : 'border-[var(--color-ios-border)] bg-[var(--color-ios-surface)] hover:bg-[var(--color-ios-surface-alt)]'
                  }`}
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STAGE_COLORS[t.stage] || 'bg-gray-100 text-gray-600'}`}>{t.stage}</span>
                  <span className="flex-1 min-w-0 truncate font-medium text-sm text-[var(--color-ios-text)]">{t.title || 'Untitled'}</span>
                  <span className="text-xs text-[var(--color-ios-text-muted)] flex-shrink-0 hidden sm:inline">{t.pillar}</span>
                  <span className="text-xs text-[var(--color-ios-primary)] font-medium flex-shrink-0">{t.reuseScore || 0}%</span>
                  <span className="text-xs text-gray-300 flex-shrink-0">{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--color-ios-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-ios-surface-alt)] text-left text-xs text-[var(--color-ios-text-muted)] uppercase tracking-wide">
                    <th className="px-4 py-2.5">Title</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Pillar</th>
                    <th className="px-4 py-2.5">Stage</th>
                    <th className="px-4 py-2.5">Importance</th>
                    <th className="px-4 py-2.5">Reuse</th>
                    <th className="px-4 py-2.5">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(t => (
                    <tr key={t.id} onClick={() => setSelectedId(t.id)} className="cursor-pointer hover:bg-[var(--color-ios-surface-alt)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--color-ios-text)] max-w-xs truncate">{t.title || 'Untitled'}</td>
                      <td className="px-4 py-2.5 text-[var(--color-ios-text-muted)]">{t.category}</td>
                      <td className="px-4 py-2.5 text-[var(--color-ios-text-muted)]">{t.pillar || '—'}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[t.stage] || 'bg-gray-100 text-gray-600'}`}>{t.stage}</span></td>
                      <td className={`px-4 py-2.5 font-medium ${IMPORTANCE_COLORS[t.importance] || 'text-gray-400'}`}>{t.importance}</td>
                      <td className="px-4 py-2.5 text-[var(--color-ios-primary)] font-medium">{t.reuseScore || 0}%</td>
                      <td className="px-4 py-2.5 text-gray-400">{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && <ContentDetailPanel thought={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
