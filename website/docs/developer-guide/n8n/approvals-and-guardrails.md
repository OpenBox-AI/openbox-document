---
title: Approvals and Guardrails
description: "How OpenBox verdicts, approvals, and guardrails are enforced at runtime in the n8n node."
llms_description: n8n node approvals and guardrails behavior
sidebar_position: 6
tags:
  - sdk
  - n8n
  - governance
  - guardrails
  - hitl
---

# Approvals and Guardrails

OpenBox evaluates the node's governed boundaries and returns verdicts that
the **OpenBox: Agent** node enforces at runtime.

## Verdicts

| Verdict | Meaning | Runtime effect |
| --- | --- | --- |
| `ALLOW` | Continue normally | Execution proceeds |
| `REQUIRE_APPROVAL` | Human review required | The node polls for approval, or raises `GovernanceHaltError` if rejected or expired |
| `BLOCK` | Operation must not continue | Execution raises `GovernanceBlockedError` |
| `HALT` | Agent run must stop | Execution raises `GovernanceHaltError` |

## Enforcement Model

For model calls:

1. `LLMStarted` is evaluated before the connected Chat Model is invoked
2. Prompt-side guardrails may apply, including PII redaction on the outgoing message
3. The model call executes
4. `LLMCompleted` is evaluated
5. Output-side guardrails may apply
6. Approval may be required on either side

For tool calls:

1. `ToolStarted` is evaluated before the Tool sub-node executes
2. Input-side guardrails may apply
3. The tool executes
4. `ToolCompleted` is evaluated
5. Output-side guardrails may apply
6. Approval may be required on either side

For the agent run:

- `WorkflowStarted` can be evaluated at the very start of the run
- `SignalReceived(user_prompt)` records the initiating prompt
- `WorkflowCompleted` records the final output and can redact it before it reaches the node's output

## Important Live-Run Behavior

In a standard OpenBox deployment, policy evaluates before guardrails for a
given event.

Operational consequence:

- If policy returns a non-`ALLOW` verdict such as `REQUIRE_APPROVAL`, `BLOCK`, or `HALT`, guardrails for that event may not run.
- If a guardrail UI test passes but the live run shows no guardrail result, inspect the policy verdict first.

## Guardrail Field Selection

| Event | Field to check | Example use |
| --- | --- | --- |
| `LLMStarted` | `prompt` | Prompt-side PII, jailbreak, or restricted-topic checks |
| `LLMCompleted` | `completion` | Response-side safety and sensitive output checks |
| `ToolStarted` | `activity_input` | Tool input restrictions before execution |
| `ToolCompleted` | `activity_output` | Tool output restrictions after execution |

Agent prompts are also emitted as `SignalReceived(user_prompt)`. For live
tool guardrails, match on `ToolStarted` whenever possible.

## PII Redaction On Model Input

If `LLMStarted`'s guardrail result redacts the prompt, the node rewrites the
last human message in the conversation with the redacted text before calling
the model — as long as the redacted text isn't longer than the original
prompt plus a small margin (to avoid overwriting the current turn with stale
data from a prior session).

## Approval Handling

When OpenBox returns `REQUIRE_APPROVAL`, the node polls the OpenBox approval
endpoint every 5 seconds for up to 5 minutes by default.

Typical behavior:

- OpenBox creates an approval request
- The request appears in the [OpenBox dashboard](https://platform.openbox.ai)
- A human reviewer approves, rejects, or lets the request expire
- The node continues only after approval is granted

Rejection or timeout raises `GovernanceHaltError` — unlike the Python
LangChain SDK, the n8n node does not export separate
`ApprovalRejectedError` / `ApprovalExpiredError` classes; both outcomes
surface as the same halt error.

## Output-Time Approval

Approval is not limited to the requested action. `LLMCompleted` and
`ToolCompleted` can also return `REQUIRE_APPROVAL`, which is useful when
policy needs to review actual output instead of just the requested
operation.

## Runtime Errors You Should Expect

| Error | Meaning |
| --- | --- |
| `GovernanceBlockedError` | OpenBox returned a `BLOCK` verdict |
| `GovernanceHaltError` | OpenBox returned a `HALT` verdict, or approval rejection/expiry halted execution |
| `GuardrailsValidationError` | Guardrail validation failed |

All three surface as a single `NodeOperationError` on the node — see
[Error Handling](/developer-guide/n8n/error-handling).

## Production Recommendations

1. Keep approval policy focused on business boundaries.
2. Use `ToolStarted` selectors for tool-input guardrails.
3. Use `LLMStarted` and `LLMCompleted` for prompt and response guardrails.
4. Test live guardrails only after confirming policy returns `ALLOW` for that event.
5. Enable **Continue On Fail** on the node in production so a block or halt doesn't crash the whole workflow execution.
