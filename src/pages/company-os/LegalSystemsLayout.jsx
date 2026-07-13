import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import NewDocumentModal from './NewDocumentModal';
import NewTemplateModal from './NewTemplateModal';

const TABS = [
  { to: '/company-os/legal', label: 'Overview', end: true },
  { to: '/company-os/legal/documents', label: 'Documents' },
  { to: '/company-os/legal/nda', label: 'NDA' },
  { to: '/company-os/legal/templates', label: 'Templates' },
];

export default function LegalSystemsLayout() {
  const navigate = useNavigate();
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal Systems</h1>
          <p className="text-sm text-gray-500 mt-1">Create, organise and maintain the legal foundation of NovaaMind.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setNewTemplateOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Add Template
          </button>
          <button
            onClick={() => setNewDocOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Document
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 flex gap-6 mb-6">
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `pb-3 text-sm font-medium border-b-2 transition-colors ${
                isActive ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />

      <NewDocumentModal
        open={newDocOpen}
        onClose={() => setNewDocOpen(false)}
        onCreated={(id) => { setNewDocOpen(false); navigate(`/company-os/legal/document/${id}`); }}
      />

      <NewTemplateModal
        open={newTemplateOpen}
        onClose={() => setNewTemplateOpen(false)}
        onCreated={(id) => { setNewTemplateOpen(false); navigate(`/company-os/legal/template/${id}`); }}
      />
    </div>
  );
}
