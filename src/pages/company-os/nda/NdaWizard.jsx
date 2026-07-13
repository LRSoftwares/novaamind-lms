import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Info } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { defaultNdaData, generateNdaContent, validateNdaData } from '../../../utils/ndaGenerator';

const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
const labelClass = 'text-xs font-medium text-gray-600';
const errorClass = 'text-xs text-red-500 mt-1';

const STEPS = ['Details', 'Review', 'Generate'];

const TERM_OPTIONS = ['1 Year', '2 Years', '3 Years', 'Custom'];
const PERIOD_OPTIONS = ['2 Years', '3 Years', '5 Years', 'Custom'];
const DISPUTE_OPTIONS = ['Courts', 'Arbitration', 'Negotiation then Arbitration', 'Custom'];

function Field({ label, error, children, helper }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {helper && <p className="text-xs text-gray-400 mt-0.5 mb-1">{helper}</p>}
      <div className="mt-1">{children}</div>
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function PartyFields({ label, party, onChange, requiredError }) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-100 p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <Field label="Legal Name" error={requiredError}>
        <input value={party.legalName} onChange={e => onChange('legalName', e.target.value)} className={inputClass} placeholder="e.g. NovaaMind Pvt Ltd" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Entity Type">
          <input value={party.entityType} onChange={e => onChange('entityType', e.target.value)} className={inputClass} placeholder="e.g. Private Limited Company" />
        </Field>
        <Field label="Country">
          <input value={party.country} onChange={e => onChange('country', e.target.value)} className={inputClass} placeholder="e.g. India" />
        </Field>
      </div>
      <Field label="Registered Address">
        <input value={party.address} onChange={e => onChange('address', e.target.value)} className={inputClass} placeholder="Registered address" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact Person (optional)">
          <input value={party.contactPerson} onChange={e => onChange('contactPerson', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email (optional)">
          <input value={party.email} onChange={e => onChange('email', e.target.value)} className={inputClass} type="email" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Signatory Name (optional)">
          <input value={party.signatoryName} onChange={e => onChange('signatoryName', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Signatory Title (optional)">
          <input value={party.signatoryTitle} onChange={e => onChange('signatoryTitle', e.target.value)} className={inputClass} />
        </Field>
      </div>
    </div>
  );
}

function AiControlField({ label, question, options, value, custom, onValueChange, onCustomChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-800">{question}</p>
      <select value={value} onChange={e => onValueChange(e.target.value)} className={inputClass}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {value === 'Custom' && (
        <input value={custom} onChange={e => onCustomChange(e.target.value)} className={inputClass} placeholder={`Describe the ${label} terms`} />
      )}
    </div>
  );
}

export default function NdaWizard() {
  const navigate = useNavigate();
  const { addLegalDocument } = useData();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(defaultNdaData());
  const [attemptedContinue, setAttemptedContinue] = useState(false);
  const [creating, setCreating] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const errors = useMemo(() => validateNdaData(data), [data]);
  const hasErrors = Object.keys(errors).length > 0;

  const setNdaType = (type) => {
    setData(d => {
      const knownDefaults = ['Mutual Non-Disclosure Agreement', 'One-Way Non-Disclosure Agreement', ''];
      const nextTitle = knownDefaults.includes(d.agreementTitle)
        ? (type === 'OneWay' ? 'One-Way Non-Disclosure Agreement' : 'Mutual Non-Disclosure Agreement')
        : d.agreementTitle;
      return { ...d, ndaType: type, agreementTitle: nextTitle };
    });
  };

  const setParty = (key, field, value) => setData(d => ({ ...d, [key]: { ...d[key], [field]: value } }));
  const setTermField = (field, value) => setData(d => ({ ...d, agreementTerm: { ...d.agreementTerm, [field]: value } }));
  const setPeriodField = (field, value) => setData(d => ({ ...d, confidentialityPeriod: { ...d.confidentialityPeriod, [field]: value } }));
  const setGov = (field, value) => setData(d => ({ ...d, governingLaw: { ...d.governingLaw, [field]: value } }));
  const setArb = (field, value) => setData(d => ({ ...d, governingLaw: { ...d.governingLaw, arbitration: { ...d.governingLaw.arbitration, [field]: value } } }));
  const setAi = (field, value) => setData(d => ({ ...d, aiControls: { ...d.aiControls, [field]: value } }));
  const setAdvanced = (field, value) => setData(d => ({ ...d, advanced: { ...d.advanced, [field]: value } }));

  const receivingLabel = data.disclosingParty === 'party1' ? 'Party 2' : 'Party 1';
  const showArbitrationFields = data.governingLaw.disputeMethod === 'Arbitration' || data.governingLaw.disputeMethod === 'Negotiation then Arbitration';

  const handleContinue = () => {
    setAttemptedContinue(true);
    if (!hasErrors) setStep(2);
  };

  const handleGenerate = async () => {
    if (hasErrors) { setStep(1); setAttemptedContinue(true); return; }
    setCreating(true);
    const content = generateNdaContent(data);
    const result = await addLegalDocument({
      title: data.agreementTitle.trim() || 'Untitled NDA',
      category: 'Agreements',
      type: 'NDA',
      content,
      structuredData: data,
    });
    setCreating(false);
    if (result?.data) navigate(`/company-os/legal/document/${result.data.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <button
        onClick={() => navigate('/company-os/legal/nda')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to NDA
      </button>

      <div className="flex items-center gap-3 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-sm font-medium ${step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <SectionCard title="Agreement Basics">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNdaType('Mutual')}
                className={`text-left p-3 rounded-lg border ${data.ndaType === 'Mutual' ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className="text-sm font-semibold text-gray-900">Mutual NDA</p>
                <p className="text-xs text-gray-400 mt-0.5">Use when both parties may disclose confidential information.</p>
              </button>
              <button
                type="button"
                onClick={() => setNdaType('OneWay')}
                className={`text-left p-3 rounded-lg border ${data.ndaType === 'OneWay' ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className="text-sm font-semibold text-gray-900">One-Way NDA</p>
                <p className="text-xs text-gray-400 mt-0.5">Use when only one party will disclose confidential information.</p>
              </button>
            </div>
            <Field label="Agreement Title">
              <input value={data.agreementTitle} onChange={e => setData(d => ({ ...d, agreementTitle: e.target.value }))} className={inputClass} placeholder="Mutual Non-Disclosure Agreement" />
            </Field>
            <Field label="Effective Date" error={attemptedContinue ? errors.effectiveDate : null}>
              <div className="flex items-center gap-2">
                <input type="date" value={data.effectiveDate} onChange={e => setData(d => ({ ...d, effectiveDate: e.target.value }))} className={inputClass} />
                <button
                  type="button"
                  onClick={() => setData(d => ({ ...d, effectiveDate: new Date().toISOString().slice(0, 10) }))}
                  className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap"
                >
                  Today
                </button>
              </div>
            </Field>
          </SectionCard>

          <SectionCard title="Party Details">
            <PartyFields label="Party 1" party={data.party1} onChange={(f, v) => setParty('party1', f, v)} requiredError={attemptedContinue ? errors.party1LegalName : null} />
            <PartyFields label="Party 2" party={data.party2} onChange={(f, v) => setParty('party2', f, v)} requiredError={attemptedContinue ? errors.party2LegalName : null} />
            {data.ndaType === 'OneWay' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Disclosing Party" error={attemptedContinue ? errors.disclosingParty : null}>
                  <select value={data.disclosingParty} onChange={e => setData(d => ({ ...d, disclosingParty: e.target.value }))} className={inputClass}>
                    <option value="party1">Party 1</option>
                    <option value="party2">Party 2</option>
                  </select>
                </Field>
                <Field label="Receiving Party">
                  <p className="text-sm text-gray-700 py-2">{receivingLabel} (derived automatically)</p>
                </Field>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Purpose">
            <Field label="Purpose of Disclosure" error={attemptedContinue ? errors.purpose : null} helper="Briefly describe why confidential information will be shared.">
              <textarea
                rows={3}
                value={data.purpose}
                onChange={e => setData(d => ({ ...d, purpose: e.target.value }))}
                className={`${inputClass} resize-none`}
                placeholder="To evaluate and discuss a potential engagement relating to AI strategy, enterprise transformation, software development, AI agents, automation, data systems, and related professional services."
              />
            </Field>
          </SectionCard>

          <SectionCard title="Confidentiality Period">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Agreement Term" error={attemptedContinue ? errors.agreementTerm : null}>
                <select value={data.agreementTerm.preset} onChange={e => setTermField('preset', e.target.value)} className={inputClass}>
                  {TERM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {data.agreementTerm.preset === 'Custom' && (
                  <input value={data.agreementTerm.custom} onChange={e => setTermField('custom', e.target.value)} className={`${inputClass} mt-2`} placeholder="e.g. 18 months" />
                )}
              </Field>
              <Field label="Confidentiality Obligation" error={attemptedContinue ? errors.confidentialityPeriod : null}>
                <select value={data.confidentialityPeriod.preset} onChange={e => setPeriodField('preset', e.target.value)} className={inputClass}>
                  {PERIOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {data.confidentialityPeriod.preset === 'Custom' && (
                  <input value={data.confidentialityPeriod.custom} onChange={e => setPeriodField('custom', e.target.value)} className={`${inputClass} mt-2`} placeholder="e.g. 7 years" />
                )}
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Governing Law">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country" error={attemptedContinue ? errors.governingLawCountry : null}>
                <input value={data.governingLaw.country} onChange={e => setGov('country', e.target.value)} className={inputClass} placeholder="e.g. India" />
              </Field>
              <Field label="State / Territory (if applicable)">
                <input value={data.governingLaw.state} onChange={e => setGov('state', e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="Courts / Jurisdiction">
              <input value={data.governingLaw.courts} onChange={e => setGov('courts', e.target.value)} className={inputClass} placeholder="e.g. Chennai, Tamil Nadu" />
            </Field>
            <Field label="Dispute Resolution Method" error={attemptedContinue ? errors.disputeMethod : null}>
              <select value={data.governingLaw.disputeMethod} onChange={e => setGov('disputeMethod', e.target.value)} className={inputClass}>
                {DISPUTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            {data.governingLaw.disputeMethod === 'Custom' && (
              <Field label="Describe the dispute resolution process" error={attemptedContinue ? errors.disputeCustom : null}>
                <textarea rows={2} value={data.governingLaw.disputeCustom} onChange={e => setGov('disputeCustom', e.target.value)} className={`${inputClass} resize-none`} />
              </Field>
            )}
            {showArbitrationFields && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Field label="Seat of Arbitration">
                  <input value={data.governingLaw.arbitration.seat} onChange={e => setArb('seat', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Venue (optional)">
                  <input value={data.governingLaw.arbitration.venue} onChange={e => setArb('venue', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Number of Arbitrators">
                  <input value={data.governingLaw.arbitration.arbitrators} onChange={e => setArb('arbitrators', e.target.value)} className={inputClass} placeholder="e.g. 1" />
                </Field>
                <Field label="Arbitration Rules (optional)">
                  <input value={data.governingLaw.arbitration.rules} onChange={e => setArb('rules', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Language">
                  <input value={data.governingLaw.arbitration.language} onChange={e => setArb('language', e.target.value)} className={inputClass} placeholder="e.g. English" />
                </Field>
              </div>
            )}
          </SectionCard>

          <SectionCard title="AI & Data Controls" subtitle="Define whether confidential information can be used with AI systems and third-party tools.">
            <AiControlField
              label="third-party AI tools"
              question="Can confidential information be entered into third-party AI tools?"
              options={['No', 'Yes, only approved tools', 'Yes, with written consent', 'Custom']}
              value={data.aiControls.thirdPartyTools}
              custom={data.aiControls.thirdPartyCustom}
              onValueChange={v => setAi('thirdPartyTools', v)}
              onCustomChange={v => setAi('thirdPartyCustom', v)}
            />
            <AiControlField
              label="model training"
              question="Can confidential information be used to train or improve AI models?"
              options={['No', 'Yes, with written consent', 'Custom']}
              value={data.aiControls.modelTraining}
              custom={data.aiControls.modelTrainingCustom}
              onValueChange={v => setAi('modelTraining', v)}
              onCustomChange={v => setAi('modelTrainingCustom', v)}
            />
            <AiControlField
              label="prompts and logs"
              question="Can confidential information be retained in prompts, logs, chat history, telemetry, or similar records?"
              options={['No', 'Only where technically necessary and protected', 'Yes, with written consent', 'Custom']}
              value={data.aiControls.promptsLogs}
              custom={data.aiControls.promptsLogsCustom}
              onValueChange={v => setAi('promptsLogs', v)}
              onCustomChange={v => setAi('promptsLogsCustom', v)}
            />
            <AiControlField
              label="subcontractors"
              question="Can confidential information be shared with subcontractors or external specialists?"
              options={['No', 'Yes, on a need-to-know basis under equivalent confidentiality obligations', 'Yes, with written consent', 'Custom']}
              value={data.aiControls.subcontractors}
              custom={data.aiControls.subcontractorsCustom}
              onValueChange={v => setAi('subcontractors', v)}
              onCustomChange={v => setAi('subcontractorsCustom', v)}
            />
            <AiControlField
              label="AI output exposure"
              question="Must reasonable safeguards be used to prevent confidential information from appearing in AI-generated outputs?"
              options={['Yes', 'Custom']}
              value={data.aiControls.outputExposure}
              custom={data.aiControls.outputExposureCustom}
              onValueChange={v => setAi('outputExposure', v)}
              onCustomChange={v => setAi('outputExposureCustom', v)}
            />
          </SectionCard>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvancedOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900"
            >
              Advanced Options
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </button>
            {advancedOpen && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                <Field label="Permitted Representatives"><input value={data.advanced.permittedRepresentatives} onChange={e => setAdvanced('permittedRepresentatives', e.target.value)} className={inputClass} /></Field>
                <Field label="Affiliate Disclosure"><input value={data.advanced.affiliateDisclosure} onChange={e => setAdvanced('affiliateDisclosure', e.target.value)} className={inputClass} /></Field>
                <Field label="Subcontractor Access"><input value={data.advanced.subcontractorAccess} onChange={e => setAdvanced('subcontractorAccess', e.target.value)} className={inputClass} /></Field>
                <Field label="Return or Deletion Period"><input value={data.advanced.returnDeletionPeriod} onChange={e => setAdvanced('returnDeletionPeriod', e.target.value)} className={inputClass} placeholder="e.g. 30 days" /></Field>
                <Field label="Residual Knowledge"><input value={data.advanced.residualKnowledge} onChange={e => setAdvanced('residualKnowledge', e.target.value)} className={inputClass} /></Field>
                <Field label="Trade Secret Treatment"><input value={data.advanced.tradeSecretTreatment} onChange={e => setAdvanced('tradeSecretTreatment', e.target.value)} className={inputClass} /></Field>
                <Field label="Compelled Disclosure Process"><input value={data.advanced.compelledDisclosureProcess} onChange={e => setAdvanced('compelledDisclosureProcess', e.target.value)} className={inputClass} /></Field>
                <Field label="Injunctive Relief Preference"><input value={data.advanced.injunctiveReliefPreference} onChange={e => setAdvanced('injunctiveReliefPreference', e.target.value)} className={inputClass} /></Field>
                <Field label="Notice Details"><input value={data.advanced.noticeDetails} onChange={e => setAdvanced('noticeDetails', e.target.value)} className={inputClass} /></Field>
                <Field label="Custom Clauses"><textarea rows={2} value={data.advanced.customClauses} onChange={e => setAdvanced('customClauses', e.target.value)} className={`${inputClass} resize-none`} /></Field>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={handleContinue} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <ReviewStep
          data={data}
          onBack={() => setStep(1)}
          onGenerate={handleGenerate}
          creating={creating}
        />
      )}
    </div>
  );
}

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function resolveTermLabel(obj) {
  return obj.preset === 'Custom' ? (obj.custom || '—') : obj.preset;
}

function ReviewStep({ data, onBack, onGenerate, creating }) {
  const isOneWay = data.ndaType === 'OneWay';
  const hasAdvanced = Object.values(data.advanced).some(v => v.trim());

  return (
    <div className="space-y-5">
      <SectionCard title="Review before generating">
        <SummaryRow label="NDA Type" value={isOneWay ? 'One-Way NDA' : 'Mutual NDA'} />
        <SummaryRow label="Agreement Title" value={data.agreementTitle} />
        <SummaryRow label="Effective Date" value={data.effectiveDate} />
      </SectionCard>

      <SectionCard title="Party 1">
        <SummaryRow label="Legal Name" value={data.party1.legalName} />
        <SummaryRow label="Entity Type" value={data.party1.entityType} />
        <SummaryRow label="Address" value={data.party1.address} />
        <SummaryRow label="Country" value={data.party1.country} />
      </SectionCard>

      <SectionCard title="Party 2">
        <SummaryRow label="Legal Name" value={data.party2.legalName} />
        <SummaryRow label="Entity Type" value={data.party2.entityType} />
        <SummaryRow label="Address" value={data.party2.address} />
        <SummaryRow label="Country" value={data.party2.country} />
      </SectionCard>

      {isOneWay && (
        <SectionCard title="Disclosure Direction">
          <SummaryRow label="Disclosing Party" value={data.disclosingParty === 'party1' ? 'Party 1' : 'Party 2'} />
          <SummaryRow label="Receiving Party" value={data.disclosingParty === 'party1' ? 'Party 2' : 'Party 1'} />
        </SectionCard>
      )}

      <SectionCard title="Purpose">
        <p className="text-sm text-gray-700">{data.purpose}</p>
      </SectionCard>

      <SectionCard title="Term & Governing Law">
        <SummaryRow label="Agreement Term" value={resolveTermLabel(data.agreementTerm)} />
        <SummaryRow label="Confidentiality Obligation" value={resolveTermLabel(data.confidentialityPeriod)} />
        <SummaryRow label="Governing Country" value={data.governingLaw.country} />
        <SummaryRow label="State / Territory" value={data.governingLaw.state} />
        <SummaryRow label="Courts / Jurisdiction" value={data.governingLaw.courts} />
        <SummaryRow label="Dispute Resolution" value={data.governingLaw.disputeMethod === 'Custom' ? data.governingLaw.disputeCustom : data.governingLaw.disputeMethod} />
      </SectionCard>

      <SectionCard title="AI & Data Controls">
        <SummaryRow label="Third-Party AI Tools" value={data.aiControls.thirdPartyTools === 'Custom' ? data.aiControls.thirdPartyCustom : data.aiControls.thirdPartyTools} />
        <SummaryRow label="Model Training" value={data.aiControls.modelTraining === 'Custom' ? data.aiControls.modelTrainingCustom : data.aiControls.modelTraining} />
        <SummaryRow label="Prompts and Logs" value={data.aiControls.promptsLogs === 'Custom' ? data.aiControls.promptsLogsCustom : data.aiControls.promptsLogs} />
        <SummaryRow label="Subcontractors" value={data.aiControls.subcontractors === 'Custom' ? data.aiControls.subcontractorsCustom : data.aiControls.subcontractors} />
        <SummaryRow label="AI Output Exposure" value={data.aiControls.outputExposure === 'Custom' ? data.aiControls.outputExposureCustom : data.aiControls.outputExposure} />
      </SectionCard>

      {hasAdvanced && (
        <SectionCard title="Advanced Options">
          <SummaryRow label="Permitted Representatives" value={data.advanced.permittedRepresentatives} />
          <SummaryRow label="Affiliate Disclosure" value={data.advanced.affiliateDisclosure} />
          <SummaryRow label="Subcontractor Access" value={data.advanced.subcontractorAccess} />
          <SummaryRow label="Return or Deletion Period" value={data.advanced.returnDeletionPeriod} />
          <SummaryRow label="Residual Knowledge" value={data.advanced.residualKnowledge} />
          <SummaryRow label="Trade Secret Treatment" value={data.advanced.tradeSecretTreatment} />
          <SummaryRow label="Compelled Disclosure Process" value={data.advanced.compelledDisclosureProcess} />
          <SummaryRow label="Injunctive Relief Preference" value={data.advanced.injunctiveReliefPreference} />
          <SummaryRow label="Notice Details" value={data.advanced.noticeDetails} />
          <SummaryRow label="Custom Clauses" value={data.advanced.customClauses} />
        </SectionCard>
      )}

      <div className="flex items-start gap-2 text-xs text-gray-400 px-1">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>This tool generates a structured draft based on the information provided. Review by qualified legal counsel is recommended before execution.</p>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          Back to Edit
        </button>
        <button
          onClick={onGenerate}
          disabled={creating}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {creating ? 'Generating...' : 'Generate NDA'}
        </button>
      </div>
    </div>
  );
}
