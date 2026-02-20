---
title: Governance Decisions
description: The 5 governance decision types
sidebar_position: 4
---

# Governance Decisions

When an agent operation is evaluated, OpenBox returns one of five governance decisions.

## Decision Types

| Decision | Effect | Trust Impact |
|----------|--------|--------------|
| **HALT** | Terminates entire agent session | Significant negative |
| **BLOCK** | Action rejected, agent continues | Negative |
| **REQUIRE_APPROVAL** | Operation paused for human review | Neutral (pending) |
| **CONSTRAIN** | Operation proceeds with modifications | Neutral |
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

## CONSTRAIN

The operation proceeds but with modifications or limitations.

**When returned:**
- Operation allowed but needs transformation
- Rate limiting applied
- Data redaction required

**Examples:**
- PII automatically redacted from output
- API call rate limited
- Response truncated

**Effect:**
- Modified operation executes
- Constraint logged
- Behavioral score neutral

Constraints and the resulting transformed inputs/outputs are visible in [Session Replay](/docs/agents/trust-lifecycle/session-replay).

## REQUIRE_APPROVAL

The operation is paused pending human approval.

**When returned:**
- Policy explicitly requires HITL
- Operation crosses risk threshold
- Agent trust tier mandates review

**Effect:**
- Request appears in the Approvals queue
- [Session Replay](/docs/agents/trust-lifecycle/session-replay) shows the operation context and decision timeline
- Once approved/rejected, the operation proceeds or is blocked

**Approval flow:**
```
1. Operation triggers REQUIRE_APPROVAL
2. Request appears in dashboard queue
3a. Approved → Operation proceeds
3b. Rejected → Operation blocked
3c. Timeout → Operation expires
```

## BLOCK

The specific operation is blocked.

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
- Workflow is cancelled
- All pending operations abandoned
- Agent may be blocked from further execution
- Significant trust score decrease
- Alert generated

## Decision Precedence

When multiple policies apply, decisions follow precedence:

```
HALT > BLOCK > REQUIRE_APPROVAL > CONSTRAIN > ALLOW
```

If any policy returns HALT, the agent session is terminated regardless of other policies.

## Decision in Session Replay

[Session Replay](/docs/agents/trust-lifecycle/session-replay) shows decisions at each operation:

```
09:14:32.001  DATABASE_READ     customers.find    ✓ ALLOW
09:14:32.045  LLM_CALL          gpt-4             ✓ ALLOW
09:14:32.892  EXTERNAL_API_CALL stripe.com        ⏸ REQUIRE_APPROVAL
09:14:45.002  APPROVAL_GRANTED  user: john@co     ✓ APPROVED
09:14:45.123  EXTERNAL_API_CALL stripe.com        ✓ ALLOW (resumed)
09:14:46.001  DATABASE_WRITE    audit.log         ✓ ALLOW
```

## Customizing Decisions

You can tune how decisions are produced in the **Authorize** phase:

1. **Policies (OPA/Rego)** - Return `allow`, `deny`, or `require_approval` for specific operations and conditions.
2. **Behavioral Rules** - Detect multi-step patterns and escalate to `BLOCK`, `REQUIRE_APPROVAL`, or `HALT`.
3. **Trust-tier conditions** - Apply stricter decisions for lower-tier agents and relax controls for higher-tier agents.
4. **Approval timeout settings** - Configure how long `REQUIRE_APPROVAL` requests can remain pending before expiring.

Use policy and behavioral-rule testing before rollout to confirm expected outcomes.

## Related

- **[Authorize Phase](/docs/agents/trust-lifecycle/authorize)** - Configure policies that produce these decisions
- **[Approvals](/docs/approvals)** - Process REQUIRE_APPROVAL decisions
