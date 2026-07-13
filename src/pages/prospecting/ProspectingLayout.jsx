import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import AddProspectDrawer from './AddProspectDrawer';
import UploadExcelModal from './UploadExcelModal';

const TABS = [
  { to: '/prospecting', label: 'Prospects', end: true },
  { to: '/prospecting/research', label: 'Research' },
  { to: '/prospecting/reviewed', label: 'Reviewed' },
];

export default function ProspectingLayout() {
  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospecting</h1>
          <p className="text-sm text-gray-500 mt-1">Research prospects with AI. Decide with human judgment.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload Excel
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Prospect
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

      <AddProspectDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      <UploadExcelModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
