-- Company OS: Legal Systems (Phase 1)
-- Run in Supabase SQL Editor (project hhcvozecelugmhbiznhf)
-- legal_templates = master templates (never edited by the document workspace).
-- legal_documents = working documents, optionally created from a template.

CREATE TABLE IF NOT EXISTS legal_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,              -- Agreements / Governance
  type text NOT NULL,                  -- NDA / MSA / SOW / MOU / Vendor Agreement / Contract Review SOP / IP Ownership Policy / Legal Escalation Matrix
  description text DEFAULT '',
  version text DEFAULT '1.0',
  content jsonb DEFAULT '{"type":"doc","content":[]}',
  priority text DEFAULT 'P2',          -- P0 / P1 / P2
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_documents (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'Draft',         -- Draft / Under Review / Approved / Active / Archived
  content jsonb DEFAULT '{"type":"doc","content":[]}',
  template_id text REFERENCES legal_templates(id),
  owner text DEFAULT '',
  version text DEFAULT '1.0',
  review_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for legal_templates" ON legal_templates;
CREATE POLICY "Allow all for legal_templates" ON legal_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for legal_documents" ON legal_documents;
CREATE POLICY "Allow all for legal_documents" ON legal_documents FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON legal_templates TO anon, authenticated, service_role, postgres;
GRANT ALL ON legal_documents TO anon, authenticated, service_role, postgres;

-- Seed the 8 Phase-1 master templates (idempotent).
INSERT INTO legal_templates (id, name, category, type, description, priority, content) VALUES
('LT_NDA', 'NDA', 'Agreements', 'NDA', 'Protect confidential information during business discussions.', 'P0',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Non-Disclosure Agreement"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Parties"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Enter the names of the disclosing and receiving parties."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Purpose"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe the purpose of sharing confidential information."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Confidential Information"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define what is considered confidential."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Term"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Specify the duration of confidentiality obligations."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Governing Law"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Specify the governing jurisdiction."}]}
  ]}'::jsonb),
('LT_MSA', 'MSA', 'Agreements', 'MSA', 'Establish the master terms governing an ongoing business relationship.', 'P0',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Master Service Agreement"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Scope of Services"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe the general scope of services covered."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Payment Terms"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define invoicing and payment terms."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Term & Termination"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Specify contract duration and termination conditions."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Liability"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define liability limits and indemnification."}]}
  ]}'::jsonb),
('LT_SOW', 'SOW', 'Agreements', 'SOW', 'Define the specific scope, deliverables and timeline of an engagement.', 'P0',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Statement of Work"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Deliverables"}]},
    {"type":"paragraph","content":[{"type":"text","text":"List the specific deliverables for this engagement."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Timeline"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define milestones and delivery dates."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Fees"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Specify fees tied to this SOW."}]}
  ]}'::jsonb),
('LT_MOU', 'Partnership MOU', 'Agreements', 'MOU', 'Outline a mutual understanding between NovaaMind and a partner.', 'P1',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Partnership Memorandum of Understanding"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Objective"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe the shared objective of the partnership."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Responsibilities"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Outline each party''s responsibilities."}]}
  ]}'::jsonb),
('LT_VENDOR', 'Vendor Agreement', 'Agreements', 'Vendor Agreement', 'Govern the relationship with an external vendor or supplier.', 'P1',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Vendor Agreement"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Services / Goods Provided"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe what the vendor provides."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Pricing & Payment"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define pricing and payment schedule."}]}
  ]}'::jsonb),
('LT_CONTRACT_REVIEW_SOP', 'Contract Review SOP', 'Governance', 'Contract Review SOP', 'Standard process for reviewing contracts before signature.', 'P1',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Contract Review SOP"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Review Steps"}]},
    {"type":"paragraph","content":[{"type":"text","text":"List the steps every contract goes through before signature."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Approval Chain"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define who must approve at each stage."}]}
  ]}'::jsonb),
('LT_IP_POLICY', 'IP Ownership Policy', 'Governance', 'IP Ownership Policy', 'Define ownership of intellectual property created at NovaaMind.', 'P0',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"IP Ownership Policy"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Ownership"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define who owns IP created during engagements and employment."}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Exceptions"}]},
    {"type":"paragraph","content":[{"type":"text","text":"List any exceptions to default ownership."}]}
  ]}'::jsonb),
('LT_ESCALATION_MATRIX', 'Legal Escalation Matrix', 'Governance', 'Legal Escalation Matrix', 'Define who to escalate legal issues to, and when.', 'P2',
  '{"type":"doc","content":[
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Legal Escalation Matrix"}]},
    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Escalation Levels"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define escalation tiers and who owns each one."}]}
  ]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT pg_notify('pgrst', 'reload schema');
