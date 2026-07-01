import { NavLink, Routes, Route } from 'react-router-dom';
import {
  Brain, LayoutDashboard, List, FileText, Share2, Archive,
  BookOpen, Layers, Search, Briefcase, MessageSquare, Pin,
} from 'lucide-react';
import ThoughtDashboard from './thought-repo/ThoughtDashboard';
import AllThoughts from './thought-repo/AllThoughts';
import ThoughtEditor from './thought-repo/ThoughtEditor';
import QuickCaptureModal from '../components/thought-repo/QuickCaptureModal';

const subNav = [
  { to: '/thought-repo', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/thought-repo/all', label: 'All Thoughts', icon: List },
  { to: '/thought-repo/drafts', label: 'Drafts', icon: FileText },
  { to: '/thought-repo/published', label: 'Published', icon: Share2 },
  { to: '/thought-repo/frameworks', label: 'Frameworks', icon: Layers },
  { to: '/thought-repo/stories', label: 'Stories', icon: BookOpen },
  { to: '/thought-repo/research', label: 'Research', icon: Search },
  { to: '/thought-repo/case-studies', label: 'Case Studies', icon: Briefcase },
  { to: '/thought-repo/quotes', label: 'Quotes', icon: MessageSquare },
  { to: '/thought-repo/archive', label: 'Archive', icon: Archive },
];

export default function ThoughtRepository() {
  return (
    <div
      className="flex overflow-hidden bg-white"
      style={{ height: 'calc(100vh - 0px)', margin: '-24px' }}
    >
      {/* Sub-navigation */}
      <div className="w-52 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Thought</p>
              <p className="text-xs text-gray-400">Repository</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {subNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Cmd+N to capture</p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto bg-surface">
        <Routes>
          <Route index element={<div className="p-6"><ThoughtDashboard /></div>} />
          <Route path="all" element={<div className="p-6"><AllThoughts /></div>} />
          <Route path="drafts" element={<div className="p-6"><AllThoughts defaultStatus="Draft" title="Drafts" /></div>} />
          <Route path="published" element={<div className="p-6"><AllThoughts defaultStatus="Published" title="Published" /></div>} />
          <Route path="archive" element={<div className="p-6"><AllThoughts defaultStatus="Archived" title="Archive" /></div>} />
          <Route path="frameworks" element={<div className="p-6"><AllThoughts defaultCategory="Framework" title="Frameworks" /></div>} />
          <Route path="stories" element={<div className="p-6"><AllThoughts defaultCategory="Story" title="Stories" /></div>} />
          <Route path="research" element={<div className="p-6"><AllThoughts defaultCategory="Research" title="Research" /></div>} />
          <Route path="case-studies" element={<div className="p-6"><AllThoughts defaultCategory="Case Study" title="Case Studies" /></div>} />
          <Route path="quotes" element={<div className="p-6"><AllThoughts defaultCategory="Quote" title="Quotes" /></div>} />
          <Route path="new" element={<ThoughtEditor />} />
          <Route path=":id" element={<ThoughtEditor />} />
        </Routes>
      </div>

      <QuickCaptureModal />
    </div>
  );
}
