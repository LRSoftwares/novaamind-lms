// Builds the NovaaMind master research prompt for a prospect.
// The prompt is copy-pasted into any external LLM chosen by the user (Phase 1:
// no in-app scraping / automation). Structure and required output format below
// mirror Prompts/Prospecting/NovaaMind_Augmented_Prospecting_Workbench_Prompt.md
// so the returned .md file can be parsed by prospectParser.js.

const v = (val) => (val && String(val).trim()) || 'Not provided';

export function buildResearchPrompt(prospect) {
  const p = prospect || {};

  return `You are conducting evidence-led public-web research on a business prospect for NovaaMind AI Solutions.

Your task is to determine whether this prospect may be a stronger fit for:

1. NovaaMind Academy
2. NovaaMind Strategy
3. Both
4. Not Enough Evidence

Do not make the final business decision.

Your role is to research, gather evidence, separate fact from inference, and provide a structured recommendation for human review.

# Prospect Details

Name:
${v(p.name)}

Current Role:
${v(p.role)}

Company:
${v(p.company)}

City:
${v(p.city)}

Country:
${v(p.country)}

Industry:
${v(p.industry)}

LinkedIn:
${v(p.linkedinUrl)}

Company Website:
${v(p.companyWebsite)}

Personal Website:
${v(p.personalWebsite)}

X / Twitter:
${v(p.xUrl)}

YouTube:
${v(p.youtubeUrl)}

Instagram:
${v(p.instagramUrl)}

Facebook:
${v(p.facebookUrl)}

GitHub:
${v(p.githubUrl)}

Medium:
${v(p.mediumUrl)}

Substack:
${v(p.substackUrl)}

Google Scholar:
${v(p.scholarUrl)}

ORCID:
${v(p.orcidUrl)}

Other Public URLs:
${v(p.otherUrl)}

Known Context:
${v(p.knownContext)}

Known Aspirations / Interests:
${v(p.aspirations)}

---

# Research Instructions

First verify that the information found likely refers to the correct person.

Use combinations of:
- Name
- Company
- Role
- City
- Country
- Career history
- Known profile URLs

Assign Identity Match: High / Medium / Low. If identity match is Low, clearly state this.

---

# Research Public Sources

Where publicly accessible and permitted, research relevant sources such as:

## Official Sources
Official company website, About page, Leadership page, Team page, Services, Products, Careers, Blog, Newsroom, Press releases, Case studies, Investor information where relevant.

## Professional Presence
Public LinkedIn information, public professional biographies, board profiles, association profiles, speaker profiles, conference pages.

## Public Social Presence
X / Twitter, YouTube, Instagram, Facebook. Use only professionally relevant public information. Do not infer business fit from personal lifestyle content.

## Intellectual Presence
Medium, Substack, personal blog, articles, essays, interviews, podcasts, keynotes, panel discussions.

## Technical Presence
Where relevant: GitHub, public repositories, technical articles, open-source activity.

## Academic Presence
Where relevant: Google Scholar, ORCID, university profiles, research institution pages, publications.

## Wider Public Web
Credible news, public interviews, podcasts, event profiles, accelerator profiles, incubator profiles, association memberships, board memberships, awards, public company announcements, public business directories, public filings where relevant.

---

# Research Priority

Prioritize: 1) Official company sources 2) Official personal website 3) Public professional profiles 4) Official press releases 5) Credible recent news 6) Interviews and podcasts 7) YouTube talks 8) Conference profiles 9) Public intellectual writing 10) Relevant social presence.

Adapt priority based on prospect type. Examples: Technical Founder -> increase GitHub priority. Academic -> increase Scholar / ORCID priority. Creator -> increase YouTube / Instagram priority. Enterprise CXO -> increase Company / News / Interviews priority.

---

# Person Attributes to Evaluate
Current role, seniority, decision authority, founder status, career history, education, functional expertise, industry experience, board roles, leadership influence, public thought leadership, community affiliations, learning orientation, AI interest, technology interest, transformation interest, strategic themes.

# Company Attributes to Evaluate
Industry, business model, approximate scale where reliably supported, geographic presence, growth signals, hiring signals, digital maturity, technology adoption, AI adoption, operational complexity, data complexity, process fragmentation, transformation initiatives, strategic initiatives, expansion activity, leadership changes.

Do not invent revenue, employee count, valuation, or company scale.

---

# Academy Fit Signals
Look for evidence of: AI learning interest, executive education, upskilling, leadership development, career transition, professional development, cohort participation, workshop participation, founder learning, community learning, need to understand AI before implementation, engagement with educational content.

Rate: Academy Fit: High / Medium / Low. Give maximum 3 reasons.

# Strategy Fit Signals
Look for evidence of: Founder / CXO / Board authority, significant decision influence, enterprise transformation opportunity, AI adoption opportunity, process complexity, multi-location operations, data fragmentation, decision intelligence opportunity, automation opportunity, scaling challenge, digital transformation, AI-native organization opportunity, significant business responsibility, strategic change initiatives.

Rate: Strategy Fit: High / Medium / Low. Give maximum 3 reasons.

# Recommendation
Provide one: Academy / Strategy / Both / Not Enough Evidence. Do not use Both as a safe default.

# Confidence
Provide: High / Medium / Low, based on identity match, source quality, number of useful sources, recency, agreement between sources, evidence strength. Do not use fake precision percentages.

# Critical Rules
Use only publicly accessible information. Do not bypass authentication. Do not access private profiles. Do not infer sensitive personal traits. Do not fabricate missing information. Separate facts from inference. Flag conflicting information. Preserve source URLs. Include publication dates where available. Include date checked. Prefer recent authoritative sources.

---

# Required Output Format

Return the research in the exact Markdown structure below so it can be uploaded into NovaaMind and parsed automatically.

## 1. Prospect Snapshot

**Name:**
**Current Role:**
**Company:**
**Location:**
**Industry:**
**Identity Match:**

**Professional Summary:**

---

## 2. Person Signals

**Decision Authority:**
**Leadership Seniority:**
**Founder Status:**
**Career Background:**
**Education:**
**Board Roles:**
**Community Affiliations:**
**Public Thought Leadership:**
**Learning Orientation:**
**AI Interest:**
**Technology Interest:**
**Transformation Interest:**

---

## 3. Company Snapshot

**Company:**
**Industry:**
**Business Model:**
**Approximate Scale:**
**Geographic Presence:**
**Growth Signals:**
**Technology Signals:**
**AI Signals:**
**Transformation Signals:**
**Operational Complexity:**
**Strategic Initiatives:**

---

## 4. Academy Fit

**Rating:** High / Medium / Low

**Reason 1:**
**Reason 2:**
**Reason 3:**

**Supporting Evidence:**

---

## 5. Strategy Fit

**Rating:** High / Medium / Low

**Reason 1:**
**Reason 2:**
**Reason 3:**

**Supporting Evidence:**

---

## 6. Overall Recommendation

**Recommendation:** Academy / Strategy / Both / Not Enough Evidence

**Confidence:** High / Medium / Low

**Reasoning:**

---

## 7. Key Opportunities

**Opportunity 1:**
**Opportunity 2:**
**Opportunity 3:**

---

## 8. Risks / Gaps

**Gap 1:**
**Gap 2:**
**Gap 3:**

---

## 9. Evidence Register

For every important evidence item provide:

### Evidence Item

**Evidence:**
**Source Name:**
**Source URL:**
**Published Date:**
**Date Checked:**
**Why It Matters:**

Repeat for each evidence item.

---

## 10. Sources

List all useful source URLs.

---

# File Output

After completing the research, create a downloadable Markdown (.md) file. The file must preserve the exact section structure above so it can be uploaded into NovaaMind and parsed automatically.`;
}

export function prospectPromptFilename(prospect) {
  const slug = (prospect?.name || 'prospect').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${slug || 'prospect'}-research-prompt.md`;
}
