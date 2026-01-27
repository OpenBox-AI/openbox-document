---
title: OpenBox
description: Enterprise AI Governance Platform
sidebar_label: Overview
slug: /
---

import Link from '@docusaurus/Link';

# OpenBox

**Transform AI agents from opaque "black boxes" into transparent, auditable, and compliant systems.**

---

## The Problem

AI agents take actions across tools, data, and systems--often without enough visibility, enforceable controls, or audit-grade evidence.

Teams struggle to answer critical questions:

- What did the agent do, end to end?
- Which data did it access or transmit?
- Which policies were evaluated, and what was the result?
- Who approved sensitive steps (and when)?

## The Solution

OpenBox adds a **governance layer** alongside your workflow engine (Temporal, n8n, LangChain, etc.). Your workflow engine remains the system of record for execution--OpenBox adds governance and visibility.

### How It Works

1. **Wrap your worker** with the OpenBox SDK (one function call)
2. **Configure governance** in the OpenBox dashboard
3. **Monitor and adapt** as your agents run

```python
# That's it. Your existing code stays the same.
worker = create_openbox_worker(
    client=temporal_client,
    task_queue="my-task-queue",
    workflows=[MyAgentWorkflow],
    activities=[my_activity],
)
```

---

## Key Capabilities

| Capability | Description |
|------------|-------------|
| **Trust Lifecycle** | 5-phase governance: Assess → Authorize → Monitor → Verify → Adapt |
| **Trust Scores** | Dynamic 0-100 scores that evolve based on agent behavior |
| **Human-in-the-Loop** | Built-in approval workflows for sensitive operations |
| **Behavioral Rules** | Detect multi-step violations that stateless rules miss |
| **Cryptographic Attestation** | Tamper-proof evidence for auditors |
| **Compliance Evidence** | Audit trails and attestations for auditors |

---

## Start Here

<div className="row">
  <div className="col col--6 margin-bottom--lg">
    <Link className="card padding--lg" to="/docs/getting-started/quick-start">
      <div className="card__header">
        <h3>Quick Start</h3>
      </div>
      <div className="card__body">
        Wrap your worker, run your first governed agent, and view events in the dashboard.
      </div>
    </Link>
  </div>
  <div className="col col--6 margin-bottom--lg">
    <Link className="card padding--lg" to="/docs/agents/trust-lifecycle">
      <div className="card__header">
        <h3>Trust Lifecycle</h3>
      </div>
      <div className="card__body">
        Learn the 5 phases: Assess, Authorize, Monitor, Verify, and Adapt.
      </div>
    </Link>
  </div>
</div>

---

## Explore the Platform

<div className="row">
  <div className="col col--4 margin-bottom--lg">
    <Link className="card padding--lg" to="/docs/dashboard">
      <div className="card__header">
        <h3>Dashboard</h3>
      </div>
      <div className="card__body">
        Trust overview, KPIs, and alerts for your organization.
      </div>
    </Link>
  </div>
  <div className="col col--4 margin-bottom--lg">
    <Link className="card padding--lg" to="/docs/agents">
      <div className="card__header">
        <h3>Agents</h3>
      </div>
      <div className="card__body">
        Register agents, configure trust lifecycle phases, and monitor behavior.
      </div>
    </Link>
  </div>
  <div className="col col--4 margin-bottom--lg">
    <Link className="card padding--lg" to="/docs/approvals">
      <div className="card__header">
        <h3>Approvals</h3>
      </div>
      <div className="card__body">
        Human-in-the-loop approval queue for high-risk operations.
      </div>
    </Link>
  </div>
</div>

<div className="row">
  <div className="col col--6 margin-bottom--lg">
    <Link className="card padding--lg" to="/docs/sdk">
      <div className="card__header">
        <h3>SDK</h3>
      </div>
      <div className="card__body">
        Minimal SDK integration--just wrap your workflow worker.
      </div>
    </Link>
  </div>
  <div className="col col--6 margin-bottom--lg">
    <Link className="card padding--lg" to="/docs/compliance">
      <div className="card__header">
        <h3>Compliance</h3>
      </div>
      <div className="card__body">
        Attestation and audit trails for auditors.
      </div>
    </Link>
  </div>
</div>
