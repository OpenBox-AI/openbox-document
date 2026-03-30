---
title: Approvals and Guardrails
description: "How OpenBox verdicts, approvals, and guardrails are enforced at runtime in Mastra."
llms_description: Mastra SDK approvals and guardrails behavior
sidebar_position: 5
tags:
  - sdk
  - mastra
  - governance
  - guardrails
  - hitl
---

# Approvals and Guardrails

OpenBox evaluates governed Mastra boundaries and returns verdicts that the SDK enforces at runtime.

## Verdicts

| Verdict | Meaning | Runtime effect |
| --- | --- | --- |
| `allow` | Continue normally | Execution proceeds |
| `constrain` | Continue with advisory constraints | Execution proceeds with constraints available in the response |
| `require_approval` | Human review required | Execution suspends or polls for approval |
| `block` | Operation must not continue | Execution throws a stop-style error |
| `halt` | Workflow or agent run must stop | Execution throws a halt error |

## Enforcement Model

For governed activities:

1. `ActivityStarted` is evaluated first
2. Input-side guardrails may apply
3. The tool or step executes
4. `ActivityCompleted` is evaluated
5. Output-side guardrails may apply
6. Approval may be required on either side

For workflows and agents:

- `WorkflowStarted` can stop execution early
- `WorkflowCompleted` can still be evaluated for policy and telemetry
- `WorkflowFailed` records failure context

## Important Live-Run Behavior

In a standard OpenBox deployment, policy evaluates before guardrails for a given event.

Operational consequence:

- If policy returns a non-`allow` verdict such as `require_approval`, `block`, or `halt`, guardrails for that event may not run.
- If a guardrail UI test passes but the live run shows no guardrail result, inspect the policy verdict first.

## Guardrail Field Selection

For live activity guardrails, match on `ActivityStarted` whenever possible.

Recommended fields:

| Activity type | Field to check | Example use |
| --- | --- | --- |
| `writeFile` | `input.content` | Banned content or PII in file contents |
| `writeFile` | `input.path` | Path restrictions |
| `runCommand` | `input.command` | Banned shell commands |

Important:

- Agent prompts are emitted as `SignalReceived(user_input)`.
- If your deployment only evaluates guardrails on activity events, those prompts are not inspected as activity inputs.

## Approval Handling

When OpenBox returns `require_approval`, the SDK chooses the approval path based on execution context.

### Workflow-Backed Execution

Preferred behavior:

- approval state is created
- the workflow suspends through Mastra resume behavior
- later resume paths emit signals and continue after approval resolves

### Non-Workflow Execution

Fallback behavior:

- the SDK polls approval inline
- execution continues only after approval is granted
- timeout or rejection raises an approval error

## Output-Time Approval

Approval is not limited to requested action. `ActivityCompleted` can also return `require_approval`, which is useful when policy needs to review actual output instead of just the requested operation.

## Runtime Errors You Should Expect

| Error | Meaning |
| --- | --- |
| `GovernanceHaltError` | OpenBox returned a stop or halt verdict, or fail-closed converted an API failure into a halt |
| `GuardrailsValidationError` | Guardrail validation failed |
| `ApprovalPendingError` | Approval is still pending or polling timed out |
| `ApprovalRejectedError` | Approval explicitly rejected the activity |
| `ApprovalExpiredError` | Approval expired before resolution |

## Production Recommendations

1. Keep approval policy focused on business boundaries.
2. Treat hook-triggered telemetry as internal by default.
3. Test live guardrails only after confirming policy returns `allow` for that event.
4. Use `ActivityStarted` selectors for tool-input guardrails.
