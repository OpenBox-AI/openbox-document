---
title: Error Handling
description: Handle trust decisions in your code
sidebar_position: 3
---

# Error Handling

Trust decisions surface as exceptions in your activities. Handle them appropriately for robust agent behavior.

## Exception Types

| Exception | Governance Decision | Description |
|-----------|-------------------|-------------|
| `GovernanceStop` | BLOCK or HALT | Operation blocked |
| `ApprovalPending` | REQUIRE_APPROVAL | Awaiting human review |
| `ApprovalRejected` | REQUIRE_APPROVAL (rejected) | Human rejected request |
| `ApprovalExpired` | REQUIRE_APPROVAL (timeout) | No response before timeout |
| `GuardrailsValidationFailed` | CONSTRAIN (validation failed) | Input/output validation failed |

## Import Exceptions

```python
from openbox.errors import (
    GovernanceStop,
    ApprovalPending,
    ApprovalRejected,
    ApprovalExpired,
    GuardrailsValidationFailed,
)
```

## Handling Each Exception

### GovernanceStop

Raised when an operation is blocked (BLOCK) or the agent session is terminated (HALT).

```python
@activity.defn
async def sensitive_operation(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except GovernanceStop as e:
        logger.error(f"Operation blocked: {e.reason}")

        if e.termination:
            # Agent is being terminated
            logger.critical("Agent terminated by trust policy")
            # Perform cleanup
            raise

        # Operation denied but agent continues
        # Option 1: Raise to fail the activity
        raise

        # Option 2: Return alternative result
        return "Operation not permitted"
```

**GovernanceStop properties:**

| Property | Type | Description |
|----------|------|-------------|
| `reason` | str | Why the operation was blocked |
| `policy` | str | Policy that triggered the block |
| `termination` | bool | Whether agent is being terminated |
| `trust_impact` | float | Trust score change |

### ApprovalPending

Raised when operation requires human approval. The SDK handles this automatically - Temporal retries until approval is granted or rejected.

```python
@activity.defn
async def requires_approval_operation(data: dict) -> str:
    # No special handling needed - SDK manages retries
    # Activity will retry until approved/rejected/expired
    result = await perform_action(data)
    return result
```

If you need custom handling:

```python
@activity.defn
async def custom_approval_handling(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except ApprovalPending as e:
        logger.info(f"Awaiting approval: {e.approval_id}")
        # Re-raise to trigger retry
        raise
```

**ApprovalPending properties:**

| Property | Type | Description |
|----------|------|-------------|
| `approval_id` | str | Approval request ID |
| `timeout` | datetime | When approval expires |
| `approvers` | list[str] | Who can approve |

### ApprovalRejected

Raised when a human rejects the approval request.

```python
@activity.defn
async def handle_rejection(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except ApprovalRejected as e:
        logger.warning(f"Approval rejected: {e.reason}")
        logger.info(f"Rejected by: {e.rejected_by}")

        # Option 1: Fail the activity
        raise

        # Option 2: Handle gracefully
        return f"Operation rejected: {e.reason}"
```

**ApprovalRejected properties:**

| Property | Type | Description |
|----------|------|-------------|
| `reason` | str | Rejection reason provided by approver |
| `rejected_by` | str | User who rejected |
| `approval_id` | str | Approval request ID |

### ApprovalExpired

Raised when approval times out without a decision.

```python
@activity.defn
async def handle_timeout(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except ApprovalExpired as e:
        logger.warning(f"Approval timed out after {e.timeout_duration}")

        # Option 1: Fail
        raise

        # Option 2: Retry with escalation
        # (would require workflow-level logic)
        raise
```

**ApprovalExpired properties:**

| Property | Type | Description |
|----------|------|-------------|
| `approval_id` | str | Approval request ID |
| `timeout_duration` | timedelta | How long it waited |

### GuardrailsValidationFailed

Raised when input/output fails guardrail validation.

```python
@activity.defn
async def validated_operation(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except GuardrailsValidationFailed as e:
        logger.error(f"Guardrail failed: {e.guardrail_name}")
        logger.error(f"Violations: {e.violations}")

        # Typically should fail - data doesn't meet requirements
        raise
```

**GuardrailsValidationFailed properties:**

| Property | Type | Description |
|----------|------|-------------|
| `guardrail_name` | str | Which guardrail failed |
| `violations` | list[str] | Specific validation failures |
| `stage` | str | "input" or "output" |

## Workflow-Level Handling

For workflow-level trust handling:

```python
@workflow.defn
class MyAgentWorkflow:
    @workflow.run
    async def run(self, input: WorkflowInput) -> WorkflowOutput:
        try:
            result = await workflow.execute_activity(
                sensitive_operation,
                input.data,
                start_to_close_timeout=timedelta(minutes=10),
            )
            return WorkflowOutput(result=result)

        except GovernanceStop as e:
            if e.termination:
                # Workflow is being terminated
                await self.cleanup()
                raise
            # Handle denied operation at workflow level
            return WorkflowOutput(error=e.reason)

        except ApprovalRejected as e:
            # Human rejected - may want different handling
            return WorkflowOutput(
                status="rejected",
                reason=e.reason
            )
```

## Best Practices

1. **Let ApprovalPending propagate** - The SDK handles retries
2. **Log GovernanceStop with context** - Helps debugging
3. **Consider fallback behavior** - Not all denials should crash
4. **Handle termination specially** - Clean up resources
5. **Don't catch and ignore** - These exceptions are intentional

## Next Steps

Now that you understand how to handle trust decisions in code:

1. **[Event Types](/docs/concepts/event-types)** - Understand the semantic event types that trigger these decisions
2. **[Troubleshooting](/docs/getting-started/troubleshooting)** - Common issues and solutions
3. **[Handle Approvals](/docs/approvals)** - Review and process HITL requests in the dashboard
