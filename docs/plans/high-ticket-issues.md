# High-Ticket Issues: OpenBox Documentation Site

5 issues that break the journey from "I just landed here" to "I'm up and running with governance configured."

---

## Issue 1: Homepage Hero Fails to Communicate What OpenBox Does

**Priority:** P0
**Files to change:**
- `website/src/pages/index.js` (lines 248-267: `HomepageHeader` component)
- `website/docusaurus.config.js` (line 14: `tagline`)

### Problem

The homepage hero -- the first thing every visitor sees -- contains:

```jsx
<Heading as="h1" className={styles.heroTitle}>
    Documentation
</Heading>
<p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
```

The h1 is "Documentation." The tagline (from `docusaurus.config.js`) is "The AI Trust Platform for Enterprise." Neither tells a developer what OpenBox does, what problem it solves, or why they should keep reading.

The site's best copy -- "Transform AI agents from opaque 'black boxes' into transparent, auditable, and compliant systems" -- is buried on a different page (`docs/index.md` line 12). The strongest visual proof of minimal integration -- the before/after code change from `Worker` to `create_openbox_worker` -- is hidden inside carousel step 3.

A developer arriving from a search result, a colleague's link, or a conference talk gets zero signal in the first 3 seconds.

### Copy from openbox.ai (Marketing Site)

The marketing site at openbox.ai already has strong, polished copy. The docs site should align with it, not reinvent it. Here's what the marketing site uses:

**Hero:**
- Label: "AI Trust Platform"
- Headline: **"Goodbye AI Blind Spots. Hello Trust."**
- Subheadline: "OpenBox turns opaque AI behavior into governed, attested execution -- enforcing identity, authorization, policy, and risk decisions at runtime across every agent action and cross-system interaction."

**Problem section -- "Immediately Transform Agentic Liability":**
- "Without verifiable oversight, consistent governance, and real-time visibility, AI remains too risky to deploy at scale."
- Pain point 1: "Governance Is Fragmented Across Too Many Tools" -- "Identity, policy, risk, and compliance live in disconnected systems, making governance difficult to standardize."
- Pain point 2: "Agent Actions Aren't Visible Until After an Error Occurs" -- "Agents make decisions without real-time oversight, leaving teams blind to risks until it's too late."
- Pain point 3: "Companies Can't Prove How AI Makes Its Decisions" -- "Opaque reasoning makes it impossible to explain, and validate AI behaviour to stakeholders and regulators."

**Solution section -- "Trustworthy AI for Enterprise Scale":**
- "OpenBox's turnkey solution immediately connects to your existing AI systems, ensuring minimal overhead with complete visibility."
- Feature 1: **"Turnkey Integration"** -- "Integrate OpenBox into your existing workflows with a single SDK and no architectural changes."
- Feature 2: **"Real-time Visibility & Control"** -- "Monitor agent behavior, decisions, and tool usage in real time, with the ability to intervene, pause, or enforce policies before risk escalates."
- Feature 3: **"Verify Every Action"** -- "Attest every agent action, input, and output so behavior is provable, auditable, and defensible by default."
- Feature 4: **"Dynamic Agent Risk Scoring"** -- "Continuously assess agent risk based on behavior, context, and policy adherence, enabling adaptive controls instead of static rules."
- Feature 5: **"The Unified Governance Stack"** -- "Replace fragmented governance tools with a single trust platform that spans identity, policy, compliance, and runtime enforcement."

**Architecture section -- "Zero Blindspot Trust Architecture":**
- "OpenBox's trust platform makes every agent action traceable, every output verifiable, and every decision governable."
- Capabilities: Cryptographic Verifiability, Decentralized Identity (DID) for Agents, Protocol-Aware Runtime Governance, Modular Architecture, LLM Provenance & Content Protection

**Integration section -- "Immediate Visibility Without Delay":**
- "Integrate OpenBox in 3 Steps."
- Step 1: Generate OpenBox API Key
- Step 2: Install OpenBox SDK
- Step 3: Configure Governance Rules
- "AI Trust Activated"

**Use cases section -- "How Enterprises Use OpenBox":**
- "OpenBox is able to tailor purpose-built solutions to fit each company's workflows, risks, and compliance needs to ensure safe, verifiable AI."
- Trust: "Establish a shared trust ecosystem that enables agents to operate safely across teams, partners, and organizations."
- Compliance: "Ensure AI systems operate within regulatory and compliance boundaries."
- Content Provenance: "Guarantee the origin, integrity, and authenticity of AI-generated content."

**Compliance section:** "Ensure Enterprise Compliance" -- "OpenBox ensures your AI stack is compliant with regulations wherever you deploy." (with 7 compliance certification logos)

**Final CTA:** "Trustworthy AI Starts Here"

**Footer tagline:** "Goodbye AI Blind Spots. Hello Trust."

### Changes

#### 1a. Rewrite the `HomepageHeader` component

**File:** `website/src/pages/index.js` lines 248-267

Replace the hero with copy that aligns with the marketing site while being docs-specific. The marketing site hero is "Goodbye AI Blind Spots. Hello Trust." -- the docs site should complement this, not duplicate it. The docs hero should be more developer-oriented and action-oriented.

**Current:**
```jsx
function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={clsx('container', styles.heroInner)}>
        <div className={styles.heroLeft}>
          <Heading as="h1" className={styles.heroTitle}>
            Documentation
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={styles.heroCtas}>
            <Link className={clsx('button button--primary', styles.ctaPrimary)} to="/docs/">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
```

**Recommended hero copy options** (drawing from the marketing site's language):

| Element | Option A (developer-forward) | Option B (mirrors marketing) | Option C (outcome-focused) |
|---------|------------------------------|------------------------------|---------------------------|
| **Label** (small text above h1) | "AI Trust Platform" | "AI Trust Platform" | "AI Trust Platform" |
| **h1** | "Govern your AI agents with one line of code" | "Goodbye AI Blind Spots. Hello Trust." | "Turnkey governance for your AI agents" |
| **Subtitle** | "Integrate OpenBox into your existing workflows with a single SDK and no architectural changes. Enforce policies, capture audit trails, and attest every action at runtime." | "OpenBox turns opaque AI behavior into governed, attested execution. Integrate with a single SDK -- no architectural changes." | "One SDK. No code changes. Every agent action traceable, every output verifiable, every decision governable." |
| **Primary CTA** | "Get started" -> `/docs/getting-started` | "Get started" -> `/docs/getting-started` | "Get started" -> `/docs/getting-started` |
| **Secondary CTA** | "View on GitHub" -> SDK repo | "View on GitHub" -> SDK repo | "View on GitHub" -> SDK repo |

**Recommendation:** Option A. The marketing site handles brand messaging ("Goodbye AI Blind Spots"). The docs site should be the developer entry point -- concrete, action-oriented, and immediately communicating what the developer will do. "Govern your AI agents with one line of code" is a specific, testable claim that a developer will want to verify (which the carousel and getting-started flow deliver on).

The subtitle from Option A reuses the marketing site's strongest feature description ("Integrate OpenBox into your existing workflows with a single SDK and no architectural changes") and extends it with the three core capabilities.

#### 1b. Add a code proof section between hero and explore grid

**File:** `website/src/pages/index.js` (new section inserted around line 296, between `<HomepageHeader />` and the explore section)

Add a section that shows the before/after code change inline on the homepage. This is currently buried in carousel step 3 as a tiny snippet (`Worker(...)` -> `create_openbox_worker(...)`). The homepage should show the full, real code change -- it's the single strongest proof that the "one line of code" / "turnkey integration" claim from both the marketing site and the docs hero is real.

The marketing site says "Integrate OpenBox in 3 Steps" with API key, SDK install, configure rules. The docs homepage should show the actual code for step 2 (the SDK integration) because that's what developers care about most.

Use the same `<CodeBlock>` component already imported on line 7 and the same tabbed before/after pattern used in `wrap-an-existing-agent.md`:

```
Before (Temporal):              After (OpenBox):
worker = Worker(                worker = create_openbox_worker(
    client,                         client=client,
    task_queue="...",               task_queue="...",
    workflows=[...],                workflows=[...],
    activities=[...],               activities=[...],
)                                   openbox_url=os.getenv("OPENBOX_URL"),
                                    openbox_api_key=os.getenv("OPENBOX_API_KEY"),
                                )
```

Below the code, a one-liner: "Your workflows and activities stay exactly as they are. OpenBox wraps the worker."

#### 1c. Update the site tagline

**File:** `website/docusaurus.config.js` line 14

The tagline is used in `<meta>` description, OpenGraph tags, and as the hero subtitle fallback. It should match the new hero copy.

```js
// Current:
tagline: 'The AI Trust Platform for Enterprise',

// If using Option A hero:
tagline: 'Integrate OpenBox into your existing workflows with a single SDK and no architectural changes.',

// Or shorter for meta/OG:
tagline: 'Turnkey governance, compliance, and audit trails for your AI agents',
```

This tagline also appears in the HTML `<meta>` description, OpenGraph tags, and the homepage subtitle fallback.

#### 1d. Refine the carousel framing

**File:** `website/src/pages/index.js` lines 316-328

The carousel section title says "Try it out". Change to something like "Get running in 4 steps" to make the purpose clearer. The carousel itself is well-built and should stay.

**Current (line 320):**
```jsx
<div className={styles.tryTitle}>Try it out</div>
```

**After:**
```jsx
<div className={styles.tryTitle}>Get running in 4 steps</div>
```

---

## Issue 2: "Get Started" Button Goes to the Wrong Page

**Priority:** P0
**Files to change:**
- `website/src/pages/index.js` (line 260)

### Problem

The homepage "Get started" CTA links to `/docs/` -- the docs root page. That page is an overview with "The Problem", "The Solution", a persona table, a capabilities table, and 7 card links. It's useful reference content, but it's not the start of the onboarding journey.

The actual onboarding page lives at `/docs/getting-started` -- one more click away. A developer clicking "Get started" expects to... get started. Instead they land on an overview and have to find the real getting-started page themselves.

The flow today:

```
Homepage → [Get started] → /docs/ (overview, 7 cards) → [Getting Started card] → /docs/getting-started (actual onboarding)
```

The flow should be:

```
Homepage → [Get started] → /docs/getting-started (actual onboarding)
```

### Changes

#### 2a. Change the CTA link

**File:** `website/src/pages/index.js` line 260

**Current:**
```jsx
<Link className={clsx('button button--primary', styles.ctaPrimary)} to="/docs/">
  Get started
</Link>
```

**After:**
```jsx
<Link className={clsx('button button--primary', styles.ctaPrimary)} to="/docs/getting-started">
  Get started
</Link>
```

#### 2b. Update the Explore section "Introduction" link

**File:** `website/src/pages/index.js` line 15

The first link in the explore section is `{label: 'Introduction', to: '/docs/'}`. "Introduction" is vague and goes to the same overview page. Replace it with a direct link to the getting started page.

**Current:**
```js
{label: 'Introduction', to: '/docs/'},
```

**After:**
```js
{label: 'Getting Started', to: '/docs/getting-started'},
```

#### 2c. Keep `/docs/` accessible

The docs root (`/docs/index.md`) remains accessible from:
- The sidebar ("Overview" at the top)
- The footer ("Getting Started" and other deep links)
- Direct URL

No changes needed to the docs root page itself. It works well as a reference landing page -- it just shouldn't be the first click in the onboarding funnel.

---

## Issue 3: Getting Started Page Opens with the Wrong Content

**Priority:** P1
**Files to change:**
- `website/docs/getting-started/index.md`

### Problem

The Getting Started page opens with two sections of reference material before showing the user how to actually get started:

```
Line 12: # Getting Started
Line 14: ## Why OpenBox Uses Temporal        ← reference material
Line 16-22: [Temporal concept mapping table]  ← reference material
Line 24: ## How OpenBox Maps to Temporal      ← reference material
Line 28-34: [Governance timing table]         ← reference material
Line 36: ## Prerequisites                     ← NOW we're getting started
...
Line 143: ## Choose Your Path                 ← the actual decision point
```

A new user scanning this page has to scroll past two tables of Temporal-to-OpenBox mapping before they find the actual paths forward. This content is valuable -- but it belongs after the path selection (or on the Temporal 101 page), not before.

Additionally, the three path choices are presented as equal alternatives with no recommendation. Most first-time visitors should run the demo. Without guidance, they stall at a three-way decision.

### Changes

#### 3a. Restructure the page order

**File:** `website/docs/getting-started/index.md`

Reorder the sections to put the actionable content first:

```markdown
# Getting Started

OpenBox integrates with your existing workflow engine by wrapping the worker process.
All trust configuration happens in the OpenBox dashboard -- your agent code stays unchanged.

## Choose Your Path                         ← MOVED UP: decision point first

:::tip Recommended
Most users should start with **[Run the Demo](/docs/getting-started/run-the-demo)**
to see OpenBox governance in action before integrating with your own agent.
:::

[Three path cards: Temporal 101 / Run the Demo / Wrap an Existing Agent]

## Prerequisites                            ← STAYS: needed before any path

[Prerequisites content unchanged]

## How OpenBox Connects to Temporal         ← MOVED DOWN: reference material

[Why OpenBox Uses Temporal content]
[Temporal concept mapping table]
[Governance timing table]

## Want to Go Deeper?                       ← STAYS at bottom

[Deep-dive links]
```

The key moves:
1. "Choose Your Path" moves from line 143 up to directly after the intro paragraph
2. Add a recommended path callout before the three cards
3. "Why OpenBox Uses Temporal" and "How OpenBox Maps to Temporal" move below prerequisites as optional context
4. Consider consolidating both Temporal mapping sections under one heading: "How OpenBox Connects to Temporal"

#### 3b. Add a recommended path callout

**File:** `website/docs/getting-started/index.md`

Insert before the three path cards:

```markdown
:::tip Recommended
Most users should start with **[Run the Demo](/docs/getting-started/run-the-demo)**
to see OpenBox governance in action before integrating with your own agent.
:::
```

This eliminates decision paralysis. The three paths still exist for people who know what they want, but the 80% case gets a clear nudge.

#### 3c. Make the path cards visually distinct

**File:** `website/docs/getting-started/index.md` lines 145-173

Currently the three paths are plain `<div className="col col--4">` with markdown headers. Consider using the same `linear-card` pattern from `docs/index.md` (lines 54-69) for visual consistency across the site:

```jsx
<div className="linear-cards">
  <Link className="linear-card" to="/docs/getting-started/temporal-101">
    <div className="linear-card__content">
      <h3 className="linear-card__title">New to Temporal?</h3>
      <p className="linear-card__description">Quick primer on Workflows, Activities, and Workers.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">></span>
  </Link>
  <!-- Run the Demo card -->
  <!-- Wrap an Existing Agent card -->
</div>
```

This reuses existing CSS (`.linear-card` styles already exist in `custom.css`) and creates consistent card styling.

---

## Issue 4: No Guided Path from "Running" to "Configured"

**Priority:** P1
**Files to change:**
- `website/docs/getting-started/configure-governance.md` (NEW)
- `website/docs/getting-started/run-the-demo.md` (update Next Steps)
- `website/docs/getting-started/wrap-an-existing-agent.md` (update Next Steps)
- `website/sidebars.js` (add new page)

### Problem

After completing either "Run the Demo" or "Wrap an Existing Agent," the user has a running agent with OpenBox connected. The next logical question is: "How do I configure guardrails, policies, and behavioral rules?"

Both pages point to **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** as the first next step. That page is 807 lines of reference documentation covering all three authorization layers with detailed field descriptions, Rego examples, and test payloads. It's the reference manual, not a tutorial.

The gap:

```
Run the Demo (guided, step-by-step)
    ↓
"Next Steps: Configure Trust Controls" → authorize.md (807-line reference page)
    ↓
User is overwhelmed. Where do they start? Which guardrail first? What does Rego mean?
```

What's needed:

```
Run the Demo (guided, step-by-step)
    ↓
"Next Steps: Configure Governance" → configure-governance.md (guided tutorial)
    ↓
User creates their first guardrail, policy, and behavioral rule with hand-holding
    ↓
"Want more?" → authorize.md (full reference for advanced configuration)
```

### Changes

#### 4a. Create a new tutorial page

**File:** `website/docs/getting-started/configure-governance.md` (NEW)

This page walks a user through creating one of each governance control type using the dashboard. It should be task-oriented ("do this, then this") not reference-oriented ("here's what each field means").

**Proposed structure:**

```markdown
---
title: Configure Governance
description: Create your first guardrail, policy, and behavioral rule
sidebar_position: 4
---

# Configure Governance

You have an agent running with OpenBox. Now configure governance to control what
it can do. This guide walks through creating one of each control type in the
dashboard.

## Create a Guardrail (PII Detection)

Guardrails validate and transform inputs and outputs. Start with PII detection
to automatically mask personal information.

1. Open the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** -> click your agent
3. Click the **Authorize** tab -> **Guardrails** sub-tab
4. Click **Create Guardrail**
5. Fill in:
   - **Name:** `PII Masking - User Prompts`
   - **Processing State:** Pre-processing
   - **Guardrail Type:** PII Detection
   - **PII Entities to Detect:** `PHONE_NUMBER`, `EMAIL_ADDRESS`
   - **Fields to Check:** `input.prompt`
   - **Block on Violation:** On
   - **Log Violations:** On
6. Test it using the built-in **Test Guardrail** panel:

   Paste this test payload:

   ```json
   {
     "activity_type": "agent_validatePrompt",
     "event_type": "ActivityCompleted",
     "input": {
       "prompt": "My phone number is 555-867-5309, please book the flight"
     }
   }
   ```

   Click **Run Test**. The validated output should show `<PHONE_NUMBER>` replacing
   the phone number.

7. Click **Save** to activate the guardrail

Now trigger your agent. If the user sends a message containing a phone number,
the guardrail will detect it and either mask it or block the operation.

## Create a Policy (OPA/Rego)

Policies use OPA/Rego for stateless permission checks. Create a policy that
requires human approval before creating invoices.

1. Navigate to **Authorize** tab -> **Policies** sub-tab
2. Click **Create Policy**
3. Set the **Policy Name** to `Require approval for invoices`
4. Paste this Rego code:

   ```rego
   package openbox

   default result := {"decision": "CONTINUE", "reason": ""}

   result := {"decision": "REQUIRE_APPROVAL", "reason": "Invoice creation requires human approval"} if {
       input.activity_type == "agent_toolPlanner"
       input.activity_output.tool == "CreateInvoice"
   }
   ```

5. Click **Save**

When the agent tries to create an invoice, it will pause and send an approval
request to the **Approvals** queue. A human reviewer approves or rejects it.

> **New to Rego?** Test policies in the [OPA Playground](https://play.openpolicyagent.org/)
> before pasting them into OpenBox.

## Create a Behavioral Rule

Behavioral rules detect multi-step patterns. Create a rule that halts agents
which try to generate file output without querying the database first --
preventing reports built on fabricated data.

1. Navigate to **Authorize** tab -> **Behavioral Rules** sub-tab
2. Click **Create Rule**
3. **Step 1 - Basic Info:**
   - **Rule Name:** `Query Data Before Generating Reports`
   - **Priority:** `50`
4. **Step 2 - Trigger:** Select `file_write`
5. **Step 3 - States:** Select `database_select` as required prior state
6. **Step 4 - Enforcement:**
   - **Verdict:** `HALT`
   - **On Reject Message:** `File write halted: the agent must query the database before generating file output`
7. Click **Create Rule**

If an agent attempts to write a file without first running a database query, the
entire session is terminated immediately.

## What You've Configured

| Control | What it does | Decision |
|---------|-------------|----------|
| **Guardrail** (PII Detection) | Masks phone numbers and emails in user input | BLOCK if violation + Block on Violation enabled |
| **Policy** (OPA/Rego) | Requires approval before invoice creation | REQUIRE_APPROVAL |
| **Behavioral Rule** | Halts agents that skip database queries before file output | HALT |

These three controls demonstrate the three layers of the
[Authorization Pipeline](/docs/trust-lifecycle/authorize):
Guardrails -> Policies -> Behavioral Rules.

## Next Steps

- **[Authorize Reference](/docs/trust-lifecycle/authorize)** -- Full reference
  for all guardrail types, policy patterns, and behavioral rule configuration
- **[Approvals](/docs/approvals)** -- Review and act on REQUIRE_APPROVAL decisions
- **[Monitor Sessions](/docs/trust-lifecycle/monitor)** -- Watch your governance
  controls in action via Session Replay
- **[Error Handling](/docs/developer-guide/error-handling)** -- Handle
  GovernanceStop and ApprovalPending exceptions in your activities
```

#### 4b. Add to sidebar

**File:** `website/sidebars.js` lines 25-30

**Current:**
```js
items: [
    'getting-started/temporal-101',
    'getting-started/run-the-demo',
    'getting-started/wrap-an-existing-agent',
    'getting-started/troubleshooting',
],
```

**After:**
```js
items: [
    'getting-started/temporal-101',
    'getting-started/run-the-demo',
    'getting-started/wrap-an-existing-agent',
    'getting-started/configure-governance',
    'getting-started/troubleshooting',
],
```

This places "Configure Governance" as the natural step after wrapping an agent and before troubleshooting.

#### 4c. Update Next Steps in Run the Demo

**File:** `website/docs/getting-started/run-the-demo.md` lines 125-131

**Current:**
```markdown
## Next Steps

- **[How the Integration Works](/docs/developer-guide/temporal-integration-guide-python#how-the-integration-works)** — ...
- **[Extending the Demo Agent](/docs/developer-guide/customizing-your-agent)** — ...
- **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** — ...
- **[Monitor Sessions](/docs/trust-lifecycle/monitor)** — ...
```

**After:**
```markdown
## Next Steps

- **[Configure Governance](/docs/getting-started/configure-governance)** — Create your first guardrail, policy, and behavioral rule
- **[Monitor Sessions](/docs/trust-lifecycle/monitor)** — Watch governance decisions in real-time via Session Replay
- **[Extending the Demo Agent](/docs/developer-guide/customizing-your-agent)** — Add your own goals, tools, and MCP integrations
- **[How the Integration Works](/docs/developer-guide/temporal-integration-guide-python#how-the-integration-works)** — Understand the code change that connects your agent
```

The tutorial becomes the first next step. The reference page (`authorize.md`) is now linked from the tutorial's own next steps, not directly from the getting started flow.

#### 4d. Update Next Steps in Wrap an Existing Agent

**File:** `website/docs/getting-started/wrap-an-existing-agent.md` lines 229-237

**Current:**
```markdown
## Next Steps

Now that your agent is running with OpenBox:

1. **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** - Set up guardrails, policies, and behavioral rules
2. **[Monitor Sessions](/docs/trust-lifecycle/monitor)** - ...
3. **[Set Up Approvals](/docs/approvals)** - ...
4. **[Advanced Configuration](/docs/developer-guide/configuration)** - ...
```

**After:**
```markdown
## Next Steps

Now that your agent is running with OpenBox:

1. **[Configure Governance](/docs/getting-started/configure-governance)** - Create your first guardrail, policy, and behavioral rule
2. **[Monitor Sessions](/docs/trust-lifecycle/monitor)** - Watch governance decisions in real-time via Session Replay
3. **[Set Up Approvals](/docs/approvals)** - Add human-in-the-loop for sensitive operations
4. **[Advanced Configuration](/docs/developer-guide/configuration)** - Fine-tune timeouts, fail policies, and event filtering
```

---

## Issue 5: Authorize Page is Too Long for a Single Page

**Priority:** P1
**Files to change:**
- `website/docs/trust-lifecycle/authorize.md` (split into 4 files)
- `website/docs/trust-lifecycle/authorize/index.md` (NEW)
- `website/docs/trust-lifecycle/authorize/guardrails.md` (NEW)
- `website/docs/trust-lifecycle/authorize/policies.md` (NEW)
- `website/docs/trust-lifecycle/authorize/behavioral-rules.md` (NEW)
- `website/sidebars.js` (update Trust Lifecycle category)

### Problem

The Authorize page is 807 lines covering three conceptually distinct topics:

| Section | Lines | Topic | Audience |
|---------|-------|-------|----------|
| Lines 1-61 | Pipeline overview | How the three layers work together | Everyone |
| Lines 62-400 | Guardrails | PII detection, content filtering, toxicity, ban words with field docs and test examples | Security teams, configured in dashboard UI |
| Lines 401-636 | Policies | OPA/Rego examples, testing, runtime enforcement | Developers/security engineers who know Rego |
| Lines 637-779 | Behavioral Rules | 4-step wizard, prior state logic, test examples | Security teams, configured in dashboard UI |
| Lines 780-807 | Governance Decisions + Trust Tiers | Decision types and tier defaults | Everyone |

A developer looking for "how to write a Rego policy" has to scroll past 400 lines of guardrail documentation. A security team member setting up guardrails in the UI has to land on a page that also contains Rego code. The page tries to serve three different audiences and three different tasks.

### Changes

#### 5a. Create the `authorize/` directory and split

Delete `website/docs/trust-lifecycle/authorize.md` and create four files:

**File 1: `website/docs/trust-lifecycle/authorize/index.md`**

Content: Lines 1-61 of the current file (pipeline overview, Mermaid diagram, "How Multiple Rules Execute" table) plus lines 780-807 (Governance Decisions summary, Trust Tier-Based Defaults, and "Next Phase" link).

This becomes the category landing page -- the 30-second overview of how authorization works.

```markdown
---
title: Authorize
description: Phase 2 - Configure guardrails, policies, and behavioral rules
sidebar_position: 2
---

# Authorize (Phase 2)

The Authorize phase defines what the agent is allowed to perform. Configure
guardrails, policies, and behavioral rules to enforce governance.

Access via **Agent Detail -> Authorize** tab.

## Authorization Pipeline

[Mermaid diagram - unchanged]

### How Multiple Rules Execute

[Execution model table - unchanged]

## Governance Decisions

[Decision table from lines 780-789 - unchanged]

## Trust Tier-Based Defaults

[Tier table from lines 791-801 - unchanged]

## Next Phase

[Monitor link - unchanged]
```

**File 2: `website/docs/trust-lifecycle/authorize/guardrails.md`**

Content: Lines 66-400 of the current file (Guardrails section with all four types: PII Detection, Content Filtering, Toxicity, Ban Words, plus the Create Guardrail form fields).

```markdown
---
title: Guardrails
description: Input/output validation and transformation
sidebar_position: 1
---

# Guardrails

[All content from lines 66-400, unchanged]
```

**File 3: `website/docs/trust-lifecycle/authorize/policies.md`**

Content: Lines 401-636 of the current file (Policies section with Create Policy, Edit Policy, Rego examples, runtime enforcement).

```markdown
---
title: Policies
description: OPA/Rego stateless permission checks
sidebar_position: 2
---

# Policies

[All content from lines 401-636, unchanged]
```

**File 4: `website/docs/trust-lifecycle/authorize/behavioral-rules.md`**

Content: Lines 638-779 of the current file (Behavioral Rules section with wizard steps, prior state logic, test examples).

```markdown
---
title: Behavioral Rules
description: Stateful multi-step pattern detection
sidebar_position: 3
---

# Behavioral Rules

[All content from lines 638-779, unchanged]
```

#### 5b. Update the sidebar

**File:** `website/sidebars.js` lines 49-53

**Current:**
```js
'trust-lifecycle/assess',
'trust-lifecycle/authorize',
'trust-lifecycle/monitor',
```

**After:**
```js
'trust-lifecycle/assess',
{
    type: 'category',
    label: 'Authorize',
    link: {
        type: 'doc',
        id: 'trust-lifecycle/authorize/index',
    },
    items: [
        'trust-lifecycle/authorize/guardrails',
        'trust-lifecycle/authorize/policies',
        'trust-lifecycle/authorize/behavioral-rules',
    ],
},
'trust-lifecycle/monitor',
```

#### 5c. Update all internal links to `/docs/trust-lifecycle/authorize`

The current URL `/docs/trust-lifecycle/authorize` will change to `/docs/trust-lifecycle/authorize/` (the index). Docusaurus should handle this with the category link, but verify these cross-references still work:

- `docs/getting-started/run-the-demo.md` line 129 (or updated by Issue 4)
- `docs/getting-started/wrap-an-existing-agent.md` line 233 (or updated by Issue 4)
- `docs/index.md` (no direct link -- uses Trust Lifecycle)
- `docs/trust-lifecycle/index.md` line 95
- `docs/trust-lifecycle/assess.md` (check for "Next Phase" link)
- `docs/core-concepts/governance-decisions.md` line 125
- `docs/getting-started/configure-governance.md` (the new tutorial from Issue 4)

Any link to `/docs/trust-lifecycle/authorize` should continue to work since the index page takes over that URL. Links to specific sections (like `authorize#guardrails`) will need updating to point to the new sub-pages.

---

## Implementation Order

These issues have dependencies:

```
Issue 1 (Homepage hero)          -- independent, do first
Issue 2 (CTA link)               -- independent, do with Issue 1
Issue 3 (Getting Started reorg)  -- independent
Issue 4 (Configure Governance)   -- depends on Issue 5 for accurate links
Issue 5 (Split Authorize)        -- do before Issue 4 to get URLs right
```

**Recommended sequence:**

1. **Issues 1 + 2** together (homepage changes, one PR)
2. **Issue 3** (Getting Started restructure, one PR)
3. **Issue 5** (Split Authorize, one PR -- get URLs stable)
4. **Issue 4** (New tutorial page + update Next Steps links, one PR)

## Verification

After all changes:

1. `cd website && npm start` -- verify homepage renders with new hero
2. Click "Get started" -- should land on `/docs/getting-started` directly
3. Walk the "Run the Demo" path end-to-end: Getting Started -> Run the Demo -> Configure Governance -> Authorize reference
4. Walk the "Wrap an Existing Agent" path: Getting Started -> Wrap Agent -> Configure Governance
5. Verify the Authorize sub-pages render correctly and sidebar nesting works
6. `npm run build` -- Docusaurus `onBrokenLinks: 'throw'` will catch any broken cross-references
7. Search for `trust-lifecycle/authorize` across all markdown files to verify no stale links remain
