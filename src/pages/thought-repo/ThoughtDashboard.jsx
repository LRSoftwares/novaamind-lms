import { useData } from '../../context/DataContext';
import { Brain, FileText, Share2, Lightbulb, Pin, Star, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  Idea: 'bg-gray-100 text-gray-600',
  Draft: 'bg-blue-100 text-blue-700',
  Review: 'bg-yellow-100 text-yellow-700',
  Ready: 'bg-green-100 text-green-700',
  Published: 'bg-indigo-100 text-indigo-700',
  Archived: 'bg-red-100 text-red-700',
};

export default function ThoughtDashboard() {
  const { thoughts } = useData();
  const navigate = useNavigate();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: thoughts.length,
    drafts: thoughts.filter(t => t.status === 'Draft').length,
    published: thoughts.filter(t => t.status === 'Published').length,
    thisWeek: thoughts.filter(t => new Date(t.createdAt) >= weekAgo).length,
    thisMonth: thoughts.filter(t => new Date(t.createdAt) >= monthAgo).length,
  };

  const pinned = thoughts.filter(t => t.isPinned).slice(0, 6);
  const recent = [...thoughts]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 10);

  const tagFreq = {};
  thoughts.forEach(t => (t.tags || []).forEach(tag => {
    tagFreq[tag] = (tagFreq[tag] || 0) + 1;
  }));
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const pillars = {};
  thoughts.forEach(t => {
    if (t.pillar) pillars[t.pillar] = (pillars[t.pillar] || 0) + 1;
  });
  const topPillars = Object.entries(pillars).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const statCards = [
    { label: 'Total Thoughts', value: stats.total, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Drafts', value: stats.drafts, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Published', value: stats.published, icon: Share2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'This Week', value: stats.thisWeek, icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'This Month', value: stats.thisMonth, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thought Repository</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your second brain and intellectual property engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {thoughts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <Brain className="w-14 h-14 mx-auto text-indigo-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Your second brain awaits</h3>
          <p className="text-sm text-gray-400 mb-5">Click the <strong>+</strong> button to capture your first thought</p>
          <button
            onClick={() => navigate('/thought-repo/new')}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            New Thought
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Thoughts */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Thoughts</h3>
              <button onClick={() => navigate('/thought-repo/all')} className="text-xs text-indigo-600 hover:underline">View all</button>
            </div>
            <div className="divide-y divide-gray-50">
              {recent.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/thought-repo/${t.id}`)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{t.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.category}
                      {t.pillar && ` · ${t.pillar}`}
                      {' · '}
                      {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t.status}
                    </span>
                    {t.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400" />}
                    {t.isFavourite && <Star className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Pinned */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Pin className="w-4 h-4 text-amber-500" /> Pinned
                </h3>
              </div>
              <div className="p-3 space-y-0.5">
                {pinned.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">No pinned thoughts</p>
                ) : pinned.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/thought-repo/${t.id}`)}
                    className="px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-400">{t.category}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Pillars */}
            {topPillars.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Content Pillars</h3>
                </div>
                <div className="p-4 space-y-2">
                  {topPillars.map(([pillar, count]) => (
                    <div key={pillar} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate">{pillar}</span>
                      <span className="text-xs font-medium text-indigo-600 ml-2 flex-shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Tags */}
            {topTags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Most Used Tags</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-1.5">
                  {topTags.map(([tag, count]) => (
                    <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                      {tag} <span className="opacity-50">({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
