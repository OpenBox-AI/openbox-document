---
title: Error Handling
description: "Handle OpenBox governance errors in n8n: node error types, Continue On Fail behavior, and debugging guidance."
llms_description: Error handling and recovery patterns for the n8n node
sidebar_position: 4
tags:
  - sdk
  - reference
  - governance
---

# Error Handling

Governance decisions surface as `NodeOperationError` thrown from the
**OpenBox: Agent** node's `execute()` function. Internally, the node maps
three governance exception types to that error.

## Governance Exceptions

| Exception | Raised when | Node error message |
|-----------|-------------|---------------------|
| `GovernanceHaltError` | Policy verdict is `HALT`, or a required approval is rejected or times out | The exception's own message |
| `GovernanceBlockedError` | Policy verdict is `BLOCK` | `OpenBox governance requires approval` (with the underlying reason attached as the error description) |
| `GuardrailsValidationError` | A configured guardrail rejects the input or output | `OpenBox guardrails validation failed: <reasons>` |

All three surface as a single `NodeOperationError` on the node — n8n does
not expose separate error classes to catch inside the workflow. Route on the
error instead using **Continue On Fail** or an **IF**/**Error Trigger** node
downstream.

## Continue On Fail

By default, a governance error fails the whole node execution. Enable
**Continue On Fail** (Settings icon on the node → **On Error → Continue**) to
route errors as an output item instead:

```json
{ "error": "OpenBox governance requires approval" }
```

This lets you branch on `{{$json.error}}` with an **IF** node rather than
stopping the workflow.

## Non-Governance Tool Errors

If a connected Tool sub-node throws (for example an HTTP 4xx/5xx from a Tool
HTTP Request node), the agent stops immediately and returns:

```text
Tool "<tool name>" failed: <error message>
```

This is treated as the agent's final output, not a governance error — it
does not raise `GovernanceHaltError`, `GovernanceBlockedError`, or
`GuardrailsValidationError`. `WorkflowCompleted` still fires with a `failed`
status so the run is recorded in OpenBox.

## Approval Rejection And Timeout

If OpenBox returns `REQUIRE_APPROVAL`, the node polls for a decision. If the
reviewer rejects the request, or no decision arrives before the timeout, the
node raises `GovernanceHaltError` — there is no separate rejected/expired
exception type in the n8n node.

## Best Practices

1. **Enable Continue On Fail for governed nodes in production** — treat a
   block or halt as an expected outcome, not a crash.
2. **Branch on the error message**, not exception identity — n8n surfaces
   one error type (`NodeOperationError`) regardless of the underlying
   governance reason.
3. **Log the error message** — it contains the policy or guardrail reason
   from OpenBox.
4. **Don't retry blindly on a block** — a `BLOCK` verdict is a policy
   decision, not a transient failure.

## Debugging

Check the execution in n8n's **Executions** tab, then open the
**OpenBox: Agent** node's output to see the error and, on success runs, the
`_openbox` metadata block (workflow ID, run ID, tool call count,
iterations). Cross-reference the workflow/run ID in the
[OpenBox Dashboard](https://platform.openbox.ai) to see the full event
timeline and the policy or guardrail message.

## Next Steps

1. **[Configuration](/developer-guide/n8n/configuration)** — Review credential and node parameter defaults
2. **[Integration Walkthrough](/developer-guide/n8n/integration-walkthrough)** — Wire and verify an existing n8n agent
3. **[Approvals and Guardrails](/developer-guide/n8n/approvals-and-guardrails)** — Understand verdict and guardrail behavior
4. **[Troubleshooting](/developer-guide/n8n/troubleshooting)** — Diagnose common integration issues
