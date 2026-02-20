---
title: Verify
description: Phase 4 - Validate goal alignment and detect drift
sidebar_position: 4
---

# Verify (Phase 4)

The Verify phase validates that agents act in alignment with their stated goals. Detect drift, review reasoning traces, and ensure intent consistency.

Access via **Agent Detail → Verify** tab.

## Sub-tabs

### Goal Alignment

Monitor alignment between agent actions and stated goals.

#### Session Selector

A dropdown at the top of the tab to pick which session to inspect, including session metadata such as ID, status, and duration.

#### Alignment Score

A 0-100% score indicating how well actions match goals:

| Range | Status | Meaning |
|-------|--------|---------|
| **90-100%** | Excellent | Actions strongly aligned with goals |
| **70-89%** | Good | Minor deviations, acceptable |
| **50-69%** | Warning | Notable drift, review recommended |
| **Below 50%** | Misaligned | Significant deviation, action required |

#### Alignment Score Card

The hero component shows:

- **Circular gauge** with current score
- **Status text** (WELL ALIGNED / DRIFT DETECTED / MISALIGNED)
- **Trend indicator** (↑/↓/→)
- **Check statistics** (e.g., "47/50 aligned")
- **Actions**: View Trend, Configure

#### Goal Aligned

For a selected session, this card shows how closely actions matched the declared goal. When drift is detected, it highlights the specific violating action for faster investigation.

#### Alignment Trend

Line chart showing alignment over time:

- 7-day / 30-day / All time views
- Threshold line (default: 70%)
- Color-coded data points

#### Drift Events

When alignment drops below threshold, a drift event is logged:

| Field | Description |
|-------|-------------|
| **Session ID** | Affected session |
| **Goal** | Stated goal at time of drift |
| **Alignment Score** | Score when drift detected |
| **Reason** | LLM-generated explanation |
| **Actions** | Review event evidence, Dismiss |

#### Session Breakdown

Table of sessions with alignment scores:

- Filter: All / Drift Only / Aligned Only
- Search by goal keyword
- Click to inspect execution evidence for that session

### Execution Evidence

Cryptographic attestation for tamper-proof audit trails.

#### Integrity Verified

Confirms all events in the selected session have valid cryptographic proofs. Typical details include Merkle root, chain/proof status, and signature verification.

#### Session Integrity

Each session generates:

- **Session hash** - Merkle root of all events
- **Signature** - Cryptographically signed by OpenBox
- **Timestamp** - Timestamped via RFC 3161

#### Proof Certificate

Exportable certificate containing:

```
Session: ses_a1b2c3d4e5f6
Agent: did:openbox:agent:xyz123
Hash: sha256:8a7b...
Signature: ecdsa:MIGk...
Timestamp: 2024-01-15T09:14:32Z
TSA: timestamp.openbox.ai
```

Use for compliance audits and legal evidence.

#### Workflow Metadata

- **Workflow ID** - Identifier of the Temporal workflow that orchestrated the session
- **Run ID** - Unique execution instance ID (UUID) for this run
- **Task Queue** - Temporal worker queue that processed the session

#### Event Log Timeline

Timeline view provides a detailed, filterable table of execution events with timestamps, event types, durations, and evidence hashes.

In the **Details** column, click the **eye icon** to open the event detail modal.

The modal includes:

- **Cryptographic Proof** - Event index, span count, tree depth, and Merkle-tree position/proof
- **Input** - Full event input payload
- **Output** - Full event output payload
- **Overview** - Core metadata (OpenBox ID, activity type, duration, workflow ID, created timestamp)

Use Timeline view when you need event-by-event inspection.

#### Workflow Execution Tree

Tree view provides a hierarchical breakdown of workflow and activity execution, including nested calls and parent-child relationships.

Use Tree View when you need execution-path reasoning:

- Follow the order of signals, activity starts, and activity completions
- Expand nodes to inspect how each step led to the next action
- Correlate timing and spans to understand why an execution path was taken

#### Watch Replay

Opens [Session Replay](/docs/agents/trust-lifecycle/session-replay) so you can walk through session execution step by step.

## Integration with Other Phases

- **Authorize**: Drift patterns can trigger behavioral rules
- **Adapt**: Repeated drift generates policy suggestions
- **Monitor**: Alignment annotations appear in [Session Replay](/docs/agents/trust-lifecycle/session-replay)

## Next Phase

Based on alignment results and detected patterns:

→ **[Adapt](/docs/agents/trust-lifecycle/adapt)** - Review policy suggestions, handle agent-specific approvals, and watch trust evolve over time
