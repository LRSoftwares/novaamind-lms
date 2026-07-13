import { useNavigate } from 'react-router-dom';
import { Scale, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function CompanyOS() {
  const navigate = useNavigate();
  const { legalTemplates } = useData();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Company OS</h1>
        <p className="text-sm text-gray-500 mt-1">The operating system for how NovaaMind works.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/company-os/legal')}
          className="text-left bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Legal Systems</h2>
          <p className="text-sm text-gray-500 mt-1.5">Contracts, agreements, IP and legal governance.</p>
          <p className="text-xs text-gray-400 mt-4">{legalTemplates.length} Documents</p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 mt-4">
            Open System <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
