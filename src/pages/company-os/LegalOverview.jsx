import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FileText, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

const PRIORITY_LABEL = {
  P0: { label: 'Build First', className: 'bg-red-50 text-red-600' },
  P1: { label: 'Build Next', className: 'bg-amber-50 text-amber-600' },
  P2: { label: 'Build Later', className: 'bg-gray-100 text-gray-500' },
};

function TemplateRow({ template, onOpen }) {
  const priority = PRIORITY_LABEL[template.priority] || PRIORITY_LABEL.P2;
  return (
    <button onClick={onOpen} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{template.name}</p>
        <p className="text-xs text-gray-400 truncate">{template.description}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${priority.className}`}>{priority.label}</span>
    </button>
  );
}

export default function LegalOverview() {
  const navigate = useNavigate();
  const { legalTemplates, legalDocuments } = useData();

  const agreements = useMemo(() => legalTemplates.filter(t => t.category === 'Agreements'), [legalTemplates]);
  const governance = useMemo(() => legalTemplates.filter(t => t.category === 'Governance'), [legalTemplates]);
  const recentDocuments = useMemo(
    () => [...legalDocuments].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6),
    [legalDocuments]
  );
  const needsAttention = useMemo(
    () => legalDocuments.filter(d => d.status === 'Draft' || d.status === 'Under Review'),
    [legalDocuments]
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Core Legal Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Agreements</p>
            <div className="divide-y divide-gray-100">
              {agreements.map(t => (
                <TemplateRow key={t.id} template={t} onOpen={() => navigate('/company-os/legal/templates')} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Governance</p>
            <div className="divide-y divide-gray-100">
              {governance.map(t => (
                <TemplateRow key={t.id} template={t} onOpen={() => navigate('/company-os/legal/templates')} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Recent Documents</h3>
          {recentDocuments.length === 0 ? (
            <p className="text-sm text-gray-400">No documents yet.</p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
              {recentDocuments.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => navigate(`/company-os/legal/document/${doc.id}`)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400">{doc.category} · {doc.status}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Needs Attention</h3>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing needs attention right now.</p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
              {needsAttention.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => navigate(`/company-os/legal/document/${doc.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400">{doc.status}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
