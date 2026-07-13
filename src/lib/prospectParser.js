// Parses the structured Markdown research file returned by an external LLM
// (see lib/prospectPrompt.js for the required output format) into the
// prospect.research jsonb shape consumed by IntelligenceCards.
// If a field is missing it is left blank -- never invented. Low-confidence
// parses are flagged with needsReview so the UI can surface "Needs Review".

function splitSections(md) {
  // Split on top-level "## N. Title" headings, keeping the heading number as key.
  const re = /^##\s*(\d+)\.\s*(.+)$/gm;
  const matches = [...md.matchAll(re)];
  const sections = {};
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : md.length;
    sections[Number(matches[i][1])] = md.slice(start, end).trim();
  }
  return sections;
}

function extractFields(body) {
  // Grabs **Label:** value pairs; value runs until the next **Label:** or a heading.
  const re = /\*\*([^*:]+):\*\*[ \t]*([\s\S]*?)(?=\n\s*\*\*[^*:]+:\*\*|\n#{1,3}\s|\n---|$)/g;
  const fields = {};
  let match;
  while ((match = re.exec(body))) {
    const label = match[1].trim();
    const value = match[2].trim().replace(/^\n+/, '');
    fields[label] = value;
  }
  return fields;
}

function fieldsToCamel(fields, map) {
  const out = {};
  for (const [label, key] of Object.entries(map)) {
    out[key] = fields[label] || '';
  }
  return out;
}

function extractReasons(fields, prefix, max = 3) {
  const reasons = [];
  for (let i = 1; i <= max; i++) {
    const val = fields[`${prefix} ${i}`];
    if (val) reasons.push(val);
  }
  return reasons;
}

function extractEvidenceItems(body) {
  const blocks = body.split(/###\s*Evidence Item/i).slice(1);
  return blocks.map(block => {
    const f = extractFields(block);
    return {
      evidence: f['Evidence'] || '',
      sourceName: f['Source Name'] || '',
      sourceUrl: f['Source URL'] || '',
      publishedDate: f['Published Date'] || '',
      dateChecked: f['Date Checked'] || '',
      whyItMatters: f['Why It Matters'] || '',
    };
  }).filter(item => item.evidence || item.sourceUrl);
}

function extractSources(body) {
  const urlRe = /(https?:\/\/[^\s)>\]]+)/g;
  return [...new Set((body.match(urlRe) || []))];
}

export function parseResearchMarkdown(markdown) {
  const md = (markdown || '').replace(/\r\n/g, '\n');
  const sections = splitSections(md);

  const snapshotFields = extractFields(sections[1] || '');
  const snapshot = {
    ...fieldsToCamel(snapshotFields, {
      Name: 'name', 'Current Role': 'role', Company: 'company', Location: 'location',
      Industry: 'industry', 'Identity Match': 'identityMatch',
    }),
    professionalSummary: snapshotFields['Professional Summary'] || '',
  };

  const personFields = extractFields(sections[2] || '');
  const personSignals = fieldsToCamel(personFields, {
    'Decision Authority': 'decisionAuthority', 'Leadership Seniority': 'leadershipSeniority',
    'Founder Status': 'founderStatus', 'Career Background': 'careerBackground',
    Education: 'education', 'Board Roles': 'boardRoles', 'Community Affiliations': 'communityAffiliations',
    'Public Thought Leadership': 'publicThoughtLeadership', 'Learning Orientation': 'learningOrientation',
    'AI Interest': 'aiInterest', 'Technology Interest': 'technologyInterest', 'Transformation Interest': 'transformationInterest',
  });

  const companyFields = extractFields(sections[3] || '');
  const companySnapshot = fieldsToCamel(companyFields, {
    Company: 'company', Industry: 'industry', 'Business Model': 'businessModel',
    'Approximate Scale': 'approximateScale', 'Geographic Presence': 'geographicPresence',
    'Growth Signals': 'growthSignals', 'Technology Signals': 'technologySignals', 'AI Signals': 'aiSignals',
    'Transformation Signals': 'transformationSignals', 'Operational Complexity': 'operationalComplexity',
    'Strategic Initiatives': 'strategicInitiatives',
  });

  const academyFields = extractFields(sections[4] || '');
  const academyFit = {
    rating: academyFields['Rating'] || '',
    reasons: extractReasons(academyFields, 'Reason'),
    supportingEvidence: academyFields['Supporting Evidence'] || '',
  };

  const strategyFields = extractFields(sections[5] || '');
  const strategyFit = {
    rating: strategyFields['Rating'] || '',
    reasons: extractReasons(strategyFields, 'Reason'),
    supportingEvidence: strategyFields['Supporting Evidence'] || '',
  };

  const recFields = extractFields(sections[6] || '');
  const recommendation = {
    recommendation: recFields['Recommendation'] || '',
    confidence: recFields['Confidence'] || '',
    reasoning: recFields['Reasoning'] || '',
  };

  const oppFields = extractFields(sections[7] || '');
  const opportunities = extractReasons(oppFields, 'Opportunity');

  const riskFields = extractFields(sections[8] || '');
  const risks = extractReasons(riskFields, 'Gap');

  const evidenceRegister = extractEvidenceItems(sections[9] || '');
  const sources = extractSources(sections[10] || '');

  const needsReview = !snapshot.name || !recommendation.recommendation || !recommendation.confidence;

  return {
    snapshot,
    personSignals,
    companySnapshot,
    academyFit,
    strategyFit,
    recommendation,
    opportunities,
    risks,
    evidenceRegister,
    sources,
    needsReview,
    rawMarkdown: md,
    parsedAt: new Date().toISOString(),
  };
}
