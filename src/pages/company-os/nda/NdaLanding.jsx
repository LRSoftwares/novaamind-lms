import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Plus, FileText, Copy, Trash2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import RowMenu from '../../../components/RowMenu';

const STATUS_COLORS = {
  Draft: 'bg-gray-100 text-gray-500',
  'Under Review': 'bg-amber-50 text-amber-600',
  Approved: 'bg-emerald-50 text-emerald-600',
  Signed: 'bg-blue-50 text-blue-600',
  Active: 'bg-blue-50 text-blue-600',
  Archived: 'bg-gray-100 text-gray-400',
};

export default function NdaLanding() {
  const navigate = useNavigate();
  const { legalDocuments, addLegalDocument, deleteLegalDocument } = useData();

  const ndaDocuments = useMemo(
    () => legalDocuments.filter(d => d.type === 'NDA').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [legalDocuments]
  );

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">NDA</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage confidentiality agreements.</p>
        </div>
        <button
          onClick={() => navigate('/company-os/legal/nda/new')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Create NDA
        </button>
      </div>

      {ndaDocuments.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No NDAs yet. Create your first one to get started.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {ndaDocuments.map(doc => {
            const ndaType = doc.structuredData?.ndaType === 'OneWay' ? 'One-Way NDA' : 'Mutual NDA';
            return (
              <div
                key={doc.id}
                onClick={() => navigate(`/company-os/legal/document/${doc.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400 truncate">{ndaType}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${STATUS_COLORS[doc.status] || STATUS_COLORS.Draft}`}>{doc.status}</span>
                <span className="text-xs text-gray-400 flex-shrink-0 w-24 text-right">{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                <RowMenu items={[
                  { label: 'Duplicate', icon: <Copy className="w-3.5 h-3.5" />, onClick: () => handleDuplicate(doc) },
                  { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => handleDelete(doc) },
                ]} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
