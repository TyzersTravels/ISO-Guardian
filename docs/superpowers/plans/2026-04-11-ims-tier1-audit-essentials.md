# IMS Tier 1: Audit Essentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 6 audit-essential features that complete ISOGuardian's IMS coverage — Org Chart (§5.3), Context Analysis/SWOT (§4.1), Legal Register (§6.1.3), Environmental Aspects Register (§6.1.2), HIRA/Hazard Register (§6.1.2), and Document-Clause Cross-Reference Matrix.

**Architecture:** Each feature follows the established register pattern (useState CRUD, Supabase table with RLS, glass morphism UI, `logActivity` audit trail, company_id scoping via `getEffectiveCompanyId()`). Each new page gets a SQL migration, a React page component, lazy route in App.jsx, nav entry in Layout.jsx, and command palette entry. The Org Chart uses a tree layout rendered with CSS (no external libs). The Cross-Reference Matrix reads existing `documents` data and groups by clause. All features cross-link to related IMS pages via clause references.

**Tech Stack:** React 18, Supabase (PostgreSQL + RLS), Tailwind CSS, jsPDF (export), existing glass morphism CSS classes.

**No test runner is configured — verification is `npm run build` (must exit 0).**

---

## File Map

| Task | Create | Modify |
|------|--------|--------|
| 1. Org Chart | `src/pages/OrgChart.jsx`, `scripts/org_chart_migration.sql` | `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx` |
| 2. Context Analysis (SWOT) | `src/pages/ContextAnalysis.jsx`, `scripts/ims_clause4_1_migration.sql` | `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx` |
| 3. Legal Register | `src/pages/LegalRegister.jsx`, `scripts/legal_register_migration.sql` | `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx` |
| 4. Environmental Aspects | `src/pages/EnvironmentalAspects.jsx`, `scripts/environmental_aspects_migration.sql` | `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx` |
| 5. HIRA / Hazard Register | `src/pages/HazardRegister.jsx`, `scripts/hazard_register_migration.sql` | `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx` |
| 6. Cross-Reference Matrix | `src/pages/ClauseMatrix.jsx` | `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx` |

---

## Task 1: Organisational Chart (§5.3)

**Purpose:** Visual org chart showing company structure — positions, reporting lines, SHEQ responsibilities. Auditors check §5.3 for evidence that roles, responsibilities, and authorities are defined and communicated.

**Files:**
- Create: `scripts/org_chart_migration.sql`
- Create: `src/pages/OrgChart.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/Layout.jsx`
- Modify: `src/components/CommandPalette.jsx`

### Step 1: Create migration script

- [ ] Create `scripts/org_chart_migration.sql`:

```sql
-- IMS Clause 5.3: Organisational Roles, Responsibilities & Authorities
-- Org Chart positions table

CREATE TABLE IF NOT EXISTS org_positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Position info
  position_title text NOT NULL,
  department text,
  holder_name text, -- person currently in role
  holder_email text,
  user_id uuid REFERENCES users(id), -- optional link to system user

  -- Hierarchy
  reports_to uuid REFERENCES org_positions(id) ON DELETE SET NULL,
  position_level integer NOT NULL DEFAULT 0, -- 0=top, 1=direct report, etc.

  -- SHEQ Responsibilities (ISO 5.3)
  responsibilities text, -- key responsibilities
  authorities text, -- decision-making authority
  sheq_role text, -- e.g. 'Management Representative', 'SHEQ Officer', 'First Aider'
  is_sheq_critical boolean DEFAULT false, -- highlighted in org chart

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_references text[] DEFAULT '{5.3}',

  -- Status
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Vacant', 'Acting')),
  effective_date date,
  notes text,

  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_positions_company ON org_positions(company_id);
CREATE INDEX IF NOT EXISTS idx_org_positions_reports_to ON org_positions(reports_to);

ALTER TABLE org_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_positions_select" ON org_positions
  FOR SELECT USING (
    company_id = public.get_my_company_id()
    OR public.is_super_admin()
    OR public.is_reseller_for_uuid(company_id)
  );
CREATE POLICY "org_positions_insert" ON org_positions
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "org_positions_update" ON org_positions
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "org_positions_delete" ON org_positions
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE TRIGGER trg_org_positions_updated
  BEFORE UPDATE ON org_positions FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
```

### Step 2: Build OrgChart.jsx

- [ ] Create `src/pages/OrgChart.jsx` with:

**Features:**
- **Tree view** (default): CSS-rendered hierarchical tree with connecting lines. Top-level position at top, direct reports below with vertical/horizontal connectors. Each node shows: title, holder name, department, SHEQ role badge (if set), status badge.
- **List view**: Standard table like other registers (position, holder, department, reports to, SHEQ role, status).
- CRUD modal for add/edit positions. Fields: position_title (required), department, holder_name, holder_email, reports_to (dropdown of existing positions), sheq_role (free text), is_sheq_critical (checkbox), responsibilities (textarea), authorities (textarea), standards (multi-toggle), status, effective_date, notes.
- KPI cards: Total Positions, Vacant, SHEQ-Critical, Departments (unique count).
- ISO reference card: "ISO 5.3 requires top management to assign responsibilities and authorities for relevant roles and communicate them within the organisation."
- Delete with ConfirmModal.
- Glass morphism styling, company_id scoping, logActivity on all mutations.

**Tree rendering approach (no external library):**
- Build tree from flat data: find root nodes (reports_to is null), recursively find children.
- Render with CSS flexbox: parent centered, children row below, SVG or border lines connecting.
- Each node is a clickable card that opens the detail/edit modal.
- SHEQ-critical positions get a cyan border highlight.
- Vacant positions show dashed border + "Vacant" badge in red.

### Step 3: Wire into app

- [ ] Add to `src/App.jsx`:
```jsx
const OrgChart = lazy(() => import('./pages/OrgChart'))
// Route:
<Route path="/org-chart" element={<ProtectedRoute><OrgChart /></ProtectedRoute>} />
```

- [ ] Add to `src/components/Layout.jsx` under "1. Company" group (after Users/Organisation):
```jsx
{ path: '/org-chart', label: 'Org Chart', icon: 'users', clause: '§5.3' },
```

- [ ] Add to `src/components/CommandPalette.jsx`:
```jsx
{ id: 'org-chart', label: 'Organisation Chart', keywords: 'org chart organogram structure hierarchy 5.3 roles responsibilities', section: 'Navigation', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', action: () => navigate('/org-chart') },
```

### Step 4: Build and verify

- [ ] Run: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`
- Expected: Exit 0, no errors.

### Step 5: Commit

```bash
git add scripts/org_chart_migration.sql src/pages/OrgChart.jsx src/App.jsx src/components/Layout.jsx src/components/CommandPalette.jsx
git commit -m "Add Org Chart (§5.3): visual hierarchy + SHEQ roles"
git push origin main
```

---

## Task 2: Context Analysis / SWOT (§4.1)

**Purpose:** Register of internal and external issues affecting the organisation's ability to achieve intended outcomes. Auditors check §4.1 first — it's the foundation of the entire management system.

**Files:**
- Create: `scripts/ims_clause4_1_migration.sql`
- Create: `src/pages/ContextAnalysis.jsx`
- Modify: `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx`

### Step 1: Create migration

- [ ] Create `scripts/ims_clause4_1_migration.sql`:

```sql
-- IMS Clause 4.1: Understanding the Organisation and its Context
-- Internal & External Issues Register (SWOT)

CREATE TABLE IF NOT EXISTS context_issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Issue identification
  issue_title text NOT NULL,
  description text,

  -- Classification
  issue_type text NOT NULL CHECK (issue_type IN (
    'internal_strength', 'internal_weakness',
    'external_opportunity', 'external_threat'
  )),
  category text NOT NULL CHECK (category IN (
    'political', 'economic', 'social', 'technological',
    'legal', 'environmental', 'competitive', 'organisational',
    'cultural', 'financial', 'infrastructure', 'human_resources', 'other'
  )),

  -- Impact assessment
  impact_level text NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affected_processes text, -- which processes this impacts

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_references text[] DEFAULT '{4.1}',

  -- Response
  response_action text, -- what the organisation is doing about it
  responsible_person text,
  target_date date,

  -- Links
  linked_risk_id uuid, -- optional link to risk register

  -- Status
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Monitoring', 'Resolved', 'Archived')),
  last_reviewed date,
  next_review_date date,
  notes text,

  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_issues_company ON context_issues(company_id);
CREATE INDEX IF NOT EXISTS idx_context_issues_type ON context_issues(issue_type);

ALTER TABLE context_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "context_issues_select" ON context_issues
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "context_issues_insert" ON context_issues
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "context_issues_update" ON context_issues
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "context_issues_delete" ON context_issues
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE TRIGGER trg_context_issues_updated
  BEFORE UPDATE ON context_issues FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
```

### Step 2: Build ContextAnalysis.jsx

- [ ] Create `src/pages/ContextAnalysis.jsx` with:

**Features:**
- **SWOT Grid view** (default): 2×2 grid — Strengths (green, top-left), Weaknesses (red, top-right), Opportunities (blue, bottom-left), Threats (amber, bottom-right). Each quadrant lists its issues as cards. Click card to view/edit.
- **List view**: Standard table with all issues, sortable/filterable.
- **PESTLE categories** in the form: Political, Economic, Social, Technological, Legal, Environmental — plus Competitive, Organisational, Cultural, Financial, Infrastructure, HR.
- Impact level badge on each card (Low/Medium/High/Critical with color coding).
- Optional link to Risk Register: "Link to Risk" button that saves `linked_risk_id`.
- KPI cards: Strengths count, Weaknesses count, Opportunities count, Threats count.
- ISO reference card: "ISO 4.1 requires determining external and internal issues relevant to the organisation's purpose and strategic direction that affect its ability to achieve the intended results of its management system."
- CRUD modal, filters (type, category, status, impact), glass morphism, company_id scoping, logActivity.

### Step 3: Wire into app

- [ ] `src/App.jsx`: Lazy import + route at `/context-analysis`
- [ ] `src/components/Layout.jsx`: Add under "2. Context" group:
```jsx
{ path: '/context-analysis', label: 'SWOT / Context', icon: 'analytics', clause: '§4.1' },
```
- [ ] `src/components/CommandPalette.jsx`: Add entry with keywords `swot context internal external issues pestle 4.1 strengths weaknesses opportunities threats`

### Step 4: Build and verify

- [ ] Run: `NODE_OPTIONS="--max-old-space-size=4096" npm run build` → Exit 0

### Step 5: Commit

```bash
git add scripts/ims_clause4_1_migration.sql src/pages/ContextAnalysis.jsx src/App.jsx src/components/Layout.jsx src/components/CommandPalette.jsx
git commit -m "Add Context Analysis / SWOT register (§4.1): PESTLE categories + impact scoring"
git push origin main
```

---

## Task 3: Legal Register (§6.1.3)

**Purpose:** Track all applicable legislation, regulations, and compliance obligations. Mandatory for ISO 14001 and 45001. Auditors will ask: "Show me your legal register and how you determine compliance."

**Files:**
- Create: `scripts/legal_register_migration.sql`
- Create: `src/pages/LegalRegister.jsx`
- Modify: `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx`

### Step 1: Create migration

- [ ] Create `scripts/legal_register_migration.sql`:

```sql
-- IMS Clause 6.1.3: Compliance Obligations (Legal Register)

CREATE TABLE IF NOT EXISTS legal_requirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Legislation details
  legislation_title text NOT NULL, -- e.g. 'Occupational Health and Safety Act 85 of 1993'
  legislation_number text, -- e.g. 'Act 85 of 1993'
  section_reference text, -- specific section/regulation, e.g. 'Section 8(1)'
  issuing_authority text, -- e.g. 'Department of Employment and Labour'

  -- Classification
  requirement_type text NOT NULL CHECK (requirement_type IN (
    'act', 'regulation', 'bylaw', 'standard', 'code_of_practice',
    'permit', 'licence', 'contract', 'industry_agreement', 'other'
  )),
  jurisdiction text DEFAULT 'South Africa',

  -- Applicability
  applicable_to text, -- which parts of the business
  applicability_reason text, -- why this applies

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_references text[] DEFAULT '{6.1.3}',
  category text NOT NULL CHECK (category IN (
    'environmental', 'health_safety', 'quality', 'labour',
    'fire_safety', 'hazardous_substances', 'waste_management',
    'water', 'air_quality', 'noise', 'general', 'other'
  )),

  -- Compliance tracking
  compliance_status text NOT NULL DEFAULT 'Compliant' CHECK (compliance_status IN (
    'Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Assessed', 'Not Applicable'
  )),
  compliance_evidence text, -- what evidence demonstrates compliance
  last_compliance_evaluation date,
  next_evaluation_date date,
  evaluated_by text,

  -- Permit/licence tracking
  permit_number text,
  issue_date date,
  expiry_date date,
  renewal_reminder_days integer DEFAULT 60,

  -- Amendments
  last_amended date,
  amendment_notes text,

  -- Responsible
  responsible_person text,
  notes text,

  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_requirements_company ON legal_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_legal_requirements_category ON legal_requirements(category);
CREATE INDEX IF NOT EXISTS idx_legal_requirements_status ON legal_requirements(compliance_status);
CREATE INDEX IF NOT EXISTS idx_legal_requirements_expiry ON legal_requirements(expiry_date);

ALTER TABLE legal_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_requirements_select" ON legal_requirements
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "legal_requirements_insert" ON legal_requirements
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "legal_requirements_update" ON legal_requirements
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "legal_requirements_delete" ON legal_requirements
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE TRIGGER trg_legal_requirements_updated
  BEFORE UPDATE ON legal_requirements FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
```

### Step 2: Build LegalRegister.jsx

- [ ] Create `src/pages/LegalRegister.jsx` with:

**Features:**
- Table view with columns: Legislation Title, Type, Category, Standards, Compliance Status, Expiry Date, Actions.
- Compliance status badges with color coding: Compliant (green), Partially (amber), Non-Compliant (red), Not Assessed (grey).
- **Expiry warning**: Permits/licences expiring within 60 days highlighted in amber, expired in red.
- Category filter (Environmental, H&S, Quality, Labour, etc.).
- South African legislation pre-populated categories: OHS Act, NEMA, NWA, MHSA, COIDA, BCEA, LRA, Fire Safety.
- KPI cards: Total Requirements, Compliant %, Non-Compliant, Expiring Soon.
- CRUD modal with all fields, glass morphism, company_id scoping, logActivity.
- ISO reference card: "ISO 6.1.3 requires determining compliance obligations related to environmental aspects (14001) and OH&S hazards (45001), and how they apply to the organisation."

### Step 3: Wire into app

- [ ] `src/App.jsx`: Lazy import + route at `/legal-register`
- [ ] `src/components/Layout.jsx`: Add under "3. Planning" group:
```jsx
{ path: '/legal-register', label: 'Legal Register', icon: 'compliance', clause: '§6.1.3' },
```
- [ ] `src/components/CommandPalette.jsx`: Add entry with keywords `legal legislation regulation compliance obligations permit licence 6.1.3 act law`

### Step 4: Build and verify → `npm run build` → Exit 0

### Step 5: Commit

```bash
git add scripts/legal_register_migration.sql src/pages/LegalRegister.jsx src/App.jsx src/components/Layout.jsx src/components/CommandPalette.jsx
git commit -m "Add Legal Register (§6.1.3): compliance obligations + permit tracking"
git push origin main
```

---

## Task 4: Environmental Aspects Register (§6.1.2 — ISO 14001)

**Purpose:** Identify environmental aspects and their impacts. Required for ISO 14001 certification. Auditors ask: "How have you determined your significant environmental aspects?"

**Files:**
- Create: `scripts/environmental_aspects_migration.sql`
- Create: `src/pages/EnvironmentalAspects.jsx`
- Modify: `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx`

### Step 1: Create migration

- [ ] Create `scripts/environmental_aspects_migration.sql`:

```sql
-- IMS Clause 6.1.2 (ISO 14001): Environmental Aspects & Impacts

CREATE TABLE IF NOT EXISTS environmental_aspects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Aspect identification
  activity text NOT NULL, -- e.g. 'Vehicle fleet operations'
  aspect text NOT NULL, -- e.g. 'Exhaust emissions'
  impact text NOT NULL, -- e.g. 'Air pollution / climate change'

  -- Classification
  condition text NOT NULL CHECK (condition IN ('normal', 'abnormal', 'emergency')),
  temporal text NOT NULL DEFAULT 'current' CHECK (temporal IN ('past', 'current', 'planned')),
  aspect_type text NOT NULL DEFAULT 'direct' CHECK (aspect_type IN ('direct', 'indirect')),

  -- Impact category
  impact_category text NOT NULL CHECK (impact_category IN (
    'air_emissions', 'water_discharge', 'land_contamination',
    'waste_generation', 'resource_consumption', 'energy_use',
    'noise_vibration', 'biodiversity', 'visual_impact', 'other'
  )),
  impact_direction text NOT NULL DEFAULT 'negative' CHECK (impact_direction IN ('positive', 'negative')),

  -- Significance scoring (typical 1-5 scale)
  severity integer NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  probability integer NOT NULL DEFAULT 1 CHECK (probability BETWEEN 1 AND 5),
  frequency integer NOT NULL DEFAULT 1 CHECK (frequency BETWEEN 1 AND 5),
  legal_factor boolean DEFAULT false, -- has legal requirement linked
  stakeholder_concern boolean DEFAULT false, -- raised by interested parties
  significance_score integer GENERATED ALWAYS AS (severity * probability + CASE WHEN legal_factor THEN 5 ELSE 0 END + CASE WHEN stakeholder_concern THEN 3 ELSE 0 END) STORED,
  is_significant boolean DEFAULT false, -- manually confirmed significant

  -- Controls
  current_controls text, -- existing controls
  planned_controls text, -- additional controls needed
  responsible_person text,
  target_date date,

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{ISO_14001}',
  clause_references text[] DEFAULT '{6.1.2}',
  linked_legal_id uuid, -- link to legal register

  -- Process link
  linked_process_id uuid, -- link to process register

  -- Status
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Under Review', 'Eliminated', 'Archived')),
  last_reviewed date,
  next_review_date date,
  notes text,

  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_aspects_company ON environmental_aspects(company_id);
CREATE INDEX IF NOT EXISTS idx_env_aspects_significant ON environmental_aspects(is_significant);
CREATE INDEX IF NOT EXISTS idx_env_aspects_category ON environmental_aspects(impact_category);

ALTER TABLE environmental_aspects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "env_aspects_select" ON environmental_aspects
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "env_aspects_insert" ON environmental_aspects
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "env_aspects_update" ON environmental_aspects
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "env_aspects_delete" ON environmental_aspects
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE TRIGGER trg_env_aspects_updated
  BEFORE UPDATE ON environmental_aspects FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
```

### Step 2: Build EnvironmentalAspects.jsx

- [ ] Create `src/pages/EnvironmentalAspects.jsx` with:

**Features:**
- Table view: Activity, Aspect, Impact, Condition (Normal/Abnormal/Emergency), Significance Score, Significant? (Y/N badge), Status.
- **Significance scoring**: Severity × Probability + Legal bonus (5) + Stakeholder bonus (3). Threshold: ≥15 = significant (auto-suggested, manually confirmed).
- Score color coding: <10 green, 10-14 amber, 15-19 orange, 20+ red.
- Condition filter (Normal, Abnormal, Emergency).
- Impact category filter.
- KPI cards: Total Aspects, Significant, Controlled, Uncontrolled (significant without current_controls).
- CRUD modal with all fields. Severity/Probability/Frequency as 1-5 slider or button group. Checkboxes for legal_factor and stakeholder_concern. Auto-calculated significance_score display.
- ISO reference card: "ISO 14001 §6.1.2 requires determining environmental aspects within the defined scope, associated environmental impacts, and significant environmental aspects using established criteria."
- Glass morphism, company_id scoping, logActivity.

### Step 3: Wire into app

- [ ] `src/App.jsx`: Lazy import + route at `/environmental-aspects`
- [ ] `src/components/Layout.jsx`: Add under "5. Operations" group:
```jsx
{ path: '/environmental-aspects', label: 'Env. Aspects', icon: 'compliance', clause: '§6.1.2' },
```
- [ ] `src/components/CommandPalette.jsx`: Add entry with keywords `environmental aspects impacts significance 6.1.2 14001 emissions waste water air pollution`

### Step 4: Build and verify → `npm run build` → Exit 0

### Step 5: Commit

```bash
git add scripts/environmental_aspects_migration.sql src/pages/EnvironmentalAspects.jsx src/App.jsx src/components/Layout.jsx src/components/CommandPalette.jsx
git commit -m "Add Environmental Aspects Register (§6.1.2): significance scoring + controls"
git push origin main
```

---

## Task 5: HIRA / Hazard Register (§6.1.2 — ISO 45001)

**Purpose:** Hazard Identification and Risk Assessment. Mandatory for ISO 45001. Auditors ask: "Show me your HIRA and how you determine controls using the hierarchy of controls."

**Files:**
- Create: `scripts/hazard_register_migration.sql`
- Create: `src/pages/HazardRegister.jsx`
- Modify: `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx`

### Step 1: Create migration

- [ ] Create `scripts/hazard_register_migration.sql`:

```sql
-- IMS Clause 6.1.2 (ISO 45001): Hazard Identification & Risk Assessment (HIRA)

CREATE TABLE IF NOT EXISTS hazards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Hazard identification
  location_area text NOT NULL, -- e.g. 'Workshop', 'Office', 'Site A'
  activity text NOT NULL, -- e.g. 'Welding operations'
  hazard text NOT NULL, -- e.g. 'UV radiation, sparks, fumes'
  potential_harm text NOT NULL, -- e.g. 'Burns, eye damage, respiratory illness'
  who_at_risk text, -- e.g. 'Welders, nearby workers, visitors'

  -- Classification
  hazard_category text NOT NULL CHECK (hazard_category IN (
    'physical', 'chemical', 'biological', 'ergonomic',
    'psychosocial', 'electrical', 'mechanical', 'fire',
    'environmental', 'vehicular', 'working_at_height',
    'confined_space', 'other'
  )),
  routine boolean DEFAULT true, -- routine vs non-routine activity

  -- Risk scoring (pre-controls)
  pre_likelihood integer NOT NULL DEFAULT 1 CHECK (pre_likelihood BETWEEN 1 AND 5),
  pre_severity integer NOT NULL DEFAULT 1 CHECK (pre_severity BETWEEN 1 AND 5),
  pre_risk_rating integer GENERATED ALWAYS AS (pre_likelihood * pre_severity) STORED,

  -- Hierarchy of Controls (ISO 45001 §8.1.2)
  control_elimination text, -- 1. Eliminate the hazard
  control_substitution text, -- 2. Substitute with less hazardous
  control_engineering text, -- 3. Engineering controls (guards, ventilation)
  control_administrative text, -- 4. Administrative (procedures, training, signage)
  control_ppe text, -- 5. PPE (last resort)

  -- Risk scoring (post-controls / residual)
  post_likelihood integer DEFAULT 1 CHECK (post_likelihood BETWEEN 1 AND 5),
  post_severity integer DEFAULT 1 CHECK (post_severity BETWEEN 1 AND 5),
  post_risk_rating integer GENERATED ALWAYS AS (post_likelihood * post_severity) STORED,

  -- Responsible
  responsible_person text,
  target_date date,

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{ISO_45001}',
  clause_references text[] DEFAULT '{6.1.2}',
  linked_legal_id uuid, -- link to legal register (e.g. OHS Act section)

  -- Status
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Under Review', 'Eliminated', 'Archived')),
  last_reviewed date,
  next_review_date date,
  notes text,

  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hazards_company ON hazards(company_id);
CREATE INDEX IF NOT EXISTS idx_hazards_category ON hazards(hazard_category);
CREATE INDEX IF NOT EXISTS idx_hazards_status ON hazards(status);

ALTER TABLE hazards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hazards_select" ON hazards
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "hazards_insert" ON hazards
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "hazards_update" ON hazards
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "hazards_delete" ON hazards
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE TRIGGER trg_hazards_updated
  BEFORE UPDATE ON hazards FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
```

### Step 2: Build HazardRegister.jsx

- [ ] Create `src/pages/HazardRegister.jsx` with:

**Features:**
- Table view: Location, Activity, Hazard, Category, Pre-Risk (L×S with color), Controls summary, Post-Risk (L×S with color), Status.
- **Risk matrix visual**: 5×5 grid showing likelihood vs severity, with hazard count per cell. Color coded green/yellow/orange/red. Click a cell to filter hazards.
- **Hierarchy of Controls section** in the form: 5 text fields stacked in priority order (Elimination → Substitution → Engineering → Administrative → PPE) with numbered labels and visual hierarchy (top = most effective, bottom = least).
- Pre-risk vs post-risk comparison: show both scores side-by-side with arrow showing reduction.
- Risk rating colors: 1-4 green (Low), 5-9 yellow (Medium), 10-15 orange (High), 16-25 red (Critical).
- Category filter, location filter, risk level filter.
- KPI cards: Total Hazards, Critical (post-risk ≥16), High (10-15), Controlled (post < pre).
- ISO reference card: "ISO 45001 §6.1.2 requires hazard identification considering routine/non-routine activities, and §8.1.2 requires applying the hierarchy of controls: Elimination → Substitution → Engineering → Administrative → PPE."
- Glass morphism, company_id scoping, logActivity.

### Step 3: Wire into app

- [ ] `src/App.jsx`: Lazy import + route at `/hazard-register`
- [ ] `src/components/Layout.jsx`: Add under "5. Operations" group:
```jsx
{ path: '/hazard-register', label: 'HIRA / Hazards', icon: 'ncrs', clause: '§6.1.2' },
```
- [ ] `src/components/CommandPalette.jsx`: Add entry with keywords `hira hazard identification risk assessment 6.1.2 45001 safety controls hierarchy ppe`

### Step 4: Build and verify → `npm run build` → Exit 0

### Step 5: Commit

```bash
git add scripts/hazard_register_migration.sql src/pages/HazardRegister.jsx src/App.jsx src/components/Layout.jsx src/components/CommandPalette.jsx
git commit -m "Add HIRA / Hazard Register (§6.1.2): hierarchy of controls + risk matrix"
git push origin main
```

---

## Task 6: Document-Clause Cross-Reference Matrix

**Purpose:** Single view showing which documents satisfy which ISO clauses — critical for audit preparation. Auditors use this to verify evidence exists for every clause.

**Files:**
- Create: `src/pages/ClauseMatrix.jsx`
- Modify: `src/App.jsx`, `src/components/Layout.jsx`, `src/components/CommandPalette.jsx`

**No migration needed** — reads existing `documents` table (already has `standard`, `clause`, `clause_name` columns).

### Step 1: Build ClauseMatrix.jsx

- [ ] Create `src/pages/ClauseMatrix.jsx` with:

**Features:**
- **Matrix view** (default): Rows = ISO clauses (4.1 through 10.3), Columns = standards (ISO 9001, 14001, 45001). Each cell shows document count for that clause+standard. Color: green (has docs), red (no docs = gap), amber (has docs but none approved). Click a cell to see the list of documents.
- **Gap analysis summary**: Top bar showing overall coverage % per standard. "X of Y clauses have documented evidence."
- **Clause detail panel**: When a clause row is clicked, slide-out panel showing all linked documents + links to related registers (e.g. §6.1 links to Risk Register, §6.1.2 links to Environmental Aspects + HIRA, §4.2 links to Stakeholders, etc.).
- **Cross-links to IMS pages**: Each clause row has quick-link icons to the relevant register page if one exists. This is the "neural network" — clicking §7.2 takes you to Training Matrix, §4.4 takes you to Process Register, etc.
- Standard filter (show all 3 or focus on one).
- Export gap report summary (could be a future enhancement, not required now).
- ISO reference card: "This matrix maps your documented evidence against each ISO clause. Green = evidence present. Red = gap requiring attention. Use this to prepare for external audits."
- Read-only — no CRUD needed, it aggregates existing document data.

**Clause-to-page mapping** (hardcoded):
```
4.1 → /context-analysis (SWOT)
4.2 → /interested-parties (Stakeholders)
4.4 → /processes (Process Register)
5.3 → /org-chart (Org Chart)
6.1 → /risk-register (Risks)
6.1.2 → /environmental-aspects + /hazard-register
6.1.3 → /legal-register (Legal)
6.2 → /quality-objectives (Objectives)
7.2 → /training-matrix (Training)
7.4 → /communications (Comms)
7.5 → /documents (Documents)
8.4 → /suppliers (Suppliers)
9.1.2 → /customer-feedback (Feedback)
9.2 → /audits (Audits)
9.3 → /management-reviews (Reviews)
10.2 → /ncrs (NCRs)
10.3 → /improvements (Improvements)
```

### Step 2: Wire into app

- [ ] `src/App.jsx`: Lazy import + route at `/clause-matrix`
- [ ] `src/components/Layout.jsx`: Add under "Tools" group:
```jsx
{ path: '/clause-matrix', label: 'Clause Matrix', icon: 'compliance' },
```
- [ ] `src/components/CommandPalette.jsx`: Add entry with keywords `clause matrix cross reference gap analysis audit readiness evidence mapping`

### Step 3: Build and verify → `npm run build` → Exit 0

### Step 4: Commit

```bash
git add src/pages/ClauseMatrix.jsx src/App.jsx src/components/Layout.jsx src/components/CommandPalette.jsx
git commit -m "Add Document-Clause Cross-Reference Matrix: gap analysis + IMS cross-links"
git push origin main
```

---

## Nav Update Summary

After all tasks, the Layout.jsx nav groups should look like:

```
DASHBOARD

1. COMPANY §5
   Company Profile (admin only)     §4.3/§5.2
   Organisation (admin only)        §5.3
   Org Chart                        §5.3

2. CONTEXT §4
   SWOT / Context                   §4.1
   Processes                        §4.4
   Stakeholders                     §4.2

3. PLANNING §6
   Risks & Opportunities            §6.1
   Objectives & Targets             §6.2
   Legal Register                   §6.1.3

4. SUPPORT §7
   Documents                        §7.5
   Training                         §7.2
   Communications                   §7.4

5. OPERATIONS §8
   Suppliers                        §8.4
   Customer Feedback                §9.1.2
   Env. Aspects                     §6.1.2
   HIRA / Hazards                   §6.1.2

6. PERFORMANCE §9–10
   NCRs                             §10.2
   Audits                           §9.2
   Management Reviews               §9.3
   Improvements                     §10.3

TOOLS
   Templates
   Audit Simulator
   Clause Matrix
   Audit Connect (admin/lead_auditor)

ACTIVITY
   Activity Trail
   Notifications
   Export Data

ADMINISTRATION (admin only)
   Analytics
   New Company (super_admin)
   Finance (super_admin)
```

---

## Self-Review

**Spec coverage check:**
- ✅ Org Chart (§5.3) — Task 1
- ✅ Context Analysis / SWOT (§4.1) — Task 2
- ✅ Legal Register (§6.1.3) — Task 3
- ✅ Environmental Aspects (§6.1.2, ISO 14001) — Task 4
- ✅ HIRA / Hazard Register (§6.1.2, ISO 45001) — Task 5
- ✅ Document-Clause Cross-Reference Matrix — Task 6
- ✅ Document-clause mapping already exists (documents table has standard, clause, clause_name)

**Placeholder scan:** No TBD/TODO found. All SQL schemas complete. All component features specified.

**Type consistency:** All migrations use the same pattern (uuid PK, company_id FK, standards text[], clause_references text[], RLS policies, updated_at trigger using existing `update_processes_updated_at()` function). All pages use the same imports, hooks, and CRUD patterns.
