import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Search, UploadCloud, ExternalLink } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { RESEARCH_STATUS_COLORS, DECISION_STATUS_COLORS } from './statusStyles';
import ResearchPromptPanel from './ResearchPromptPanel';
import UploadResearchModal from './UploadResearchModal';
import IntelligenceCards from './IntelligenceCards';
import DecisionPanel from './DecisionPanel';

const PROFILE_LINKS = [
  ['linkedinUrl', 'LinkedIn'], ['companyWebsite', 'Company Website'], ['personalWebsite', 'Personal Website'],
  ['xUrl', 'X / Twitter'], ['youtubeUrl', 'YouTube'], ['instagramUrl', 'Instagram'], ['facebookUrl', 'Facebook'],
  ['githubUrl', 'GitHub'], ['mediumUrl', 'Medium'], ['substackUrl', 'Substack'], ['scholarUrl', 'Google Scholar'],
  ['orcidUrl', 'ORCID'], ['otherUrl', 'Other'],
];

export default function ProspectDetail() {
  const { id } = useParams();
  const { prospects, updateProspect } = useData();
  const [showPrompt, setShowPrompt] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const prospect = prospects.find(p => p.id === id);

  if (!prospect) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link to="/prospecting" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Prospecting
        </Link>
        <p className="text-sm text-gray-400">Prospect not found.</p>
      </div>
    );
  }

  const links = PROFILE_LINKS.filter(([key]) => prospect[key]);

  const handleResearch = async () => {
    if (prospect.researchStatus === 'Not Started') {
      await updateProspect(prospect.id, { researchStatus: 'Prompt Generated' });
    }
    setShowPrompt(true);
  };

  const handleMarkSent = async () => {
    await updateProspect(prospect.id, { researchStatus: 'Sent for Research' });
  };

  const handleSaveDecision = async (decision, notes) => {
    await updateProspect(prospect.id, {
      decisionStatus: decision,
      decisionNotes: notes,
      researchStatus: 'Reviewed',
      decidedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Link to="/prospecting" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="w-4 h-4" /> Back to Prospecting
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{prospect.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {[prospect.role, prospect.company, [prospect.city, prospect.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${RESEARCH_STATUS_COLORS[prospect.researchStatus] || RESEARCH_STATUS_COLORS['Not Started']}`}>
              {prospect.researchStatus || 'Not Started'}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${DECISION_STATUS_COLORS[prospect.decisionStatus] || DECISION_STATUS_COLORS['Not Reviewed']}`}>
              {prospect.decisionStatus || 'Not Reviewed'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UploadCloud className="w-4 h-4" /> Upload Research File
          </button>
          <button
            onClick={handleResearch}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="w-4 h-4" /> Research
          </button>
        </div>
      </div>

      {(links.length > 0 || prospect.knownContext || prospect.aspirations || prospect.industry) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Context</h3>
          {prospect.industry && <p className="text-sm text-gray-700 mb-1"><span className="text-gray-500">Industry:</span> {prospect.industry}</p>}
          {prospect.knownContext && <p className="text-sm text-gray-700 mb-1"><span className="text-gray-500">Known Context:</span> {prospect.knownContext}</p>}
          {prospect.aspirations && <p className="text-sm text-gray-700 mb-3"><span className="text-gray-500">Aspirations:</span> {prospect.aspirations}</p>}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map(([key, label]) => (
                <a
                  key={key}
                  href={prospect[key]}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {showPrompt && !prospect.research && (
        <ResearchPromptPanel prospect={prospect} onMarkSent={handleMarkSent} />
      )}

      {!showPrompt && !prospect.research && prospect.researchStatus !== 'Not Started' && (
        <button onClick={() => setShowPrompt(true)} className="text-sm text-blue-600 hover:underline">
          View Generated Research Prompt
        </button>
      )}

      {prospect.research && (
        <>
          <IntelligenceCards prospect={prospect} />
          <button onClick={() => setShowPrompt(s => !s)} className="text-sm text-blue-600 hover:underline">
            {showPrompt ? 'Hide' : 'View'} Research Prompt
          </button>
          {showPrompt && <ResearchPromptPanel prospect={prospect} onMarkSent={handleMarkSent} />}
          <DecisionPanel prospect={prospect} onSave={handleSaveDecision} />
        </>
      )}

      <UploadResearchModal open={uploadOpen} onClose={() => setUploadOpen(false)} prospect={prospect} />
    </div>
  );
}
