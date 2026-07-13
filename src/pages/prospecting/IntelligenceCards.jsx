import { ExternalLink } from 'lucide-react';
import { DECISION_STATUS_COLORS, CONFIDENCE_COLORS } from './statusStyles';

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 text-sm py-1">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  );
}

function RatingBadge({ rating }) {
  const colors = { High: 'bg-emerald-50 text-emerald-600', Medium: 'bg-amber-50 text-amber-600', Low: 'bg-red-50 text-red-600' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${colors[rating] || 'bg-gray-100 text-gray-500'}`}>{rating || 'Not stated'}</span>;
}

export default function IntelligenceCards({ prospect }) {
  const research = prospect.research;
  if (!research) return null;

  const { snapshot = {}, personSignals = {}, companySnapshot = {}, academyFit = {}, strategyFit = {}, recommendation = {}, opportunities = [], risks = [], evidenceRegister = [], sources = [] } = research;

  return (
    <div className="space-y-4">
      {research.needsReview && (
        <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          Needs Review — some key fields (name, recommendation or confidence) could not be parsed with confidence. Check the raw research file.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Prospect">
          <Row label="Name" value={snapshot.name || prospect.name} />
          <Row label="Role" value={snapshot.role || prospect.role} />
          <Row label="Company" value={snapshot.company || prospect.company} />
          <Row label="Location" value={snapshot.location || [prospect.city, prospect.country].filter(Boolean).join(', ')} />
          <Row label="Industry" value={snapshot.industry || prospect.industry} />
          <Row label="Identity Match" value={snapshot.identityMatch} />
          {snapshot.professionalSummary && <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">{snapshot.professionalSummary}</p>}
        </Card>

        <Card title="Person Signals">
          <Row label="Decision Authority" value={personSignals.decisionAuthority} />
          <Row label="Leadership Seniority" value={personSignals.leadershipSeniority} />
          <Row label="Founder Status" value={personSignals.founderStatus} />
          <Row label="Learning Orientation" value={personSignals.learningOrientation} />
          <Row label="AI Interest" value={personSignals.aiInterest} />
          <Row label="Transformation Interest" value={personSignals.transformationInterest} />
        </Card>

        <Card title="Company Signals">
          <Row label="Business Model" value={companySnapshot.businessModel} />
          <Row label="Approximate Scale" value={companySnapshot.approximateScale} />
          <Row label="Growth Signals" value={companySnapshot.growthSignals} />
          <Row label="Technology Signals" value={companySnapshot.technologySignals} />
          <Row label="AI Signals" value={companySnapshot.aiSignals} />
          <Row label="Operational Complexity" value={companySnapshot.operationalComplexity} />
          <Row label="Transformation Signals" value={companySnapshot.transformationSignals} />
        </Card>

        <Card title="Academy Fit">
          <div className="mb-2"><RatingBadge rating={academyFit.rating} /></div>
          <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
            {(academyFit.reasons || []).slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Card>

        <Card title="Strategy Fit">
          <div className="mb-2"><RatingBadge rating={strategyFit.rating} /></div>
          <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
            {(strategyFit.reasons || []).slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Card>

        <Card title="Recommendation" className="md:col-span-2 bg-blue-50/40 border-blue-100">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm font-bold px-3 py-1 rounded-lg ${DECISION_STATUS_COLORS[recommendation.recommendation] || 'bg-gray-100 text-gray-600'}`}>
              {recommendation.recommendation || 'Not Enough Evidence'}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${CONFIDENCE_COLORS[recommendation.confidence] || 'bg-gray-100 text-gray-500'}`}>
              Confidence: {recommendation.confidence || 'Not stated'}
            </span>
          </div>
          {recommendation.reasoning && <p className="text-sm text-gray-700 mt-3">{recommendation.reasoning}</p>}
        </Card>

        <Card title="Key Opportunities">
          <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
            {opportunities.slice(0, 3).map((o, i) => <li key={i}>{o}</li>)}
            {opportunities.length === 0 && <li className="list-none text-gray-400">None identified</li>}
          </ul>
        </Card>

        <Card title="Risks / Gaps">
          <ul className="list-disc pl-4 space-y-1 text-sm text-gray-700">
            {risks.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
            {risks.length === 0 && <li className="list-none text-gray-400">None identified</li>}
          </ul>
        </Card>
      </div>

      <Card title={`Evidence (${evidenceRegister.length})`}>
        {evidenceRegister.length === 0 ? (
          <p className="text-sm text-gray-400">No evidence items parsed.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {evidenceRegister.map((ev, i) => (
              <div key={i} className="text-sm border-b border-gray-100 pb-3 last:border-0">
                <p className="text-gray-900">{ev.evidence}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {ev.sourceName && <span>{ev.sourceName}</span>}
                  {ev.sourceUrl && (
                    <a href={ev.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-blue-600 hover:underline">
                      Open Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {ev.whyItMatters && <p className="text-xs text-gray-500 mt-1">Why it matters: {ev.whyItMatters}</p>}
              </div>
            ))}
          </div>
        )}
        {sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Sources</p>
            <ul className="space-y-1">
              {sources.map((s, i) => (
                <li key={i}>
                  <a href={s} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all">{s}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
