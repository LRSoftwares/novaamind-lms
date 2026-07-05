import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, Bookmark, PenLine, Lightbulb, Archive } from 'lucide-react';
import ReadingHubSidebar from './ReadingHubSidebar';
import ReadingHubTopBar from './ReadingHubTopBar';
import MyLibrary from './MyLibrary';
import BookDetail from './BookDetail';
import Trash from './Trash';
import ComingSoon from './ComingSoon';
import AddBookModal from './AddBookModal';

export default function ReadingHubApp() {
  const [search, setSearch] = useState('');
  const [addBookOpen, setAddBookOpen] = useState(false);

  return (
    <div className="reading-hub flex bg-[var(--rh-background)] min-h-screen text-[var(--rh-on-surface)]">
      <ReadingHubSidebar onAddBook={() => setAddBookOpen(true)} />
      <main className="flex-1 min-w-0">
        <ReadingHubTopBar search={search} onSearchChange={setSearch} />
        <Routes>
          <Route index element={<MyLibrary search={search} />} />
          <Route path="book/:id" element={<BookDetail />} />
          <Route path="overview" element={<ComingSoon title="Overview" icon={LayoutDashboard} />} />
          <Route path="collections" element={<ComingSoon title="Collections" icon={Bookmark} />} />
          <Route path="highlights" element={<ComingSoon title="Highlights" icon={PenLine} />} />
          <Route path="book-ideas" element={<ComingSoon title="Book Ideas" icon={Lightbulb} />} />
          <Route path="archive" element={<ComingSoon title="Archive" icon={Archive} />} />
          <Route path="trash" element={<Trash />} />
        </Routes>
      </main>
      <AddBookModal open={addBookOpen} onClose={() => setAddBookOpen(false)} />
    </div>
  );
}
