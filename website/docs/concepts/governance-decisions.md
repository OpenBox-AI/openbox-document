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
| **ALLOW** | Operation proceeds normally | Positive (compliance recorded) |
| **CONSTRAIN** | Operation proceeds with modifications | Neutral |
| **REQUIRE_APPROVAL** | Operation paused for human review | Neutral (pending) |
| **DENY_ACTION** | Specific operation blocked | Negative |
| **TERMINATE_AGENT** | Entire agent session halted | Significant negative |

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

**SDK behavior:**
```python
# Operation proceeds transparently
result = await my_activity(data)
```

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

**SDK behavior:**
```python
# Operation proceeds with constraints applied
result = await my_activity(data)
# Result may be modified (e.g., PII redacted)
```

## REQUIRE_APPROVAL

The operation is paused pending human approval.

**When returned:**
- Policy explicitly requires HITL
- Operation crosses risk threshold
- Agent trust tier mandates review

**Effect:**
- Activity raises `ApprovalPending`
- Temporal retries with backoff
- Request appears in Approvals queue
- Once approved/rejected, retry succeeds/fails

**SDK behavior:**
```python
try:
    result = await my_activity(data)
except ApprovalPending:
    # Automatic retry handles this
    raise
except ApprovalRejected as e:
    # Human rejected the request
    logger.error(f"Approval rejected: {e.reason}")
except ApprovalExpired:
    # Timeout without decision
    logger.error("Approval timed out")
```

**Approval flow:**
```
1. Operation triggers REQUIRE_APPROVAL
2. Activity raises ApprovalPending
3. Temporal schedules retry (with backoff)
4. Request appears in dashboard queue
5a. Approved → Next retry succeeds
5b. Rejected → Next retry raises ApprovalRejected
5c. Timeout → Next retry raises ApprovalExpired
```

## DENY_ACTION

The specific operation is blocked.

**When returned:**
- Policy explicitly blocks this operation
- Trust tier prohibits the action
- Behavioral rule violation detected

**Effect:**
- Activity raises `GovernanceStop`
- Operation does not execute
- Event logged with denial reason
- Behavioral score decreases

**SDK behavior:**
```python
try:
    result = await my_activity(data)
except GovernanceStop as e:
    logger.error(f"Operation blocked: {e.reason}")
    # Handle the denial (retry with different params, alert, etc.)
```

## TERMINATE_AGENT

The entire agent session is halted.

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

**SDK behavior:**
```python
# Workflow level handling
try:
    await workflow.execute_activity(...)
except GovernanceStop as e:
    if e.termination:
        # Entire workflow is being terminated
        logger.critical(f"Agent terminated: {e.reason}")
        # Cleanup and exit
```

## Decision Precedence

When multiple policies apply, decisions follow precedence:

```
TERMINATE_AGENT > DENY_ACTION > REQUIRE_APPROVAL > CONSTRAIN > ALLOW
```

If any policy returns TERMINATE, the agent is terminated regardless of other policies.

## Decision in Session Replay

Session replay shows decisions at each operation:

```
09:14:32.001  DATABASE_READ     customers.find    ✓ ALLOW
09:14:32.045  LLM_CALL          gpt-4             ✓ ALLOW
09:14:32.892  EXTERNAL_API_CALL stripe.com        ⏸ REQUIRE_APPROVAL
09:14:45.002  APPROVAL_GRANTED  user: john@co     ✓ APPROVED
09:14:45.123  EXTERNAL_API_CALL stripe.com        ✓ ALLOW (resumed)
09:14:46.001  DATABASE_WRITE    audit.log         ✓ ALLOW
```

## Customizing Decisions

In OPA policies, return the appropriate decision:

```rego
package openbox.policy

# Default allow
default decision = "ALLOW"

# Require approval for external calls
decision = "REQUIRE_APPROVAL" {
    input.operation.type == "EXTERNAL_API_CALL"
    input.agent.trust_tier >= 2
}

# Deny for untrusted agents
decision = "DENY_ACTION" {
    input.operation.type == "DATABASE_WRITE"
    input.agent.trust_tier == 5
}

# Terminate on critical violation
decision = "TERMINATE_AGENT" {
    input.operation.type == "AGENT_ACTION"
    input.operation.metadata.violation == "critical"
}
```

## Related

- **[Authorize Phase](/docs/agents/trust-lifecycle/authorize)** - Configure policies that produce these decisions
- **[SDK Error Handling](/docs/sdk/error-handling)** - Handle decisions in your code
- **[Approvals](/docs/approvals)** - Process REQUIRE_APPROVAL decisions
