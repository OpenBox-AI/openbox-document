# Critical Review: OpenBox Documentation Site

## Context

This review assesses the end-to-end journey from a new visitor landing on docs.openbox.ai to being up and running with Temporal, OpenBox, and configuring guardrails, policies, and behaviors. The review evaluates enterprise credibility, onboarding flow, and content quality across three personas: developers new to everything, experienced Temporal developers, and people new to OpenBox.

---

## What's Working Well

Before the issues -- credit where it's due:

- **The "Wrap an Existing Agent" page is excellent** -- 5-line code change with clear before/after tabs, collapsible output details, and a strong "What Just Happened?" section
- **The Authorization Pipeline documentation** is comprehensive with real Rego examples, test payloads, and behavioral rule test cases
- **The Trust Lifecycle model** (Assess -> Authorize -> Monitor -> Verify -> Adapt) is well-designed and clearly explained
- **Cryptographic attestation** documentation adds genuine enterprise credibility
- **Error handling docs** are developer-friendly with specific exception types and handling patterns
- **The 4-step homepage carousel** with GIF screenshots is well-built
- **Copy quality** is consistently clear, concise, and actionable throughout

---

## Critical Issues (Prioritized)

### P0: Homepage Fails to Communicate What OpenBox Does

**Files:** `website/src/pages/index.js`, `website/docusaurus.config.js`

The hero title is literally "Documentation" -- the most generic word possible. The subtitle "The AI Trust Platform for Enterprise" is vague. A developer landing here from a search result or referral link gets zero signal about what this product does or why they should care.

**Recommended changes:**

1. Replace the h1 with a value-proposition headline, e.g.: "Govern your AI agents with one line of code"
2. Replace the subtitle with something concrete, e.g.: "Add trust, compliance, and audit-grade evidence to your Temporal agents -- without changing your code."
3. Add a secondary CTA button linking to the GitHub SDK repo (currently only in navbar)
4. Surface the best copy from `docs/index.md` line 12 ("Transform AI agents from opaque 'black boxes'...") onto the homepage -- it's buried one click away
5. Show the before/after code snippet (`Worker` -> `create_openbox_worker`) above the fold -- this is the strongest proof of minimal integration and it's currently hidden in carousel step 3

### P0: Two Entry Points Create a Confusing First Click

**Files:** `website/src/pages/index.js` (line 260), `website/docs/index.md`

The homepage "Get started" button goes to `/docs/` (overview page with problem/solution/personas/7 card links). The actual getting-started content is at `/docs/getting-started` -- one more click away. That's one click too many.

**Recommended change:** Change the homepage CTA from `/docs/` to `/docs/getting-started`. Keep `/docs/` as a reference landing page reachable from the sidebar.

### P1: Getting Started Page Opens with the Wrong Content

**File:** `website/docs/getting-started/index.md`

The page opens with "Why OpenBox Uses Temporal" and a Temporal-to-OpenBox concept mapping table. This is reference material that interrupts the onboarding flow. A new user wants "how do I start?", not "why Temporal?"

**Recommended changes:**

1. Move "Why OpenBox Uses Temporal" and the mapping tables below "Choose Your Path" or to Temporal 101 where they belong conceptually
2. Add a recommended path callout above the three path choices:
   ```
   :::tip Recommended
   Most users: Start with Run the Demo to see OpenBox working before integrating.
   :::
   ```
3. Make the three path cards visually distinct (currently plain markdown headers)

### P1: No Guided Path from "Running" to "Configured"

**Gap between:** `getting-started/run-the-demo.md` -> `trust-lifecycle/authorize.md`

After running the demo or wrapping an agent, the "Next Steps" links jump to the Authorize reference page -- 800+ lines covering all three authorization layers with deep field descriptions, Rego examples, and test payloads. It's comprehensive but overwhelming as a next step.

**Recommended change:** Create a new tutorial page `getting-started/configure-governance.md` ("Configure Your First Guardrail") that:
1. Walks through creating one PII Detection guardrail step by step in the dashboard
2. Shows one OPA Policy (the invoice approval Rego example)
3. Shows one Behavioral Rule (the HALT test example)
4. Links to the full Authorize reference for everything else

Then update Next Steps in `run-the-demo.md` and `wrap-an-existing-agent.md` to point here first.

### P1: Authorize Page is Too Long for a Single Page

**File:** `website/docs/trust-lifecycle/authorize.md` (807 lines)

Three conceptually distinct topics (Guardrails, Policies, Behavioral Rules) crammed into one page. Each has different audiences and complexity levels.

**Recommended change:** Split into:
- `authorize/index.md` -- Pipeline overview, execution model, how layers interact
- `authorize/guardrails.md` -- Guardrail types, fields, test examples
- `authorize/policies.md` -- Rego examples, testing, runtime enforcement
- `authorize/behavioral-rules.md` -- Wizard steps, prior state logic, test examples

### P2: Sidebar Order Doesn't Match the Onboarding Flow

**File:** `website/sidebars.js`

Current order: Getting Started -> **Core Concepts** -> Trust Lifecycle -> Developer Guide -> Dashboard...

Core Concepts (Trust Scores, Trust Tiers, Governance Decisions) sits between Getting Started and Trust Lifecycle. It's reference material that blocks the natural flow.

**Recommended order:**
1. Overview
2. Getting Started
3. Trust Lifecycle (the operational heart)
4. Dashboard
5. Approvals
6. Developer Guide (reference)
7. Administration
8. Core Concepts (reference, moved down)
9. Glossary

### P2: Trust Lifecycle Has Confusing Duplicate "Overview" Pages

**Files:** `docs/trust-lifecycle/index.md`, `docs/trust-lifecycle/overview.md`

`index.md` = the Trust Lifecycle model overview. `overview.md` = the Agent Detail "Overview" tab documentation. Same label, different things.

**Recommended change:** Rename `overview.md` to `agent-overview.md` with sidebar label "Agent Sessions" or "Agent Overview Tab".

### P2: Developer Guide Has No Category Landing Page

**File:** `website/sidebars.js`

Clicking "Developer Guide" in sidebar just expands/collapses. No landing page.

**Recommended change:** Create `docs/developer-guide/index.md` with a brief guide to all developer resources.

### P2: "Run the Demo" and "Temporal Integration Guide" Overlap

**Files:** `docs/getting-started/run-the-demo.md`, `docs/developer-guide/temporal-integration-guide-python.md`

Both cover cloning the demo, configuring `.env`, running, and viewing results. The Integration Guide adds scenarios, HITL, and config options.

**Recommended change:** Refocus the Integration Guide as a deep-dive that opens with "This guide assumes you've completed Run the Demo" and removes the duplicated setup steps.

### P2: Homepage Explore Section Doesn't Match Personas

**File:** `website/src/pages/index.js` (lines 11-36)

Current columns: "Try it out", "Agents", "Operations". The first link "Introduction" goes to `/docs/` -- vague and overlapping with the CTA.

**Recommended change:** Rename columns to be persona-oriented:
- **Developers** -- Getting Started, SDK Reference, Wrap Your Agent
- **Security & Compliance** -- Trust Lifecycle, Audit & Evidence, Attestation
- **Operations** -- Dashboard, Approvals, Alerts

### P3: Enterprise Credibility Gaps

These aren't blocking but matter for enterprise buyers:

1. **No architecture diagram** showing where OpenBox sits in infrastructure -- add a Mermaid diagram to `docs/index.md` showing Your Infra -> SDK -> OpenBox Platform -> Dashboard
2. **No security/data handling page** -- enterprise buyers need to know: what data leaves their network, where it's stored, encryption posture, compliance certifications (even "SOC 2 in progress")
3. **No changelog/release notes** -- blog is disabled, no version history visible. Even a simple `docs/changelog.md` signals maturity
4. **No status page link** -- enterprise buyers expect this

### P3: Minor Content Issues

1. Inline glossary terms on first use in Getting Started and Trust Lifecycle pages (currently most terms aren't linked)
2. The Temporal 101 page handoff to the next step is weak -- needs a strong callout pointing to Run the Demo

---

## The Complete Ideal Journey (After Changes)

### New to everything:
```
Homepage (clear value prop + code snippet)
  -> "Get started" button
  -> Getting Started (recommended path callout)
  -> "New to Temporal?" -> Temporal 101 (concepts)
  -> Run the Demo (clone, configure, run, see governance)
  -> Configure Governance tutorial (first guardrail, policy, rule)
  -> Trust Lifecycle deep-dive (Assess -> Authorize -> Monitor -> Verify -> Adapt)
```

### Experienced Temporal developer:
```
Homepage
  -> "Get started" button
  -> Getting Started (skip to "Wrap an Existing Agent")
  -> Wrap an Existing Agent (5-line change, done)
  -> Configure Governance tutorial
  -> Authorize reference (guardrails, policies, behavioral rules)
```

### Enterprise buyer evaluating:
```
Homepage (value prop clear)
  -> docs root (problem/solution, personas, capabilities)
  -> Trust Lifecycle overview
  -> Compliance & Audit + Attestation
  -> Security page (new)
```

---

## Implementation Phases

**Phase 1 -- Quick wins (1-2 days):**
- [ ] Change homepage hero title + subtitle (`index.js` + `docusaurus.config.js`)
- [ ] Change "Get started" CTA to `/docs/getting-started` (`index.js`)
- [ ] Add recommended path callout to Getting Started index
- [ ] Reorder sidebar (`sidebars.js`)

**Phase 2 -- Medium effort (3-5 days):**
- [ ] Redesign homepage Explore section columns
- [ ] Restructure Getting Started index (move Temporal sections down)
- [ ] Rename `trust-lifecycle/overview.md` to avoid confusion
- [ ] Create Developer Guide index page
- [ ] Reduce Integration Guide / Run the Demo overlap

**Phase 3 -- Significant effort (5-7 days):**
- [ ] Create "Configure Your First Guardrail" tutorial
- [ ] Split Authorize page into sub-pages
- [ ] Update Next Steps links across all getting-started pages
- [ ] Add architecture diagram to docs root

**Phase 4 -- Ongoing:**
- [ ] Add security/data handling page
- [ ] Add changelog page
- [ ] Inline glossary terms across docs
- [ ] Strengthen Temporal 101 handoff

## Verification

After implementation, verify by:
1. `npm start` in `website/` and walk through each persona journey end-to-end
2. Check all internal links work (Docusaurus `onBrokenLinks: 'throw'` will catch broken ones at build)
3. Test sidebar navigation order matches the expected flow
4. Verify the homepage renders correctly with new hero content
5. Test mobile responsiveness of any new/changed components
