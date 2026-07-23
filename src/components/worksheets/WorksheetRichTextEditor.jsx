import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CharacterCount from '@tiptap/extension-character-count';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import FontFamily from '@tiptap/extension-font-family';
import { marked } from 'marked';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, RemoveFormatting,
  Pilcrow, Quote,
  List, ListOrdered, SquareCheck, IndentIncrease, IndentDecrease,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Code, Code2, Link2, Minus, Table2, Rows3, Columns3, Trash2,
  ImagePlus, ChevronsUpDown, Undo2, Redo2,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Info, AlertTriangle, CheckCircle2, Lightbulb, AlertCircle, BookOpen,
} from 'lucide-react';
import {
  FontSize, FONT_SIZE_OPTIONS, FontWeight, FONT_WEIGHT_OPTIONS,
  Indent, ParagraphSpacing, Callout, CALLOUT_VARIANTS, CollapsibleExtensions, ImageBlock,
} from './tiptap-extensions/index.js';
import { sanitizeWorksheetHtml } from '../../lib/sanitizeHtml.js';

const CALLOUT_ICONS = { info: Info, warning: AlertTriangle, success: CheckCircle2, tip: Lightbulb, important: AlertCircle, example: BookOpen };
const MARKDOWN_PASTE_RE = /^#{1,4}\s|^[-*]\s|^\d+\.\s|\*\*.+\*\*/m;

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${active ? 'bg-[var(--color-ios-primary,#2563eb)]/10 text-[var(--color-ios-primary,#2563eb)]' : 'text-gray-500'}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;
}

function Select({ value, onChange, title, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      onMouseDown={e => e.stopPropagation()}
      title={title}
      className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-600 max-w-[7.5rem]"
    >
      {children}
    </select>
  );
}

export default function WorksheetRichTextEditor({
  value, onChange, placeholder = 'Write the question…', worksheetId, onUploadImage, editable = true,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      FontWeight,
      Indent,
      ParagraphSpacing,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer', target: '_blank', rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      ImageBlock,
      Callout,
      ...CollapsibleExtensions,
      CharacterCount,
    ],
    content: value || '',
    editorProps: {
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData('text/html');
        const text = event.clipboardData?.getData('text/plain');
        if (!html && text && MARKDOWN_PASTE_RE.test(text)) {
          event.preventDefault();
          editor?.commands.insertContent(marked.parse(text));
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(sanitizeWorksheetHtml(editor.getHTML()));
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, false);
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

  const setImageCaption = () => {
    const prev = editor.getAttributes('image').caption || '';
    const val = window.prompt('Image caption (leave blank to remove):', prev);
    if (val === null) return;
    editor.chain().focus().updateAttributes('image', { caption: val || null }).run();
  };

  const pickImage = () => fileInputRef.current?.click();

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadImage) return;
    setUploading(true);
    const { url, error } = await onUploadImage(worksheetId, file);
    setUploading(false);
    if (error || !url) { window.alert(`Image upload failed: ${error?.message || error || 'unknown error'}`); return; }
    editor.chain().focus().setImage({ src: url, alt: file.name }).run();
  };

  const insertTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  const handleIndent = () => {
    if (editor.can().sinkListItem('listItem')) return editor.chain().focus().sinkListItem('listItem').run();
    if (editor.can().sinkListItem('taskItem')) return editor.chain().focus().sinkListItem('taskItem').run();
    editor.chain().focus().indent().run();
  };
  const handleOutdent = () => {
    if (editor.can().liftListItem('listItem')) return editor.chain().focus().liftListItem('listItem').run();
    if (editor.can().liftListItem('taskItem')) return editor.chain().focus().liftListItem('taskItem').run();
    editor.chain().focus().outdent().run();
  };

  const clearFormatting = () => editor.chain().focus().unsetAllMarks().run();

  const blockType = editor.isActive('heading', { level: 1 }) ? 'h1'
    : editor.isActive('heading', { level: 2 }) ? 'h2'
    : editor.isActive('heading', { level: 3 }) ? 'h3'
    : editor.isActive('heading', { level: 4 }) ? 'h4'
    : editor.isActive('blockquote') ? 'quote'
    : 'p';

  const setBlockType = (e) => {
    const v = e.target.value;
    const chain = editor.chain().focus();
    if (v === 'p') chain.setParagraph().run();
    else if (v === 'quote') chain.setParagraph().toggleBlockquote().run();
    else chain.setHeading({ level: Number(v.slice(1)) }).run();
  };

  const activeCallout = editor.getAttributes('callout').variant;
  const toggleCallout = (e) => {
    const variant = e.target.value;
    if (!variant) { if (editor.isActive('callout')) editor.chain().focus().unsetCallout().run(); return; }
    if (editor.isActive('callout')) editor.chain().focus().updateAttributes('callout', { variant }).run();
    else editor.chain().focus().setCallout(variant).run();
  };

  const words = editor.storage.characterCount?.words?.() ?? 0;
  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const CalloutIcon = CALLOUT_ICONS[activeCallout] || Info;

  return (
    <div className="border border-[var(--color-ios-border,#e5e7eb)] rounded-xl overflow-hidden bg-white">
      {editable && (
        <div className="flex flex-col gap-1 px-2 py-2 border-b border-gray-100 bg-gray-50/80">
          {/* Row 1 */}
          <div className="flex flex-wrap items-center gap-0.5">
            <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Cmd+Z)"><Undo2 className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Cmd+Shift+Z)"><Redo2 className="w-4 h-4" /></Btn>
            <Divider />
            <Select value={blockType} onChange={setBlockType} title="Block type">
              <option value="p">Normal text</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="quote">Quote</option>
            </Select>
            <Divider />
            <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Cmd+B)"><Bold className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Cmd+I)"><Italic className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Cmd+U)"><UnderlineIcon className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript"><SuperscriptIcon className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript"><SubscriptIcon className="w-4 h-4" /></Btn>
            <Btn onClick={clearFormatting} title="Clear formatting"><RemoveFormatting className="w-4 h-4" /></Btn>
            <Divider />
            <label className="flex items-center gap-1 px-1" title="Text color">
              <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} className="w-5 h-5 rounded cursor-pointer border border-gray-200" />
            </label>
            <label className="flex items-center gap-1 px-1" title="Highlight color">
              <Highlighter className="w-4 h-4 text-gray-500" />
              <input type="color" defaultValue="#fef08a" onChange={e => editor.chain().focus().setHighlight({ color: e.target.value }).run()} className="w-5 h-5 rounded cursor-pointer border border-gray-200" />
            </label>
            <Divider />
            <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify className="w-4 h-4" /></Btn>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap items-center gap-0.5">
            <Select value="" onChange={e => { if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run(); }} title="Font family">
              <option value="">Font</option>
              <option value="Inter, sans-serif">Inter</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </Select>
            <Select value="" onChange={e => { if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run(); }} title="Font size">
              <option value="">Size</option>
              {FONT_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value="" onChange={e => { if (e.target.value) editor.chain().focus().setFontWeight(e.target.value).run(); }} title="Font weight">
              <option value="">Weight</option>
              {FONT_WEIGHT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Divider />
            <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Checklist"><SquareCheck className="w-4 h-4" /></Btn>
            <Btn onClick={handleIndent} title="Indent"><IndentIncrease className="w-4 h-4" /></Btn>
            <Btn onClick={handleOutdent} title="Outdent"><IndentDecrease className="w-4 h-4" /></Btn>
            <Divider />
            <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><Code className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code2 className="w-4 h-4" /></Btn>
            <Btn onClick={setLink} active={editor.isActive('link')} title="Link"><Link2 className="w-4 h-4" /></Btn>
            <Divider />
            <Btn onClick={insertTable} title="Insert table"><Table2 className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()} title="Add row"><Rows3 className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()} title="Add column"><Columns3 className="w-4 h-4" /></Btn>
            <Btn onClick={() => { if (editor.can().deleteRow()) editor.chain().focus().deleteRow().run(); else if (editor.can().deleteColumn()) editor.chain().focus().deleteColumn().run(); }} disabled={!editor.can().deleteRow() && !editor.can().deleteColumn()} title="Delete row/column"><Trash2 className="w-4 h-4" /></Btn>
            <Divider />
            <Btn onClick={pickImage} disabled={uploading} title="Insert image"><ImagePlus className="w-4 h-4" /></Btn>
            {editor.isActive('image') && <Btn onClick={setImageCaption} title="Image caption"><Pilcrow className="w-4 h-4" /></Btn>}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
            <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="w-4 h-4" /></Btn>
            <Btn onClick={() => editor.chain().focus().setCollapsible().run()} title="Collapsible / Read more"><ChevronsUpDown className="w-4 h-4" /></Btn>
            <Divider />
            <CalloutIcon className="w-4 h-4 text-gray-400 ml-1" />
            <Select value={activeCallout || ''} onChange={toggleCallout} title="Callout box">
              <option value="">Callout…</option>
              {CALLOUT_VARIANTS.map(v => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}
            </Select>
            <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote className="w-4 h-4" /></Btn>
          </div>
        </div>
      )}

      <div className="worksheet-rich-content px-5 py-4">
        <EditorContent editor={editor} />
      </div>

      {editable && (
        <div className="px-5 py-1.5 border-t border-gray-100 bg-gray-50/60 text-xs text-gray-400 flex items-center gap-3">
          <span>{words} words</span>
          <span>{chars} characters</span>
          {uploading && <span className="text-blue-500">Uploading image…</span>}
        </div>
      )}
    </div>
  );
}
