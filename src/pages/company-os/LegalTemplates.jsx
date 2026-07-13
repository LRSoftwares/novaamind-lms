import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import RowMenu from '../../components/RowMenu';

export default function LegalTemplates() {
  const navigate = useNavigate();
  const { legalTemplates, addLegalDocument, deleteLegalTemplate } = useData();

  const handleUseTemplate = async (template) => {
    const result = await addLegalDocument({
      title: template.name,
      category: template.category,
      type: template.type,
      templateId: template.id,
      content: template.content,
    });
    if (result?.data) navigate(`/company-os/legal/document/${result.data.id}`);
  };

  const handleDelete = async (template) => {
    if (confirm(`Delete the "${template.name}" template? This can't be undone.`)) {
      await deleteLegalTemplate(template.id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {legalTemplates.map(template => (
        <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <RowMenu items={[
              { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => handleDelete(template) },
            ]} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 flex-1">{template.description}</p>
          <p className="text-xs text-gray-400 mt-3">
            Version {template.version} · Updated {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true })}
          </p>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => navigate(`/company-os/legal/template/${template.id}`)}
              className="flex-1 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
            >
              Open
            </button>
            <button
              onClick={() => handleUseTemplate(template)}
              className="flex-1 text-sm font-semibold text-white bg-blue-600 rounded-lg py-2 hover:bg-blue-700 transition-colors"
            >
              Use Template
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
