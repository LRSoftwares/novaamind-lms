import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Copy, Download, ShieldCheck, FileDown, Info, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import RichTextEditor from '../../components/thought-lab/RichTextEditor';
import { exportNdaDocx, exportNdaPdf } from '../../utils/ndaExport';

const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

const STATUS_OPTIONS = ['Draft', 'Under Review', 'Approved', 'Signed', 'Active', 'Archived'];
const PRIORITY_OPTIONS = ['P0', 'P1', 'P2'];

function extractHeadings(content) {
  if (!content?.content) return [];
  return content.content
    .filter(node => node.type === 'heading')
    .map(node => ({
      level: node.attrs?.level || 1,
      text: (node.content || []).map(c => c.text || '').join('') || 'Untitled section',
    }));
}

function extractPlainText(content) {
  if (!content?.content) return '';
  const lines = [];
  const walk = (node) => {
    if (node.type === 'text') lines.push(node.text);
    if (node.content) node.content.forEach(walk);
    if (node.type === 'paragraph' || node.type === 'heading') lines.push('\n');
  };
  content.content.forEach(walk);
  return lines.join('');
}

export default function LegalDocumentDetail({ isTemplate = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    legalDocuments, legalTemplates,
    updateLegalDocument, addLegalDocument, deleteLegalDocument,
    updateLegalTemplate, deleteLegalTemplate,
  } = useData();
  const editorWrapRef = useRef(null);

  const record = isTemplate ? legalTemplates.find(t => t.id === id) : legalDocuments.find(d => d.id === id);

  const [content, setContent] = useState(record?.content || { type: 'doc', content: [] });
  const [title, setTitle] = useState(record?.title || record?.name || '');
  const [status, setStatus] = useState(record?.status || 'Draft');
  const [owner, setOwner] = useState(record?.owner || '');
  const [reviewDate, setReviewDate] = useState(record?.reviewDate || '');
  const [notes, setNotes] = useState(record?.notes || '');
  const [description, setDescription] = useState(record?.description || '');
  const [priority, setPriority] = useState(record?.priority || 'P2');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!record) return;
    setContent(record.content || { type: 'doc', content: [] });
    setTitle(record.title || record.name || '');
    if (isTemplate) {
      setDescription(record.description || '');
      setPriority(record.priority || 'P2');
    } else {
      setStatus(record.status || 'Draft');
      setOwner(record.owner || '');
      setReviewDate(record.reviewDate || '');
      setNotes(record.notes || '');
    }
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id]);

  const headings = useMemo(() => extractHeadings(content), [content]);

  const handleScrollTo = (index) => {
    const el = editorWrapRef.current?.querySelectorAll('h1, h2, h3')[index];
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    setSaving(true);
    if (isTemplate) {
      await updateLegalTemplate(id, { name: title, description, priority, content });
    } else {
      await updateLegalDocument(id, { title, content, status, owner, reviewDate: reviewDate || null, notes });
    }
    setSaving(false);
    setDirty(false);
  };

  const handleDuplicate = async () => {
    const result = await addLegalDocument({
      title: `${record.title} (Copy)`,
      category: record.category,
      type: record.type,
      templateId: record.templateId || null,
      content,
      structuredData: record.structuredData || null,
    });
    if (result?.data) navigate(`/company-os/legal/document/${result.data.id}`);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    if (isTemplate) {
      await deleteLegalTemplate(id);
      navigate('/company-os/legal/templates');
    } else {
      await deleteLegalDocument(id);
      navigate(record.type === 'NDA' ? '/company-os/legal/nda' : '/company-os/legal/documents');
    }
  };

  const handleExport = () => {
    const text = extractPlainText(content);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(record.title || record.name).replace(/[^a-zA-Z0-9]+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const isNda = record?.type === 'NDA';
  const handleExportPdf = () => exportNdaPdf({ ...record, content });
  const handleExportDocx = () => exportNdaDocx({ ...record, content });

  if (!record) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <p className="text-gray-400">Document not found.</p>
        <button onClick={() => navigate('/company-os/legal/documents')} className="mt-4 text-blue-600 font-semibold hover:underline">
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate(isTemplate ? '/company-os/legal/templates' : (isNda ? '/company-os/legal/nda' : '/company-os/legal/documents'))}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {isTemplate && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                <ShieldCheck className="w-3 h-3" /> Master Template
              </span>
            )}
            <span className="text-xs text-gray-400">{record.category} · {record.type}</span>
          </div>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); setDirty(true); }}
            className="text-xl font-bold text-gray-900 w-full max-w-lg bg-transparent border border-transparent rounded-lg -ml-2 px-2 py-0.5 hover:border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isTemplate && (
            <button onClick={handleDuplicate} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>
          )}
          {!isTemplate && (isNda ? (
            <>
              <button onClick={handleExportDocx} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <FileDown className="w-3.5 h-3.5" /> Export DOCX
              </button>
              <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
            </>
          ) : (
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_240px] gap-6 items-start">
        <div className="rounded-xl border border-gray-200 bg-white p-3 lg:sticky lg:top-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">Document Sections</p>
          {headings.length === 0 ? (
            <p className="text-xs text-gray-400 px-2 py-1">No sections yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {headings.map((h, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleScrollTo(i)}
                    title={h.text}
                    style={{ paddingLeft: `${8 + (h.level - 1) * 10}px` }}
                    className="block w-full truncate text-left text-xs leading-5 py-1.5 pr-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={editorWrapRef}>
          <RichTextEditor
            value={content}
            editable
            onChange={(json) => { setContent(json); setDirty(true); }}
            placeholder="Start writing this document..."
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 lg:sticky lg:top-6">
          {isTemplate ? (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500">Category</label>
                <p className="text-sm text-gray-700 mt-1">{record.category}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Type</label>
                <p className="text-sm text-gray-700 mt-1">{record.type}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Priority</label>
                <select value={priority} onChange={e => { setPriority(e.target.value); setDirty(true); }} className={`${inputClass} mt-1`}>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Version</label>
                <p className="text-sm text-gray-700 mt-1">{record.version}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Description</label>
                <textarea value={description} onChange={e => { setDescription(e.target.value); setDirty(true); }} rows={3} className={`${inputClass} mt-1 resize-none`} placeholder="Description" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-700 mt-1">{new Date(record.updatedAt).toLocaleDateString()}</p>
              </div>
            </>
          ) : (
            <>
              {isNda && record.structuredData && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500">NDA Type</label>
                    <p className="text-sm text-gray-700 mt-1">{record.structuredData.ndaType === 'OneWay' ? 'One-Way NDA' : 'Mutual NDA'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Effective Date</label>
                    <p className="text-sm text-gray-700 mt-1">{record.structuredData.effectiveDate || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Parties</label>
                    <p className="text-sm text-gray-700 mt-1">{record.structuredData.party1?.legalName || '—'} & {record.structuredData.party2?.legalName || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Governing Law</label>
                    <p className="text-sm text-gray-700 mt-1">{record.structuredData.governingLaw?.country || '—'}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-3" />
                </>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <select value={status} onChange={e => { setStatus(e.target.value); setDirty(true); }} className={`${inputClass} mt-1`}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Version</label>
                <p className="text-sm text-gray-700 mt-1">{record.version}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Owner</label>
                <input value={owner} onChange={e => { setOwner(e.target.value); setDirty(true); }} className={`${inputClass} mt-1`} placeholder="Owner" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-700 mt-1">{new Date(record.updatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Review Date</label>
                <input type="date" value={reviewDate || ''} onChange={e => { setReviewDate(e.target.value); setDirty(true); }} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Notes</label>
                <textarea value={notes} onChange={e => { setNotes(e.target.value); setDirty(true); }} rows={3} className={`${inputClass} mt-1 resize-none`} placeholder="Notes" />
              </div>
              {isNda && (
                <div className="flex items-start gap-1.5 text-[11px] text-gray-400 border-t border-gray-100 pt-3">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <p>Structured draft only. Have qualified legal counsel review before execution.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
