import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, LayoutGrid, List, Copy, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import RowMenu from '../../components/RowMenu';

const selectClass = 'text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

const STATUS_COLORS = {
  Draft: 'bg-gray-100 text-gray-500',
  'Under Review': 'bg-amber-50 text-amber-600',
  Approved: 'bg-emerald-50 text-emerald-600',
  Active: 'bg-blue-50 text-blue-600',
  Archived: 'bg-gray-100 text-gray-400',
};

export default function LegalDocuments() {
  const navigate = useNavigate();
  const { legalDocuments, addLegalDocument, deleteLegalDocument } = useData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('recent');
  const [viewMode, setViewMode] = useState('table');

  const types = useMemo(() => ['All', ...new Set(legalDocuments.map(d => d.type))], [legalDocuments]);

  const filtered = useMemo(() => {
    let list = [...legalDocuments];
    if (category !== 'All') list = list.filter(d => d.category === category);
    if (type !== 'All') list = list.filter(d => d.type === type);
    if (status !== 'All') list = list.filter(d => d.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.title.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'title': list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'status': list.sort((a, b) => a.status.localeCompare(b.status)); break;
      default: list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return list;
  }, [legalDocuments, category, type, status, search, sort]);

  const handleDuplicate = async (doc) => {
    const result = await addLegalDocument({
      title: `${doc.title} (Copy)`,
      category: doc.category,
      type: doc.type,
      templateId: doc.templateId || null,
      content: doc.content,
      structuredData: doc.structuredData || null,
    });
    if (result?.data) navigate(`/company-os/legal/document/${result.data.id}`);
  };

  const handleDelete = async (doc) => {
    if (confirm(`Delete "${doc.title}"? This can't be undone.`)) {
      await deleteLegalDocument(doc.id);
    }
  };

  const rowMenuItems = (doc) => [
    { label: 'Duplicate', icon: <Copy className="w-3.5 h-3.5" />, onClick: () => handleDuplicate(doc) },
    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => handleDelete(doc) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search legal documents..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
          <option value="All">All Categories</option>
          <option value="Agreements">Agreements</option>
          <option value="Governance">Governance</option>
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className={selectClass}>
          {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
          <option value="All">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className={selectClass}>
          <option value="recent">Recently Updated</option>
          <option value="title">Title A–Z</option>
          <option value="status">Status</option>
        </select>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">No documents match your filters.</div>
      ) : viewMode === 'table' ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Updated</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(doc => (
                <tr key={doc.id} onClick={() => navigate(`/company-os/legal/document/${doc.id}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{doc.title}</td>
                  <td className="px-4 py-3 text-gray-500">{doc.category}</td>
                  <td className="px-4 py-3 text-gray-500">{doc.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STATUS_COLORS[doc.status] || STATUS_COLORS.Draft}`}>{doc.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-gray-400"><RowMenu items={rowMenuItems(doc)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{doc.title}</h3>
                <RowMenu items={rowMenuItems(doc)} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{doc.category} · {doc.type}</p>
              <div className="flex items-center justify-between mt-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STATUS_COLORS[doc.status] || STATUS_COLORS.Draft}`}>{doc.status}</span>
                <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
              </div>
              <button
                onClick={() => navigate(`/company-os/legal/document/${doc.id}`)}
                className="mt-4 text-sm font-semibold text-blue-600 border border-gray-200 rounded-lg py-2 hover:bg-blue-50 transition-colors"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
