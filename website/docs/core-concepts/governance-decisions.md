---
title: Governance Decisions
description: "See how governance decisions happen in real-time: Policy checks, risk assessment, and automated enforcement before agent execution."
llms_description: The five governance decision types and how they work
sidebar_position: 4
tags:
  - governance
  - policy-authoring
  - hitl
---

# Governance Decisions

When an agent operation is evaluated, OpenBox returns one of <mark className="diff-mark">five</mark> governance decisions.

## Decision Types

| Decision | Effect | Trust Impact |
|----------|--------|--------------|
| **HALT** | Terminates entire agent session | Significant negative |
| **BLOCK** | Action rejected, agent continues | Negative |
| **REQUIRE_APPROVAL** | Operation paused for human review | Neutral (pending) |
| <mark className="diff-mark">**CONSTRAIN**</mark> | Operation proceeds only through an integration that can enforce the returned constraints | <mark className="diff-mark">Neutral (constrained)</mark> |
| **ALLOW** | Operation proceeds normally | Positive (compliance recorded) |

## ALLOW

The operation is permitted to proceed.

**When returned:**
- Operation matches allowed patterns
- Agent trust tier permits the action
- No policy violations detected

**Effect:**
- Operation executes normally
- Event logged for audit
- Behavioral score slightly improves

## <mark className="diff-mark">CONSTRAIN</mark>

The operation may proceed only if the active integration can enforce the returned constraints before execution. Recording a constraint without enforcing it is not sufficient, and `CONSTRAIN` must never be treated as `ALLOW`.

**When returned:**
- A guardrail transformed the input and the integration can execute only the transformed value
- A trust-tier rule requires isolation for this operation type

**Effect:**
- The integration applies the constraint and records the enforced action
- The event records the specific constraint applied
- If the integration cannot enforce the constraint, the operation fails closed
- The enforcement mechanism is integration-specific; not every `CONSTRAIN` action uses a sandbox
- For a registered [Temporal governed command](/developer-guide/temporal-python/concept), a policy `CONSTRAIN` wnstraints: ["run_in_sandbox"]` or a behavioral `CONSTRAIN` selecting a replacement profile aborts the host action and selects sandbox execution. An ordinary unsupported Temporal action fails closed

## REQUIRE_APPROVAL

OpenBox pauses the operation pending human approval.

**When returned:**
- Policy explicitly requires HITL
- Operation crosses risk threshold
- Agent trust tier mandates review

**Effect:**
- Request appears in the Approvals queue with full context
- SLA tracking shows whether the request is within SLA, at-risk, or breached
- [Session Replay](/trust-lifecycle/session-replay) shows the operation context and decision timeline
- Once a reviewer approves or rejects, the operation proceeds or stops

**Approval flow:**
```
1. Operation triggers REQUIRE_APPROVAL
2. Request appears in dashboard queue
3a. Approved → Operation proceeds
3b. Rejected → Operation blocked
3c. Timeout → Operation expires
```

## BLOCK

OpenBox blocks the specific operation.

**When returned:**
- Policy explicitly blocks this operation
- Trust tier prohibits the action
- Behavioral rule violation detected

**Effect:**
- Operation does not execute
- Event logged with denial reason
- Behavioral score decreases

## HALT

The entire agent session is terminated.

**When returned:**
- Critical policy violation
- Multi-step threat pattern detected
- Agent trust score critically low
- Explicit termination rule triggered

**Effect:**
- Current activity fails
- Workflow is canceled
- All pending operations abandoned
- Discards any pending patch: HALT always dominates, even over a pending BLOCK-with-Patch retry
- Agent may be blocked from further execution
- Significant trust score decrease
- Alert generated
- Feeds trust incidents and identity signals

## Decision Precedence

When multiple policies apply, decisions follow precedence:

<mark className="diff-mark">Updated to insert CONSTRAIN into the precedence order below.</mark>

```
HALT > BLOCK > REQUIRE_APPROVAL > CONSTRAIN > ALLOW
```

If any policy returns HALT, the agent session is terminated regardless of other policies.

## Decision in Session Replay

[Session Replay](/trust-lifecycle/session-replay) shows decisions at each operation:

<mark className="diff-mark">Added a CONSTRAIN row to the example below.</mark>

```
09:14:32.001  DATABASE_READ     customers.find    ✓ ALLOW
09:14:32.045  LLM_CALL          gpt-4             ✓ ALLOW
09:14:32.560  OUTPUT_GUARDRAIL  mask-pii          ◐ CONSTRAIN (PII masked)
09:14:32.892  EXTERNAL_API_CALL stripe.com        ⏸ REQUIRE_APPROVAL
09:14:45.002  APPROVAL_GRANTED  user: john@co     ✓ APPROVED
09:14:45.123  EXTERNAL_API_CALL stripe.com        ✓ ALLOW (resumed)
09:14:46.001  DATABASE_WRITE    audit.log         ✓ ALLOW
```

## Customizing Decisions

You can tune how the **Authorize** phase produces decisions:

1. **Policies (OPA/Rego)** - Return `allow`, `deny`, or `require_approval` for specific operations and conditions.
2. **Behavioral Rules** - Detect multi-step patterns and escalate to <mark className="diff-mark">`CONSTRAIN`,</mark> `BLOCK`, `REQUIRE_APPROVAL`, or `HALT`.
3. **Trust-tier conditions** - Apply stricter decisions for lower-tier agents and relax controls for higher-tier agents.
4. **Approval timeout settings** - Configure how long `REQUIRE_APPROVAL` requests can remain pending before expiring.

Use policy and behavioral-rule testing before rollout to confirm expected outcomes.

## Related

- **[Authorize Phase](/trust-lifecycle/authorize)** - Configure policies that produce these decisions
- **[Approvals](/approvals)** - Process REQUIRE_APPROVAL decisions
