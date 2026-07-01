import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pin, Star, Brain } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = [
  'Quick Thought', 'Observation', 'Framework', 'Story', 'Lesson',
  'Book Idea', 'Research', 'Case Study', 'Quote', 'Workshop',
  'Newsletter', 'LinkedIn', 'Twitter/X', 'Carousel', 'Video Script', 'Article',
];
const STATUSES = ['Idea', 'Draft', 'Review', 'Ready', 'Published', 'Archived'];

const STATUS_COLORS = {
  Idea: 'bg-gray-100 text-gray-600',
  Draft: 'bg-blue-100 text-blue-700',
  Review: 'bg-yellow-100 text-yellow-700',
  Ready: 'bg-green-100 text-green-700',
  Published: 'bg-indigo-100 text-indigo-700',
  Archived: 'bg-red-100 text-red-700',
};

const PILLAR_COLORS = [
  'bg-purple-50 text-purple-700', 'bg-cyan-50 text-cyan-700',
  'bg-emerald-50 text-emerald-700', 'bg-orange-50 text-orange-700',
];

export default function AllThoughts({ defaultStatus = '', defaultCategory = '', title = '' }) {
  const { thoughts } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(defaultStatus);
  const [filterCategory, setFilterCategory] = useState(defaultCategory);
  const [filterPinned, setFilterPinned] = useState(false);
  const [filterFav, setFilterFav] = useState(false);

  const filtered = useMemo(() => {
    let list = thoughts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.contentText?.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q)) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter(t => t.status === filterStatus);
    if (filterCategory) list = list.filter(t => t.category === filterCategory);
    if (filterPinned) list = list.filter(t => t.isPinned);
    if (filterFav) list = list.filter(t => t.isFavourite);
    return [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [thoughts, search, filterStatus, filterCategory, filterPinned, filterFav]);

  function FilterBtn({ label, active, onClick }) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
          active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex gap-5">
      {/* Left filter sidebar */}
      <div className="w-44 flex-shrink-0 space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-3">Status</p>
          <div className="space-y-0.5">
            <FilterBtn label="All" active={!filterStatus} onClick={() => setFilterStatus('')} />
            {STATUSES.map(s => (
              <FilterBtn key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-3">Category</p>
          <div className="space-y-0.5">
            <FilterBtn label="All" active={!filterCategory} onClick={() => setFilterCategory('')} />
            {CATEGORIES.map(c => (
              <FilterBtn key={c} label={c} active={filterCategory === c} onClick={() => setFilterCategory(filterCategory === c ? '' : c)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-3">Quick</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setFilterPinned(!filterPinned)}
              className={`flex items-center gap-2 w-full text-sm px-3 py-1.5 rounded-lg transition-colors ${
                filterPinned ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Pin className="w-3.5 h-3.5" /> Pinned
            </button>
            <button
              onClick={() => setFilterFav(!filterFav)}
              className={`flex items-center gap-2 w-full text-sm px-3 py-1.5 rounded-lg transition-colors ${
                filterFav ? 'bg-rose-50 text-rose-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Star className="w-3.5 h-3.5" /> Favourites
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, content, tags..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => navigate('/thought-repo/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> New Thought
          </button>
        </div>

        {title && <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>}

        <p className="text-xs text-gray-400 mb-3">
          {filtered.length} thought{filtered.length !== 1 ? 's' : ''}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Brain className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No thoughts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/thought-repo/${t.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
                    {t.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {t.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400" />}
                    {t.isFavourite && <Star className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />}
                  </div>
                </div>

                {t.contentText && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2.5">{t.contentText}</p>
                )}

                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-600'}`}>
                    {t.status}
                  </span>
                  <span className="text-xs text-gray-400">{t.category}</span>
                  {t.pillar && (
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      {t.pillar}
                    </span>
                  )}
                </div>

                {(t.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                    {t.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{t.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-300">
                  {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
