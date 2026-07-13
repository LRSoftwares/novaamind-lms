import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';

const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

const EMPTY_FORM = {
  name: '', company: '', role: '', city: '', country: '',
  linkedinUrl: '', companyWebsite: '', personalWebsite: '', xUrl: '', youtubeUrl: '',
  instagramUrl: '', facebookUrl: '', githubUrl: '', mediumUrl: '', substackUrl: '',
  scholarUrl: '', orcidUrl: '', otherUrl: '',
  industry: '', email: '', phone: '', knownContext: '', aspirations: '', sourceCommunity: '', internalNotes: '',
};

function Field({ label, name, form, setForm, required, textarea }) {
  const Comp = textarea ? 'textarea' : 'input';
  return (
    <div>
      <label className={labelClass}>{label}{required && <span className="text-red-500"> *</span>}</label>
      <Comp
        rows={textarea ? 2 : undefined}
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className={inputClass}
      />
    </div>
  );
}

export default function AddProspectDrawer({ open, onClose }) {
  const { prospects, addProspect } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [forceCreate, setForceCreate] = useState(false);

  const duplicate = useMemo(() => {
    if (!form.name.trim()) return null;
    const name = form.name.trim().toLowerCase();
    const linkedin = form.linkedinUrl.trim().toLowerCase();
    const email = form.email.trim().toLowerCase();
    return prospects.find(p => {
      if (linkedin && (p.linkedinUrl || '').trim().toLowerCase() === linkedin) return true;
      if (email && (p.email || '').trim().toLowerCase() === email) return true;
      if ((p.name || '').trim().toLowerCase() === name && (p.company || '').trim().toLowerCase() === form.company.trim().toLowerCase()) return true;
      return false;
    }) || null;
  }, [prospects, form.name, form.company, form.linkedinUrl, form.email]);

  const reset = () => { setForm(EMPTY_FORM); setForceCreate(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (duplicate && !forceCreate) return;
    setSaving(true);
    const result = await addProspect({ ...form, researchStatus: 'Not Started', decisionStatus: 'Not Reviewed' });
    setSaving(false);
    if (result?.data) {
      reset();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-[slideIn_0.3s_ease]">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Add Prospect</h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Essential</h3>
            <Field label="Name" name="name" form={form} setForm={setForm} required />
            <Field label="Company" name="company" form={form} setForm={setForm} />
            <Field label="Role / Position" name="role" form={form} setForm={setForm} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" name="city" form={form} setForm={setForm} />
              <Field label="Country" name="country" form={form} setForm={setForm} />
            </div>
          </section>

          {duplicate && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Possible duplicate found</p>
                <p className="mt-0.5">{duplicate.name}{duplicate.company ? ` · ${duplicate.company}` : ''} already exists.</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { handleClose(); navigate(`/prospecting/${duplicate.id}`); }}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 font-medium hover:bg-amber-100 transition-colors"
                  >
                    Open Existing
                  </button>
                  <button
                    onClick={() => setForceCreate(true)}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 font-medium hover:bg-amber-100 transition-colors"
                  >
                    Create Anyway
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Public Profiles</h3>
            <Field label="LinkedIn URL" name="linkedinUrl" form={form} setForm={setForm} />
            <Field label="Company Website" name="companyWebsite" form={form} setForm={setForm} />
            <Field label="Personal Website" name="personalWebsite" form={form} setForm={setForm} />
            <Field label="X / Twitter URL" name="xUrl" form={form} setForm={setForm} />
            <Field label="YouTube URL" name="youtubeUrl" form={form} setForm={setForm} />
            <Field label="Instagram URL" name="instagramUrl" form={form} setForm={setForm} />
            <Field label="Facebook URL" name="facebookUrl" form={form} setForm={setForm} />
            <Field label="GitHub URL" name="githubUrl" form={form} setForm={setForm} />
            <Field label="Medium URL" name="mediumUrl" form={form} setForm={setForm} />
            <Field label="Substack URL" name="substackUrl" form={form} setForm={setForm} />
            <Field label="Google Scholar URL" name="scholarUrl" form={form} setForm={setForm} />
            <Field label="ORCID URL" name="orcidUrl" form={form} setForm={setForm} />
            <Field label="Other Public URL" name="otherUrl" form={form} setForm={setForm} />
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Optional Context</h3>
            <Field label="Industry" name="industry" form={form} setForm={setForm} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" name="email" form={form} setForm={setForm} />
              <Field label="Phone" name="phone" form={form} setForm={setForm} />
            </div>
            <Field label="Known Context" name="knownContext" form={form} setForm={setForm} textarea />
            <Field label="Aspirations / Interests" name="aspirations" form={form} setForm={setForm} textarea />
            <Field label="Source / Community" name="sourceCommunity" form={form} setForm={setForm} />
            <Field label="Internal Notes" name="internalNotes" form={form} setForm={setForm} textarea />
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || (duplicate && !forceCreate)}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Add Prospect'}
          </button>
        </div>
      </div>
    </div>
  );
}
