import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useData } from '../../context/DataContext';
import { RESEARCH_STATUS_COLORS } from './statusStyles';

const IN_FLIGHT = ['Prompt Generated', 'Sent for Research', 'Uploaded', 'Needs Review'];

export default function ResearchQueue() {
  const navigate = useNavigate();
  const { prospects } = useData();

  const active = useMemo(
    () => prospects.filter(p => IN_FLIGHT.includes(p.researchStatus)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [prospects]
  );

  if (active.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
        No prospects currently in research. Click Research on a prospect to generate a prompt.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {active.map(p => (
        <button
          key={p.id}
          onClick={() => navigate(`/prospecting/${p.id}`)}
          className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
        >
          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{p.role}{p.role && p.company ? ' · ' : ''}{p.company}</p>
          <div className="flex items-center justify-between mt-4">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${RESEARCH_STATUS_COLORS[p.researchStatus]}`}>{p.researchStatus}</span>
            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
