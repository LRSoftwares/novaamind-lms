import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  Heading1, Heading2, Heading3, List, ListOrdered, SquareCheck,
  Code, Quote, Link2, Minus, Table2, AlignLeft, Undo2, Redo2,
} from 'lucide-react';

function Btn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${active ? 'bg-[var(--color-ios-primary)]/10 text-[var(--color-ios-primary)]' : 'text-gray-500'}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing your thought...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON(), editor.getText());
    },
  });

  useEffect(() => {
    if (!editor || !value) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value);
    if (current !== incoming && incoming !== '{}' && incoming !== 'null') {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL:', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const words = editor.storage.characterCount?.words?.() ?? 0;
  const chars = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="border border-[var(--color-ios-border)] rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-gray-100 bg-gray-50/80">
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Cmd+Z)"><Undo2 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Cmd+Shift+Z)"><Redo2 className="w-4 h-4" /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph"><AlignLeft className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 className="w-4 h-4" /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Cmd+B)"><Bold className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Cmd+I)"><Italic className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Cmd+U)"><UnderlineIcon className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter className="w-4 h-4" /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Checklist"><SquareCheck className="w-4 h-4" /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote className="w-4 h-4" /></Btn>
        <Btn onClick={setLink} active={editor.isActive('link')} title="Link"><Link2 className="w-4 h-4" /></Btn>
        <Btn onClick={insertTable} title="Insert Table"><Table2 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus className="w-4 h-4" /></Btn>
      </div>

      {/* Editor body */}
      <div className="thought-editor-content min-h-80 px-5 py-4">
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className="px-5 py-1.5 border-t border-gray-100 bg-gray-50/60 text-xs text-gray-400 flex items-center gap-3">
        <span>{words} words</span>
        <span>{chars} characters</span>
        <span className="ml-auto text-gray-300">Cmd+S to save</span>
      </div>
    </div>
  );
}
