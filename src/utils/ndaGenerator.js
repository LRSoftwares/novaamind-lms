// Builds the TipTap-compatible document JSON for a generated NDA, and holds
// the wizard's default/blank data shape. Every clause is derived only from
// what the user entered — no dates, addresses, governing law, or signatory
// facts are invented. Missing facts render as a bracketed placeholder and
// are wrapped in the editor's yellow highlight mark, so gaps that still
// need to be filled in stay visible for review inside the generated draft.

const PLACEHOLDER = (label) => `[${label} not provided]`;

export function blankParty() {
  return { legalName: '', entityType: '', address: '', country: '', contactPerson: '', email: '', signatoryName: '', signatoryTitle: '' };
}

export function defaultNdaData() {
  return {
    ndaType: 'Mutual',
    agreementTitle: 'Mutual Non-Disclosure Agreement',
    effectiveDate: '',
    party1: blankParty(),
    party2: blankParty(),
    disclosingParty: 'party1',
    purpose: '',
    agreementTerm: { preset: '1 Year', custom: '' },
    confidentialityPeriod: { preset: '3 Years', custom: '' },
    governingLaw: {
      country: '',
      state: '',
      courts: '',
      disputeMethod: 'Courts',
      disputeCustom: '',
      arbitration: { seat: '', venue: '', arbitrators: '', rules: '', language: '' },
    },
    aiControls: {
      thirdPartyTools: 'No',
      thirdPartyCustom: '',
      modelTraining: 'No',
      modelTrainingCustom: '',
      promptsLogs: 'No',
      promptsLogsCustom: '',
      subcontractors: 'Yes, on a need-to-know basis under equivalent confidentiality obligations',
      subcontractorsCustom: '',
      outputExposure: 'Yes',
      outputExposureCustom: '',
    },
    advanced: {
      permittedRepresentatives: '',
      affiliateDisclosure: '',
      subcontractorAccess: '',
      returnDeletionPeriod: '',
      residualKnowledge: '',
      tradeSecretTreatment: '',
      compelledDisclosureProcess: '',
      injunctiveReliefPreference: '',
      noticeDetails: '',
      customClauses: '',
    },
  };
}

// ---- validation ----

export function validateNdaData(data) {
  const errors = {};
  if (!data.effectiveDate) errors.effectiveDate = "Add the date this agreement starts.";
  if (!data.party1.legalName.trim()) errors.party1LegalName = "Add Party 1's legal name.";
  if (!data.party2.legalName.trim()) errors.party2LegalName = "Add Party 2's legal name.";
  if (!data.purpose.trim()) errors.purpose = "Describe why confidential information will be shared.";
  if (data.agreementTerm.preset === 'Custom' && !data.agreementTerm.custom.trim()) errors.agreementTerm = "Enter the custom agreement term.";
  if (data.confidentialityPeriod.preset === 'Custom' && !data.confidentialityPeriod.custom.trim()) errors.confidentialityPeriod = "Enter the custom confidentiality period.";
  if (!data.governingLaw.country.trim()) errors.governingLawCountry = "Add the governing country.";
  if (!data.governingLaw.disputeMethod) errors.disputeMethod = "Choose how disputes will be resolved.";
  if (data.governingLaw.disputeMethod === 'Custom' && !data.governingLaw.disputeCustom.trim()) errors.disputeCustom = "Describe the custom dispute process.";
  if (data.ndaType === 'OneWay' && !data.disclosingParty) errors.disclosingParty = "Choose which party is disclosing information.";
  return errors;
}

// ---- small TipTap node builders ----
// `hi()` marks a run with the editor's existing yellow `highlight` mark
// (see RichTextEditor's Highlight extension) so gaps and to-be-signed
// blanks stand out for review inside the generated draft.

const textRun = (t) => ({ type: 'text', text: t });
const hi = (t) => ({ type: 'text', text: t, marks: [{ type: 'highlight' }] });
const h1 = (t) => ({ type: 'heading', attrs: { level: 1 }, content: [textRun(t)] });
const h2 = (t) => ({ type: 'heading', attrs: { level: 2 }, content: [textRun(t)] });

// Accepts a plain string, or an array of run nodes for mixed plain/highlighted text.
function p(content) {
  if (typeof content === 'string') return { type: 'paragraph', content: content ? [textRun(content)] : undefined };
  return { type: 'paragraph', content };
}

// Accepts items that are either a plain string or an array of run nodes.
function bulletList(items) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: typeof item === 'string' ? [textRun(item)] : item }],
    })),
  };
}

// A run for a value that might be missing. Missing values render as a
// highlighted bracketed placeholder instead of being invented.
function field(value, label) {
  const v = (value || '').trim();
  return v ? textRun(v) : hi(PLACEHOLDER(label));
}

function resolvePresetRun(obj, label) {
  return obj.preset === 'Custom' ? field(obj.custom, label) : textRun(obj.preset);
}

function partyLineRuns(label, party) {
  return [
    textRun(`${label}: `),
    field(party.legalName, 'legal name'),
    textRun(', a '),
    field(party.entityType, 'entity type'),
    textRun(', having its registered address at '),
    field(party.address, 'registered address'),
    textRun(', '),
    field(party.country, 'country'),
    textRun('.'),
  ];
}

const THIRD_PARTY_TEXT = {
  'No': 'Confidential Information must not be entered into any third-party AI tool or service.',
  'Yes, only approved tools': 'Confidential Information may be entered only into third-party AI tools that have been specifically approved in writing by the Disclosing Party.',
  'Yes, with written consent': "Confidential Information may be entered into third-party AI tools only with the Disclosing Party's prior written consent.",
};

const MODEL_TRAINING_TEXT = {
  'No': 'Confidential Information must not be used to train, fine-tune, evaluate, or otherwise improve any AI model.',
  'Yes, with written consent': "Confidential Information may be used to train, fine-tune, evaluate, or improve AI models only with the Disclosing Party's prior written consent.",
};

const PROMPTS_LOGS_TEXT = {
  'No': 'Confidential Information must not be retained in prompts, logs, chat history, telemetry, or similar records.',
  'Only where technically necessary and protected': 'Confidential Information may be retained in prompts, logs, chat history, telemetry, or similar records only where technically necessary, and must be protected with access controls commensurate with its sensitivity.',
  'Yes, with written consent': "Confidential Information may be retained in prompts, logs, chat history, telemetry, or similar records only with the Disclosing Party's prior written consent.",
};

const SUBCONTRACTORS_TEXT = {
  'No': 'Confidential Information must not be shared with subcontractors or external specialists.',
  'Yes, on a need-to-know basis under equivalent confidentiality obligations': 'Confidential Information may be shared with subcontractors or external specialists strictly on a need-to-know basis, and only where those parties are bound by confidentiality obligations equivalent to those in this Agreement.',
  'Yes, with written consent': "Confidential Information may be shared with subcontractors or external specialists only with the Disclosing Party's prior written consent.",
};

const OUTPUT_EXPOSURE_TEXT = {
  'Yes': 'Reasonable safeguards must be implemented to prevent Confidential Information from appearing in AI-generated outputs.',
};

// Returns a run array: `${prefixLabel}: ` followed by the resolved clause text.
// A "Custom" selection left blank renders as a highlighted placeholder.
function aiControlRuns(prefixLabel, map, value, custom) {
  const prefix = textRun(`${prefixLabel}: `);
  if (value === 'Custom') return [prefix, field(custom, 'custom AI control terms')];
  return [prefix, textRun(map[value] || PLACEHOLDER('AI control terms'))];
}

function arbitrationBullets(arbitration) {
  return [
    [textRun('Seat of Arbitration: '), field(arbitration.seat, 'seat of arbitration')],
    [textRun('Venue: '), textRun(arbitration.venue.trim() || 'Same as the seat of arbitration')],
    [textRun('Number of Arbitrators: '), field(arbitration.arbitrators, 'number of arbitrators')],
    [textRun('Arbitration Rules: '), textRun(arbitration.rules.trim() || 'To be agreed by the parties at the time of the dispute')],
    [textRun('Language: '), field(arbitration.language, 'language of arbitration')],
  ];
}

function disputeResolutionParagraphs(gov) {
  const { disputeMethod, arbitration, courts, country } = gov;
  switch (disputeMethod) {
    case 'Courts': {
      const courtsRun = courts.trim() ? textRun(courts.trim()) : field(country, 'jurisdiction');
      return [p([textRun('Any dispute arising out of or relating to this Agreement shall be submitted to the exclusive jurisdiction of the courts of '), courtsRun, textRun('.')])];
    }
    case 'Arbitration':
      return [
        p('Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration.'),
        bulletList(arbitrationBullets(arbitration)),
      ];
    case 'Negotiation then Arbitration':
      return [
        p('The parties shall first attempt in good faith to resolve any dispute through direct negotiation between senior representatives. If the dispute is not resolved within a reasonable period, it shall be referred to binding arbitration.'),
        bulletList(arbitrationBullets(arbitration)),
      ];
    default:
      return [p([field(gov.disputeCustom, 'custom dispute resolution process')])];
  }
}

export function generateNdaContent(data) {
  const isOneWay = data.ndaType === 'OneWay';
  const disclosing = isOneWay ? data[data.disclosingParty] : null;
  const receiving = isOneWay ? data[data.disclosingParty === 'party1' ? 'party2' : 'party1'] : null;
  const disclosingLabel = data.disclosingParty === 'party1' ? 'Party 1' : 'Party 2';
  const receivingLabel = data.disclosingParty === 'party1' ? 'Party 2' : 'Party 1';

  const content = [];

  content.push(h1(data.agreementTitle.trim() || (isOneWay ? 'ONE-WAY NON-DISCLOSURE AGREEMENT' : 'MUTUAL NON-DISCLOSURE AGREEMENT')));

  content.push(p([textRun('Effective Date: '), field(data.effectiveDate, 'effective date')]));

  content.push(h2('Parties'));
  if (isOneWay) {
    content.push(p(partyLineRuns(`Disclosing Party (${disclosingLabel})`, disclosing)));
    content.push(p(partyLineRuns(`Receiving Party (${receivingLabel})`, receiving)));
  } else {
    content.push(p(partyLineRuns('Party 1', data.party1)));
    content.push(p(partyLineRuns('Party 2', data.party2)));
  }

  content.push(h2('1. Purpose'));
  content.push(p([field(data.purpose, 'purpose of disclosure')]));

  content.push(h2('2. Definition of Confidential Information'));
  content.push(p('"Confidential Information" means any non-public business, commercial, financial, or technical information disclosed by one party to the other, in any form, including but not limited to product plans, software, source code, architecture, data, datasets, models, prompts, workflows, AI agents, algorithms, research, strategies, customer information, pricing, proposals, methodologies, frameworks, documentation, and trade secrets, whether disclosed orally, visually, electronically, or in writing, and identified as confidential or that would reasonably be understood to be confidential given the nature of the information and the circumstances of disclosure.'));

  content.push(h2('3. Exclusions from Confidential Information'));
  content.push(p('Confidential Information does not include information that the Receiving Party can demonstrate:'));
  content.push(bulletList([
    'is or becomes publicly available through no breach of this Agreement;',
    'was lawfully known to the Receiving Party before disclosure, without any confidentiality obligation;',
    'is lawfully received from a third party without breach of any confidentiality obligation;',
    'is independently developed without use of or reference to the Confidential Information; or',
    'is approved for release by prior written authorisation of the Disclosing Party.',
  ]));

  content.push(h2('4. Confidentiality Obligations'));
  content.push(p(isOneWay
    ? `The Receiving Party (${receivingLabel}) shall:`
    : 'Each party, when acting as a Receiving Party, shall:'));
  content.push(bulletList([
    'use Confidential Information solely for the Purpose described above;',
    'protect it with the same degree of care used to protect its own confidential information, and no less than a reasonable degree of care;',
    'limit access to representatives with a genuine need to know, who are bound by confidentiality obligations no less protective than those in this Agreement;',
    'not disclose it to any third party without the prior written consent of the Disclosing Party, except as expressly permitted in this Agreement; and',
    'promptly notify the Disclosing Party of any unauthorised access to or disclosure of Confidential Information, where lawful to do so.',
  ]));

  content.push(h2('5. Permitted Disclosure'));
  content.push(p('The Receiving Party may disclose Confidential Information to its permitted representatives strictly on a need-to-know basis, provided such representatives are bound by confidentiality obligations at least as protective as those in this Agreement. If the Receiving Party is compelled by law, regulation, or court order to disclose Confidential Information, it shall, where legally permitted, give the Disclosing Party prompt notice before disclosure so that the Disclosing Party may seek a protective order or other appropriate remedy.'));
  if (data.advanced.permittedRepresentatives.trim()) {
    content.push(p(`Permitted Representatives: ${data.advanced.permittedRepresentatives.trim()}`));
  }
  if (data.advanced.affiliateDisclosure.trim()) {
    content.push(p(`Affiliate Disclosure: ${data.advanced.affiliateDisclosure.trim()}`));
  }
  if (data.advanced.compelledDisclosureProcess.trim()) {
    content.push(p(`Compelled Disclosure Process: ${data.advanced.compelledDisclosureProcess.trim()}`));
  }

  content.push(h2('6. Data and AI Systems'));
  content.push(p('The following controls apply to the use of Confidential Information with AI systems and third-party tools:'));
  content.push(bulletList([
    aiControlRuns('Third-Party AI Tools', THIRD_PARTY_TEXT, data.aiControls.thirdPartyTools, data.aiControls.thirdPartyCustom),
    aiControlRuns('Model Training', MODEL_TRAINING_TEXT, data.aiControls.modelTraining, data.aiControls.modelTrainingCustom),
    aiControlRuns('Prompts and Logs', PROMPTS_LOGS_TEXT, data.aiControls.promptsLogs, data.aiControls.promptsLogsCustom),
    aiControlRuns('Subcontractors', SUBCONTRACTORS_TEXT, data.aiControls.subcontractors, data.aiControls.subcontractorsCustom),
    aiControlRuns('AI Output Exposure', OUTPUT_EXPOSURE_TEXT, data.aiControls.outputExposure, data.aiControls.outputExposureCustom),
  ]));
  if (data.advanced.subcontractorAccess.trim()) {
    content.push(p(`Subcontractor Access: ${data.advanced.subcontractorAccess.trim()}`));
  }

  content.push(h2('7. No Licence or Transfer of Intellectual Property'));
  content.push(p('Disclosure of Confidential Information does not transfer ownership of, or grant any licence to, any intellectual property, including patents, copyrights, trade secrets, trademarks, or ownership of any models, software, frameworks, methodologies, prompts, or workflows, except where separately agreed in writing between the parties.'));

  content.push(h2('8. Term and Duration of Confidentiality'));
  content.push(p([textRun('This Agreement shall remain in effect for '), resolvePresetRun(data.agreementTerm, 'custom agreement term'), textRun(' from the Effective Date.')]));
  content.push(p([textRun('The confidentiality obligations in this Agreement shall survive for '), resolvePresetRun(data.confidentialityPeriod, 'custom confidentiality period'), textRun(' from the date of disclosure of the relevant Confidential Information, unless otherwise required by applicable law.')]));
  if (data.advanced.residualKnowledge.trim()) {
    content.push(p(`Residual Knowledge: ${data.advanced.residualKnowledge.trim()}`));
  }
  if (data.advanced.tradeSecretTreatment.trim()) {
    content.push(p(`Trade Secret Treatment: ${data.advanced.tradeSecretTreatment.trim()}`));
  }

  content.push(h2('9. Return or Deletion of Information'));
  content.push(p(`Upon the Disclosing Party's written request, or upon termination or expiry of this Agreement, the Receiving Party shall return or securely delete all Confidential Information in its possession${data.advanced.returnDeletionPeriod.trim() ? `, within ${data.advanced.returnDeletionPeriod.trim()}` : ', within a reasonable period'}, except where retention is required by law or embedded in routine, non-recoverable system backups maintained under continued confidentiality obligations.`));

  content.push(h2('10. Remedies'));
  content.push(p('The parties acknowledge that a breach of this Agreement may cause harm that cannot be adequately remedied by monetary damages alone.'));
  content.push(p(data.advanced.injunctiveReliefPreference.trim()
    ? data.advanced.injunctiveReliefPreference.trim()
    : 'Accordingly, the non-breaching party may be entitled to seek injunctive or other equitable relief, in addition to any other remedies available at law, without needing to prove actual damages or post a bond, to the extent permitted by applicable law.'));
  content.push(p('No remedy under this Agreement guarantees a particular legal outcome.'));

  content.push(h2('11. Governing Law'));
  const state = data.governingLaw.state.trim();
  content.push(p([
    textRun('This Agreement shall be governed by and construed in accordance with the laws of '),
    field(data.governingLaw.country, 'governing country'),
    textRun(`${state ? `, ${state}` : ''}, without regard to its conflict of law principles.`),
  ]));

  content.push(h2('12. Dispute Resolution'));
  content.push(...disputeResolutionParagraphs(data.governingLaw));

  content.push(h2('13. General Provisions'));
  content.push(bulletList([
    'Entire Agreement: This Agreement constitutes the entire understanding between the parties regarding its subject matter and supersedes all prior discussions relating to it.',
    'Amendment: This Agreement may only be amended by written agreement signed by both parties.',
    'Waiver: A failure to enforce any provision of this Agreement shall not constitute a waiver of that provision.',
    'Severability: If any provision of this Agreement is found unenforceable, the remaining provisions shall continue in full force and effect.',
    'Assignment: Neither party may assign this Agreement without the prior written consent of the other party.',
    'Counterparts: This Agreement may be executed in counterparts, including by electronic signature, each of which shall be deemed an original.',
  ]));
  if (data.advanced.noticeDetails.trim()) {
    content.push(p(`Notices: ${data.advanced.noticeDetails.trim()}`));
  }
  if (data.advanced.customClauses.trim()) {
    content.push(p(`Additional Clauses: ${data.advanced.customClauses.trim()}`));
  }

  content.push(h2('14. Signatures'));
  const signatureBlock = (label, party) => {
    content.push(p([textRun(`For ${label}: `), field(party.legalName, 'legal name')]));
    content.push(p([textRun('Signatory Name: '), party.signatoryName.trim() ? textRun(party.signatoryName.trim()) : hi('_______________________')]));
    content.push(p([textRun('Title: '), party.signatoryTitle.trim() ? textRun(party.signatoryTitle.trim()) : hi('_______________________')]));
    content.push(p([textRun('Signature: '), hi('_______________________')]));
    content.push(p([textRun('Date: '), hi('_______________________')]));
  };
  signatureBlock('Party 1', data.party1);
  signatureBlock('Party 2', data.party2);

  return { type: 'doc', content };
}
