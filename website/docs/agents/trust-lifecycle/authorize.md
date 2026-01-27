---
title: Authorize
description: Phase 2 - Configure guardrails, policies, and behavioral rules
sidebar_position: 2
---

# Authorize (Phase 2)

The Authorize phase defines what the agent is allowed to perform. Configure guardrails, policies, and behavioral rules to enforce governance.

Access via **Agent Detail → Authorize** tab.

## Authorization Pipeline

Operations flow through three layers:

```
Incoming Operation
       │
       ▼
┌─────────────┐
│ Guardrails  │  Input/output validation and transformation
└─────────────┘
       │
       ▼
┌─────────────┐
│ OPA Policy  │  Stateless permission checks
└─────────────┘
       │
       ▼
┌─────────────┐
│ Behavioral  │  Stateful multi-step pattern detection
│ Rules       │
└─────────────┘
       │
       ▼
  Governance Decision
```

## Sub-tabs

The Authorize tab has three sub-tabs:

### Guardrails

Pre/post-processing validation and transformation:

| Type | Purpose | Examples |
|------|---------|----------|
| **Input Guardrails** | Validate/transform incoming data | PII detection, rate limiting |
| **Output Guardrails** | Validate/transform responses | PII redaction, format enforcement |

**Creating a Guardrail:**

1. Click **Add Guardrail**
2. Select type (Input or Output)
3. Configure trigger conditions
4. Define action (Block, Transform, Log)
5. Save and enable

### Policies

OPA/Rego policies for stateless permission checks:

```rego
package openbox.agent.policy

default allow = false

allow {
    input.operation.type == "read"
    input.agent.trust_tier <= 2
}

allow {
    input.operation.type == "write"
    input.agent.trust_tier == 1
    input.context.approved == true
}
```

**Creating a Policy:**

1. Click **Create Policy**
2. Opens the Policy Editor
3. Write Rego code
4. Test against sample inputs
5. Save and attach to agent

**Policy Context Available:**

| Field | Description |
|-------|-------------|
| `input.agent.id` | Agent identifier |
| `input.agent.trust_tier` | Current trust tier (1-5) |
| `input.agent.trust_score` | Current trust score (0-100) |
| `input.operation.type` | Operation type (21 semantic types) |
| `input.operation.target` | Target resource |
| `input.context` | Session and request context |

### Behavioral Rules

Stateful rules that detect multi-step patterns:

| Pattern | Example |
|---------|---------|
| **Sequence** | PII access → External API call (without approval) |
| **Frequency** | More than 10 failed auth attempts in 1 minute |
| **Combination** | Database write + File export + External send |

**Creating a Behavioral Rule:**

1. Click **Add Rule**
2. Wizard opens with steps:
   - **Trigger**: What event starts tracking?
   - **Conditions**: What must happen?
   - **Window**: Time frame for pattern
   - **Action**: What happens on match?
3. Test with sample session data
4. Save and enable

**Behavioral Rule Actions:**

| Action | Description |
|--------|-------------|
| `ALLOW` | Permit and log |
| `CONSTRAIN` | Apply additional limits |
| `REQUIRE_APPROVAL` | Send to HITL queue |
| `DENY_ACTION` | Block the specific operation |
| `TERMINATE_AGENT` | Halt the entire agent session |

## Governance Decisions

The authorization pipeline produces one of five decisions:

| Decision | Effect | Trust Impact |
|----------|--------|--------------|
| **ALLOW** | Operation proceeds | Positive (compliance) |
| **CONSTRAIN** | Proceeds with limits | Neutral |
| **REQUIRE_APPROVAL** | Pauses for HITL | Neutral (pending) |
| **DENY_ACTION** | Blocks operation | Negative |
| **TERMINATE_AGENT** | Halts session | Significant negative |

## Trust Tier-Based Defaults

Lower trust tiers receive stricter defaults:

| Tier | Default Behavior |
|------|-----------------|
| **Tier 1** | Most operations allowed, logging only |
| **Tier 2** | Standard policies enforced |
| **Tier 3** | Enhanced checks, some HITL |
| **Tier 4** | Strict controls, frequent HITL |
| **Untrusted** | All significant operations require approval |

## Next Phase

Once you've configured governance controls:

→ **[Monitor](/docs/agents/trust-lifecycle/monitor)** - Start your agent and observe its runtime behavior with Session Replay
