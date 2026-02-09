---
title: Verify
description: Phase 4 - Validate goal alignment and detect drift
sidebar_position: 4
---

# Verify (Phase 4)

The Verify phase validates that agents act in alignment with their stated goals. Detect drift, review reasoning traces, and ensure intent consistency.

Access via **Agent Detail → Verify** tab.

## Sub-tabs

### Goal Alignment (Default)

Monitor alignment between agent actions and stated goals.

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
| **Actions** | View Trace, Create Rule, Dismiss |

#### Session Breakdown

Table of sessions with alignment scores:

- Filter: All / Drift Only / Aligned Only
- Search by goal keyword
- Click to view reasoning trace

### Execution Evidence

Cryptographic attestation for tamper-proof audit trails.

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

## Reasoning Trace

View the LLM's reasoning for alignment scoring:

### Trace Modal

When you click "View Trace" on a session:

1. **Goal Context** - The stated goal
2. **Operations Timeline** - Each operation with individual scores
3. **Reasoning Text** - LLM explanation for each score
4. **Model Info** - Model used, latency, confidence

### Creating Rules from Traces

If you identify a pattern that should be enforced:

1. Click **Create Rule** from the trace modal
2. Wizard pre-fills with the drift context
3. Define the behavioral rule
4. Save to [Authorize](/docs/agents/trust-lifecycle/authorize) tab

## Integration with Other Phases

- **Authorize**: Drift patterns can trigger behavioral rules
- **Adapt**: Repeated drift generates policy suggestions
- **Monitor**: Alignment annotations appear in Session Replay

## Next Phase

Based on alignment results and detected patterns:

→ **[Adapt](/docs/agents/trust-lifecycle/adapt)** - Review policy suggestions, handle agent-specific approvals, and watch trust evolve over time
