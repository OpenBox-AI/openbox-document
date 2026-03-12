---
title: Error Handling
description: Handle trust decisions in your code
llms_description: Error codes and recovery patterns
sidebar_position: 5
tags:
  - sdk
  - reference
  - governance
---

# Error Handling

Trust decisions surface as Temporal `ApplicationError` exceptions in your activities. The SDK uses `ApplicationError.type` to distinguish between different governance outcomes.

## Governance Error Types

The SDK raises `ApplicationError` with one of these type strings:

| Error Type           | Decision                    | Retryable | Description                |
| -------------------- | --------------------------- | --------- | -------------------------- |
| `"GovernanceStop"`   | BLOCK or HALT               | No        | Operation blocked          |
| `"ApprovalPending"`  | REQUIRE_APPROVAL            | Yes       | Awaiting human review      |
| `"ApprovalRejected"` | REQUIRE_APPROVAL (rejected) | No        | Human rejected request     |
| `"ApprovalExpired"`  | REQUIRE_APPROVAL (timeout)  | No        | No response before timeout |

All governance errors are standard Temporal `ApplicationError` instances with these properties:

| Property        | Type   | Description                                                             |
| --------------- | ------ | ----------------------------------------------------------------------- |
| `message`       | `str`  | Human-readable description (e.g., `"Governance blocked: PII detected"`) |
| `type`          | `str`  | The governance type string from the table above                         |
| `non_retryable` | `bool` | If `True`, Temporal will not retry the activity                         |

## Import

```python
from temporalio.exceptions import ApplicationError
```

## Handling Each Type

These patterns apply inside your existing Temporal activity functions. The SDK intercepts activity execution automatically — you only need to add error handling if you want custom behavior beyond the default (which is to let the exception propagate and fail the activity).

### GovernanceStop

Raised when an operation is blocked (BLOCK) or the agent session is terminated (HALT).

```python
@activity.defn
async def sensitive_operation(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except ApplicationError as e:
        if e.type == "GovernanceStop":
            logger.error(f"Operation blocked: {e.message}")

            # Option 1: Raise to fail the activity
            raise

            # Option 2: Return alternative result
            return "Operation not permitted"
        raise
```

### ApprovalPending

Raised when the operation requires human approval. Because `non_retryable=False`, Temporal automatically retries the activity — the SDK polls for an approval decision on each retry.

```python
@activity.defn
async def requires_approval_operation(data: dict) -> str:
    # No special handling needed - SDK manages retries.
    # Activity will retry until approved/rejected/expired.
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
    except ApplicationError as e:
        if e.type == "ApprovalPending":
            logger.info(f"Awaiting approval: {e.message}")
            # Re-raise to trigger retry
            raise
        raise
```

### ApprovalRejected

Raised when a human rejects the approval request.

```python
@activity.defn
async def handle_rejection(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except ApplicationError as e:
        if e.type == "ApprovalRejected":
            logger.warning(f"Approval rejected: {e.message}")

            # Option 1: Fail the activity
            raise

            # Option 2: Handle gracefully
            return f"Operation rejected: {e.message}"
        raise
```

### ApprovalExpired

Raised when approval times out without a decision.

```python
@activity.defn
async def handle_timeout(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except ApplicationError as e:
        if e.type == "ApprovalExpired":
            logger.warning(f"Approval timed out: {e.message}")
            raise
        raise
```

## Workflow-Level Handling

For workflow-level trust handling, catch `ApplicationError` and check the type:

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

        except ApplicationError as e:
            if e.type == "GovernanceStop":
                # Workflow is being blocked or terminated
                await self.cleanup()
                return WorkflowOutput(error=e.message)

            if e.type == "ApprovalRejected":
                # Human rejected - may want different handling
                return WorkflowOutput(
                    status="rejected",
                    reason=e.message,
                )

            raise
```

## Best Practices

1. **Let ApprovalPending propagate** - The SDK handles retries
2. **Log GovernanceStop with context** - Helps debugging
3. **Consider fallback behavior** - Not all denials should crash
4. **Clean up on GovernanceStop** - Release resources before re-raising
5. **Don't catch and ignore** - These exceptions are intentional

## Configuration Exceptions

The SDK raises configuration exceptions from `openbox.config` during `create_openbox_worker()` calls — not during activity execution. Handle these where you initialize your worker.

| Exception                 | Cause                                   |
| ------------------------- | --------------------------------------- |
| `OpenBoxConfigError`      | Base class for all configuration errors |
| `OpenBoxAuthError`        | Invalid or missing API key              |
| `OpenBoxNetworkError`     | Cannot reach OpenBox Core               |
| `OpenBoxInsecureURLError` | HTTP used for a non-localhost URL       |

## Next Steps

Now that you understand how to handle trust decisions in code:

1. **[Event Types](/docs/developer-guide/event-types)** - Understand the semantic event types that trigger these decisions
2. **[Troubleshooting](/docs/getting-started/troubleshooting)** - Common issues and solutions
3. **[Handle Approvals](/docs/approvals)** - Review and process HITL requests in the dashboard
