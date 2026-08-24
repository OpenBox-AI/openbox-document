---
title: Error Handling
description: "Handle OpenBox errors gracefully: Manage policy violations, trust failures, and network issues with retry logic and fallback patterns."
llms_description: Error codes and recovery patterns
sidebar_position: 5
tags:
  - sdk
  - reference
  - governance
---

# Error Handling

Trust decisions for Activity execution surface as Temporal `ApplicationError` exceptions. A Workflow observes the enclosing `ActivityError` and can inspect its cause. The plugin uses `ApplicationError.type` to distinguish governance outcomes.

## Governance Error Types

The plugin raises `ApplicationError` with one of these type strings:

| Error Type           | Decision                    | Retryable | Description                |
| -------------------- | --------------------------- | --------- | -------------------------- |
| `"GovernanceBlock"` | BLOCK                       | No        | Current operation blocked  |
| `"GovernanceHalt"`  | HALT                        | No        | Workflow termination requested |
| `"GovernanceConstrainUnsupported"` | CONSTRAIN | No | Integration cannot enforce the returned constraint |
| `"ApprovalPending"`  | REQUIRE_APPROVAL            | Yes       | Awaiting human review      |
| `"ApprovalRejected"` | REQUIRE_APPROVAL (rejected) | No        | Human rejected request     |
| `"ApprovalExpired"`  | REQUIRE_APPROVAL (timeout)  | No        | No response before timeout |

All governance errors are standard Temporal `ApplicationError` instances with these properties:

| Property        | Type   | Description                                                             |
| --------------- | ------ | ----------------------------------------------------------------------- |
| `message`       | `str`  | Human-readable description (e.g., `"Governance blocked: PII detected"`) |
| `type`          | `str`  | The governance type string from the table above                         |
| `non_retryable` | `bool` | If `True`, Temporal will not retry the activity                         |

## Workflow-level handling

The plugin wraps Activity execution, so a governance `ApplicationError` normally occurs outside your Activity function. At Workflow level, Temporal wraps it in `ActivityError`; inspect the cause:

```python
from temporalio.exceptions import ActivityError, ApplicationError


def application_error(error: ActivityError) -> ApplicationError | None:
    cause = error.cause
    return cause if isinstance(cause, ApplicationError) else None
```

Handle terminal decisions without blindly retrying the operation:

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
        except ActivityError as error:
            cause = application_error(error)
            if cause is None:
                raise

            if cause.type in {"GovernanceBlock", "GovernanceConstrainUnsupported"}:
                return WorkflowOutput(status="blocked", reason=cause.message)

            if cause.type in {"ApprovalRejected", "ApprovalExpired"}:
                return WorkflowOutput(status="rejected", reason=cause.message)

            # GovernanceHalt terminates the run; do not recover it as success.
            raise
```

`ApprovalPending` is retryable for ordinary approval-gated Activities. Let it propagate so Temporal retries and the plugin polls the approval. `ApprovalRejected` and `ApprovalExpired` are terminal. `GovernanceBlock`, `GovernanceHalt`, and `GovernanceConstrainUnsupported` are non-retryable.

## Governed-command failures

A governed command must not be retried after an indeterminate dispatch, because a second attempt could repeat a side effect. `OpenBoxPlugin` intercepts the application's Activity and the dispatcher makes at most one possible execution dispatch for each stable dispatch ID.

| `ApplicationError.type` | Meaning |
|---|---|
| `GovernedCommandConfigurationRequired` | Worker did not configure sandbox support |
| `GovernedCommandInvalid` | Profile, arguments, identity, or derived command was rejected |
| `GovernedDispatcherFailure` | Dispatcher failed before returning a valid terminal result |
| `GovernedCommandResultInvalid` | Output did not match the registered typed-result schema |
| `GovernedCommandNotExecuted` | Governance or execution ended without accepted sandbox execution |
| `GovernedCommandExecutionIndeterminate` | The plugin cannot establish whether execution reached a safe terminal outcome |
| `BehavioralSandboxExecutionFailed` | A behavioral `CONSTRAIN` replacement profile failed; retained sandbox evidence is attached to the error |

At Workflow level, Temporal wraps the intercepted user Activity's `ApplicationError` in `ActivityError`. Inspect its cause using the same Workflow-level pattern above, alert or reconcile external state, and do not schedule a replacement command after a possible dispatch.

For a started-hook `CONSTRAIN`, the plugin aborts the attempted host action and uses the sandbox outcome. An `ALLOW` decision follows the application's normal host path, so a zero-host workflow must ensure the applicable Core decision is `CONSTRAIN`. See [Governed Sandbox Commands](/developer-guide/temporal-python/concept#one-dispatch-no-fallback).

Cancellation waits for dispatcher cleanup before the Activity finishes cancelling. Preserve that cancellation path; do not add a second scheduling retry. Raw output and credentials remain outside Workflow history even on failure.

## Best Practices

1. **Let ApprovalPending propagate** - The plugin handles retries for ordinary approval-gated Activities
2. **Log terminal governance errors with context** - Helps debugging
3. **Consider fallback behavior for GovernanceBlock** - A blocked operation need not become a successful result
4. **Do not recover GovernanceHalt** - Terminate the current run
5. **Don't catch and ignore** - These exceptions are intentional
6. **Never retry a governed command** - Reconcile its external state instead

## Configuration Exceptions

The plugin raises configuration exceptions from `openbox.config` during `OpenBoxPlugin()` initialization, not during activity execution. Handle these where you initialize your worker.

| Exception                 | Cause                                   |
| ------------------------- | --------------------------------------- |
| `OpenBoxConfigError`      | Base class for all configuration errors |
| `OpenBoxAuthError`        | Invalid or missing API key              |
| `OpenBoxNetworkError`     | Cannot reach OpenBox Core               |
| `OpenBoxInsecureURLError` | HTTP used for a non-localhost URL       |

## Next Steps

Now that you understand how to handle trust decisions in code:

1. **[Governed Sandbox Commands](/developer-guide/temporal-python/concept)** - Understand one-attempt command failures and cleanup
2. **[Troubleshooting](/developer-guide/temporal-python/troubleshooting)** - Common issues and solutions
3. **[Handle Approvals](/approvals)** - Review and process HITL requests in the dashboard
