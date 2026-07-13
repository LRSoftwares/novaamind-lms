import { useRef, useState } from 'react';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import Modal from '../../components/Modal';
import { useData } from '../../context/DataContext';
import { parseResearchMarkdown } from '../../lib/prospectParser';

export default function UploadResearchModal({ open, onClose, prospect }) {
  const { updateProspect } = useData();
  const fileRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setParsed(null); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    if (!file.name.toLowerCase().endsWith('.md')) {
      setError('Phase 1 only accepts .md research files.');
      e.target.value = '';
      return;
    }
    try {
      const text = await file.text();
      setParsed(parseResearchMarkdown(text));
    } catch (err) {
      console.error('[LMS] Research file parse error:', err);
      setError('Could not read this file.');
    }
    e.target.value = '';
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setSaving(true);
    const result = await updateProspect(prospect.id, {
      research: parsed,
      researchStatus: parsed.needsReview ? 'Needs Review' : 'Uploaded',
    });
    setSaving(false);
    if (!result.error) handleClose();
  };

  const nameMismatch = parsed?.snapshot?.name && prospect?.name &&
    !parsed.snapshot.name.toLowerCase().includes(prospect.name.toLowerCase().split(' ')[0]);

  return (
    <Modal open={open} onClose={handleClose} title="Upload Research File" wide={!!parsed}>
      {!parsed ? (
        <div className="space-y-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
          >
            <UploadCloud className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Click to choose the .md research file</span>
            <span className="text-xs text-gray-400">Returned by the external LLM you researched this prospect with</span>
          </button>
          <input ref={fileRef} type="file" accept=".md" onChange={handleFile} className="hidden" />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {parsed.needsReview && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Needs Review — name, recommendation or confidence could not be parsed confidently from this file. You can still import and review the raw text.</p>
            </div>
          )}
          {nameMismatch && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>The name in this research file ("{parsed.snapshot.name}") doesn't clearly match this prospect ("{prospect.name}"). Verify identity before importing.</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview</h3>
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
              <div className="px-4 py-2.5 flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-900">{parsed.snapshot.name || '—'}</span></div>
              <div className="px-4 py-2.5 flex justify-between"><span className="text-gray-500">Identity Match</span><span className="text-gray-900">{parsed.snapshot.identityMatch || '—'}</span></div>
              <div className="px-4 py-2.5 flex justify-between"><span className="text-gray-500">Recommendation</span><span className="text-gray-900">{parsed.recommendation.recommendation || '—'}</span></div>
              <div className="px-4 py-2.5 flex justify-between"><span className="text-gray-500">Confidence</span><span className="text-gray-900">{parsed.recommendation.confidence || '—'}</span></div>
              <div className="px-4 py-2.5 flex justify-between"><span className="text-gray-500">Academy Fit</span><span className="text-gray-900">{parsed.academyFit.rating || '—'}</span></div>
              <div className="px-4 py-2.5 flex justify-between"><span className="text-gray-500">Strategy Fit</span><span className="text-gray-900">{parsed.strategyFit.rating || '—'}</span></div>
              <div className="px-4 py-2.5 flex justify-between"><span className="text-gray-500">Evidence Items</span><span className="text-gray-900">{parsed.evidenceRegister.length}</span></div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between pt-2">
            <button onClick={reset} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              Choose Different File
            </button>
            <div className="flex gap-2">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
