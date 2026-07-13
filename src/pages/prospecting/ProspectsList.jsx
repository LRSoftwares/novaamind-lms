import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import RowMenu from '../../components/RowMenu';
import { RESEARCH_STATUS_COLORS, DECISION_STATUS_COLORS } from './statusStyles';

export default function ProspectsList() {
  const navigate = useNavigate();
  const { prospects, deleteProspect } = useData();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...prospects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.company || '').toLowerCase().includes(q) || (p.role || '').toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [prospects, search]);

  const handleDelete = async (p) => {
    if (confirm(`Delete "${p.name}"? This can't be undone.`)) await deleteProspect(p.id);
  };

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prospects..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No prospects yet. Add one manually or upload an Excel file to get started.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Research Status</th>
                <th className="px-4 py-3 font-medium">AI Recommendation</th>
                <th className="px-4 py-3 font-medium">Human Decision</th>
                <th className="px-4 py-3 font-medium">Last Updated</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => navigate(`/prospecting/${p.id}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.company || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.role || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${RESEARCH_STATUS_COLORS[p.researchStatus] || RESEARCH_STATUS_COLORS['Not Started']}`}>
                      {p.researchStatus || 'Not Started'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.research?.recommendation?.recommendation || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${DECISION_STATUS_COLORS[p.decisionStatus] || DECISION_STATUS_COLORS['Not Reviewed']}`}>
                      {p.decisionStatus || 'Not Reviewed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-gray-400" onClick={e => e.stopPropagation()}>
                    <RowMenu items={[{ label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => handleDelete(p) }]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
