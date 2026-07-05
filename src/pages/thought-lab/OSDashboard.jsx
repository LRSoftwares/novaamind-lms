import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { Lightbulb, FileEdit, Send, GraduationCap, BookOpenCheck, Sparkles } from 'lucide-react';
import IOSTopBar from './IOSTopBar';
import { STAGES, STAGE_COLORS } from './constants';

export default function OSDashboard() {
  const { thoughts } = useData();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const firstName = (profile?.fullName || profile?.full_name || 'there').split(' ')[0];

  const stats = useMemo(() => ({
    ideas: thoughts.filter(t => t.stage === 'Idea').length,
    drafts: thoughts.filter(t => t.stage === 'Writing').length,
    ready: thoughts.filter(t => t.stage === 'Ready').length,
    published: thoughts.filter(t => t.stage === 'Published').length,
  }), [thoughts]);

  const recent = useMemo(() => (
    [...thoughts].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
  ), [thoughts]);

  const pipeline = useMemo(() => {
    const map = {};
    STAGES.forEach(s => { map[s] = []; });
    thoughts.forEach(t => { if (map[t.stage]) map[t.stage].push(t); });
    return map;
  }, [thoughts]);

  const pillarStats = useMemo(() => {
    const counts = {};
    thoughts.forEach(t => { if (t.pillar) counts[t.pillar] = (counts[t.pillar] || 0) + 1; });
    const total = thoughts.length || 1;
    return Object.entries(counts)
      .map(([pillar, count]) => ({ pillar, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [thoughts]);

  const avgReuse = useMemo(() => {
    if (thoughts.length === 0) return 0;
    const sum = thoughts.reduce((acc, t) => acc + (t.reuseScore || 0), 0);
    return Math.round(sum / thoughts.length);
  }, [thoughts]);

  const recommendation = useMemo(() => {
    const lastTouched = {};
    thoughts.forEach(t => {
      if (!t.pillar) return;
      const ts = new Date(t.updatedAt).getTime();
      if (!lastTouched[t.pillar] || ts > lastTouched[t.pillar]) lastTouched[t.pillar] = ts;
    });
    const entries = Object.entries(lastTouched);
    if (entries.length === 0) return null;
    entries.sort((a, b) => a[1] - b[1]);
    const [pillar, ts] = entries[0];
    const days = differenceInCalendarDays(new Date(), new Date(ts));
    if (days < 3) return null;
    return { pillar, days };
  }, [thoughts]);

  const graph = useMemo(() => {
    if (pillarStats.length === 0) return null;
    const core = pillarStats[0].pillar;
    const tagCounts = {};
    thoughts.filter(t => t.pillar === core).forEach(t => {
      (t.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
    });
    const supporting = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag);
    return { core, supporting };
  }, [pillarStats, thoughts]);

  const statCards = [
    { label: 'Ideas to Capture', value: stats.ideas, icon: Lightbulb },
    { label: 'Active Drafts', value: stats.drafts, icon: FileEdit },
    { label: 'Ready to Publish', value: stats.ready, icon: Send },
    { label: 'Published', value: stats.published, icon: GraduationCap },
    { label: 'Avg Reuse Score', value: `${avgReuse}%`, icon: BookOpenCheck },
  ];

  const graphPositions = [
    { top: '15%', left: '20%' }, { top: '15%', left: '75%' },
    { top: '75%', left: '20%' }, { top: '75%', left: '75%' },
  ];

  return (
    <div>
      <IOSTopBar search={search} onSearchChange={setSearch} searchPlaceholder="Search thought nodes..." />

      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-4 md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-ios-text)] tracking-tight">Good Morning, {firstName}</h1>
            <p className="text-sm text-[var(--color-ios-text-muted)] mt-1">
              The OS is synced. You have {stats.ideas + stats.drafts} active thought cycles today.
            </p>
          </div>
          {recommendation && (
            <div className="flex-shrink-0 max-w-sm border border-[var(--color-ios-primary)]/30 bg-[var(--color-ios-primary)]/5 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-[var(--color-ios-primary)] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> AI RECOMMENDATION
              </p>
              <p className="text-sm text-[var(--color-ios-text)]">
                You haven't written about <strong>{recommendation.pillar}</strong> in {recommendation.days} days.
              </p>
            </div>
          )}
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="bg-[var(--color-ios-surface)] rounded-2xl p-4 border border-[var(--color-ios-border)]">
              <s.icon className="w-5 h-5 text-[var(--color-ios-primary)] mb-3" />
              <p className="text-2xl font-bold text-[var(--color-ios-text)]">{s.value}</p>
              <p className="text-xs text-[var(--color-ios-text-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {thoughts.length === 0 ? (
          <div className="bg-[var(--color-ios-surface)] rounded-2xl border border-dashed border-[var(--color-ios-border)] py-20 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-[var(--color-ios-primary)]/30 mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-ios-text)] mb-2">Your intellectual OS awaits</h3>
            <p className="text-sm text-[var(--color-ios-text-muted)] mb-5">Capture your first thought to get started</p>
            <button
              onClick={() => navigate('/thought-lab/capture')}
              className="px-6 py-2.5 bg-[var(--color-ios-primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Capture a Thought
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent thoughts */}
            <div className="lg:col-span-2 bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)]">
              <div className="px-5 py-4 border-b border-[var(--color-ios-border)] flex items-center justify-between">
                <h3 className="font-semibold text-[var(--color-ios-text)]">Recent Thoughts</h3>
                <button onClick={() => navigate('/thought-lab/board')} className="text-xs text-[var(--color-ios-primary)] hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-50">
                {recent.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/thought-lab/thought/${t.id}`)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-ios-surface-alt)] cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--color-ios-primary)] uppercase tracking-wide">{t.category}</p>
                      <p className="font-medium text-sm text-[var(--color-ios-text)] truncate">{t.title || 'Untitled'}</p>
                      <p className="text-xs text-[var(--color-ios-text-muted)] mt-0.5 truncate">
                        {t.contentText?.slice(0, 80) || 'No content yet'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[t.stage] || 'bg-gray-100 text-gray-600'}`}>{t.stage}</span>
                      <span className="text-[11px] text-gray-300">{formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Pipeline */}
            <div className="bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)]">
              <div className="px-5 py-4 border-b border-[var(--color-ios-border)]">
                <h3 className="font-semibold text-[var(--color-ios-text)]">Content Pipeline</h3>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {STAGES.map(stage => (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-[var(--color-ios-text-muted)] uppercase tracking-wide">{stage}</span>
                      <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 rounded-full">{pipeline[stage].length}</span>
                    </div>
                    {pipeline[stage].slice(0, 2).map(t => (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/thought-lab/thought/${t.id}`)}
                        className="text-xs text-[var(--color-ios-text)] px-2 py-1.5 rounded-lg hover:bg-[var(--color-ios-surface-alt)] cursor-pointer truncate"
                      >
                        {t.title || 'Untitled'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {thoughts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Knowledge graph (simplified) */}
            <div className="lg:col-span-2 bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)] p-5">
              <h3 className="font-semibold text-[var(--color-ios-text)] mb-4">Knowledge Graph</h3>
              {graph ? (
                <div className="relative h-64 bg-[var(--color-ios-surface-alt)] rounded-xl overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                    <div className="w-4 h-4 rounded-full bg-[var(--color-ios-primary)]" />
                    <span className="text-xs font-semibold text-[var(--color-ios-text)] mt-1 bg-[var(--color-ios-surface-alt)] px-1">{graph.core}</span>
                  </div>
                  {graph.supporting.map((tag, i) => (
                    <div key={tag} className="absolute flex flex-col items-center" style={graphPositions[i] || {}}>
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                      <span className="text-xs text-[var(--color-ios-text-muted)] mt-1">{tag}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-ios-text-muted)]">Tag your thoughts with a pillar to grow the knowledge graph.</p>
              )}
            </div>

            {/* Content Health */}
            <div className="bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)] p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-[var(--color-ios-text)]">Content Health</h3>
                <span className="text-xl font-bold text-[var(--color-ios-primary)]">{avgReuse}%</span>
              </div>
              <p className="text-xs text-[var(--color-ios-text-muted)] mb-4">Semantic coverage across your primary pillars.</p>
              <div className="space-y-3">
                {pillarStats.length === 0 && <p className="text-xs text-[var(--color-ios-text-muted)]">No pillars tagged yet.</p>}
                {pillarStats.map(p => (
                  <div key={p.pillar}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--color-ios-text)] font-medium truncate">{p.pillar}</span>
                      <span className="text-[var(--color-ios-text-muted)]">{p.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-ios-primary)] rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
