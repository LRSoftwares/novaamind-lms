import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Archive } from 'lucide-react';
import ReadingHubSidebar from './ReadingHubSidebar';
import ReadingHubTopBar from './ReadingHubTopBar';
import MyLibrary from './MyLibrary';
import BookDetail from './BookDetail';
import Trash from './Trash';
import Overview from './Overview';
import Thoughts from './Thoughts';
import Collections from './Collections';
import CollectionDetail from './CollectionDetail';
import ComingSoon from './ComingSoon';
import AddBookModal from './AddBookModal';

export default function ReadingHubApp() {
  const [search, setSearch] = useState('');
  const [addBookOpen, setAddBookOpen] = useState(false);
  const location = useLocation();
  const isLibraryPage = location.pathname === '/reading-hub' || location.pathname === '/reading-hub/';

  // Clear the search query when leaving the Library page — adjusted during render
  // (not an effect) per React's guidance for "state that resets when a value changes".
  const [prevIsLibraryPage, setPrevIsLibraryPage] = useState(isLibraryPage);
  if (isLibraryPage !== prevIsLibraryPage) {
    setPrevIsLibraryPage(isLibraryPage);
    if (!isLibraryPage) setSearch('');
  }

  return (
    <div className="reading-hub flex bg-[var(--rh-background)] min-h-screen text-[var(--rh-on-surface)]">
      <ReadingHubSidebar onAddBook={() => setAddBookOpen(true)} />
      <main className="flex-1 min-w-0">
        <ReadingHubTopBar search={search} onSearchChange={setSearch} showSearch={isLibraryPage} />
        <Routes>
          <Route index element={<MyLibrary search={search} />} />
          <Route path="book/:id" element={<BookDetail />} />
          <Route path="overview" element={<Overview />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:id" element={<CollectionDetail />} />
          <Route path="thoughts" element={<Thoughts />} />
          <Route path="archive" element={<ComingSoon title="Archive" icon={Archive} />} />
          <Route path="trash" element={<Trash />} />
        </Routes>
      </main>
      <AddBookModal open={addBookOpen} onClose={() => setAddBookOpen(false)} />
    </div>
  );
}
