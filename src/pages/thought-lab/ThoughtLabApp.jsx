import { Routes, Route } from 'react-router-dom';
import IOSSidebar from './IOSSidebar';
import OSDashboard from './OSDashboard';
import Capture from './Capture';
import ThoughtLabBoard from './ThoughtLabBoard';
import ContentStudio from './ContentStudio';
import Analytics from './Analytics';
import FilteredThoughtView from './FilteredThoughtView';
import ThoughtEditor from './ThoughtEditor';
import QuickCaptureModal from '../../components/thought-lab/QuickCaptureModal';
import { KNOWLEDGE_BASE_CATEGORIES, FRAMEWORK_CATEGORIES, STORY_CATEGORIES } from './constants';

export default function ThoughtLabApp() {
  return (
    <div className="flex bg-[var(--color-ios-bg)] min-h-screen text-[var(--color-ios-text)]" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <IOSSidebar />
      <main className="flex-1 min-w-0">
        <Routes>
          <Route index element={<OSDashboard />} />
          <Route path="capture" element={<Capture />} />
          <Route path="board" element={<ThoughtLabBoard />} />
          <Route
            path="knowledge-base"
            element={
              <FilteredThoughtView
                title="Knowledge Base"
                categories={KNOWLEDGE_BASE_CATEGORIES}
                emptyHint="Capture research, articles, and book notes to build your knowledge base."
              />
            }
          />
          <Route
            path="framework-library"
            element={
              <FilteredThoughtView
                title="Framework Library"
                categories={FRAMEWORK_CATEGORIES}
                emptyHint="No frameworks yet — capture a mental model or business framework."
              />
            }
          />
          <Route
            path="story-bank"
            element={
              <FilteredThoughtView
                title="Story Bank"
                categories={STORY_CATEGORIES}
                emptyHint="No stories yet — capture a personal story or case study."
              />
            }
          />
          <Route path="content-studio" element={<ContentStudio />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="thought/new" element={<ThoughtEditor />} />
          <Route path="thought/:id" element={<ThoughtEditor />} />
        </Routes>
      </main>
      <QuickCaptureModal />
    </div>
  );
}
