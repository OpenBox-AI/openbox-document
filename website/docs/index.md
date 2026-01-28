---
title: OpenBox
description: Enterprise AI Trust Layer
sidebar_label: Overview
slug: /
---

import Link from '@docusaurus/Link';

# OpenBox

**Transform AI agents from opaque "black boxes" into transparent, auditable, and compliant systems.**

---

## The Problem

AI agents take actions across tools, data, and systems, often without enough visibility, enforceable controls, or audit-grade evidence.

Teams struggle to answer critical questions:

- What did the agent do, end to end?
- Which data did it access or transmit?
- Which policies were evaluated, and what was the result?
- Who approved sensitive steps (and when)?

## The Solution

OpenBox adds a **trust layer** alongside your workflow engine (Temporal, n8n, LangChain, etc.). Your workflow engine remains the system of record for execution, OpenBox adds trust and visibility.

## Who This Is For

| Team / Role | How they use OpenBox | Business outcome |
|------------|-----------------------|------------------|
| **Security / Trust & Safety** | Define policies and guardrails, review risky behavior, investigate incidents via Audit Log and Session Replay | Reduce security risk, shorten incident response time, enforce consistent controls |
| **Engineering (Platform / AI Infra)** | Integrate the SDK into workers, standardize instrumentation, set trust controls across many agents | Faster rollouts, fewer regressions, consistent enterprise-wide controls |
| **Product (AI Product Owners)** | Monitor agent reliability, iterate on controls as capabilities change, track approvals and exceptions | Ship AI features faster with clear safety boundaries and measurable reliability |
| **Compliance / Audit** | Export audit-ready evidence and attestations, review decision trails for audits and reviews | Lower audit friction, repeatable evidence collection, easier stakeholder sign-off |
| **Operations (Support / Finance / IT)** | Act as approvers for sensitive actions and escalations, verify changes and outcomes | Controlled execution for high-impact actions, fewer costly mistakes |

## Key Capabilities

| Capability | Description |
|------------|-------------|
| **Trust Lifecycle** | 5-phase trust loop: Assess → Authorize → Monitor → Verify → Adapt |
| **Trust Scores** | Dynamic 0-100 scores that evolve based on agent behavior |
| **Human-in-the-Loop** | Built-in approval workflows for sensitive operations |
| **Behavioral Rules** | Detect multi-step violations that stateless rules miss |
| **Cryptographic Attestation** | Tamper-proof evidence for auditors |
| **Compliance Evidence** | Audit trails and attestations for auditors |

## Start Here

<div className="linear-cards">
  <Link className="linear-card" to="/docs/getting-started/quick-start">
    <div className="linear-card__content">
      <h3 className="linear-card__title">Quick Start</h3>
      <p className="linear-card__description">Wrap your worker, run your first trusted agent, and view events in the dashboard.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">›</span>
  </Link>
  <Link className="linear-card" to="/docs/agents/trust-lifecycle">
    <div className="linear-card__content">
      <h3 className="linear-card__title">Trust Lifecycle</h3>
      <p className="linear-card__description">Learn the 5 phases: Assess, Authorize, Monitor, Verify, and Adapt.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">›</span>
  </Link>
</div>

---

## Explore the Platform

<div className="linear-cards">
  <Link className="linear-card" to="/docs/dashboard">
    <div className="linear-card__content">
      <h3 className="linear-card__title">Dashboard</h3>
      <p className="linear-card__description">Trust overview, KPIs, and alerts for your organization.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">›</span>
  </Link>
  <Link className="linear-card" to="/docs/agents">
    <div className="linear-card__content">
      <h3 className="linear-card__title">Agents</h3>
      <p className="linear-card__description">Register agents, configure trust lifecycle phases, and monitor behavior.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">›</span>
  </Link>
  <Link className="linear-card" to="/docs/approvals">
    <div className="linear-card__content">
      <h3 className="linear-card__title">Approvals</h3>
      <p className="linear-card__description">Human-in-the-loop approval queue for high-risk operations.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">›</span>
  </Link>
  <Link className="linear-card" to="/docs/sdk">
    <div className="linear-card__content">
      <h3 className="linear-card__title">SDK</h3>
      <p className="linear-card__description">Minimal SDK integration - just wrap your workflow worker.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">›</span>
  </Link>
  <Link className="linear-card" to="/docs/compliance">
    <div className="linear-card__content">
      <h3 className="linear-card__title">Compliance</h3>
      <p className="linear-card__description">Attestation and audit trails for auditors.</p>
    </div>
    <span className="linear-card__chevron" aria-hidden="true">›</span>
  </Link>
</div>
