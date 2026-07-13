import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useData } from '../../context/DataContext';
import { DECISION_STATUS_COLORS } from './statusStyles';

export default function ReviewedList() {
  const navigate = useNavigate();
  const { prospects } = useData();

  const reviewed = useMemo(
    () => prospects.filter(p => p.decisionStatus && p.decisionStatus !== 'Not Reviewed').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [prospects]
  );

  if (reviewed.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
        No decisions made yet. Review a prospect's intelligence cards and save a decision.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Decision</th>
            <th className="px-4 py-3 font-medium">Decision Notes</th>
            <th className="px-4 py-3 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reviewed.map(p => (
            <tr key={p.id} onClick={() => navigate(`/prospecting/${p.id}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
              <td className="px-4 py-3 text-gray-500">{p.company || '—'}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${DECISION_STATUS_COLORS[p.decisionStatus]}`}>{p.decisionStatus}</span>
              </td>
              <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{p.decisionNotes || '—'}</td>
              <td className="px-4 py-3 text-gray-400">{formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
