---
title: Approvals and Guardrails
description: "How OpenBox verdicts, approvals, and guardrails are enforced at runtime in LangChain."
llms_description: LangChain SDK approvals and guardrails behavior
sidebar_position: 6
tags:
  - sdk
  - langchain
  - governance
  - guardrails
  - hitl
---

# Approvals and Guardrails

OpenBox evaluates governed LangChain middleware boundaries and returns verdicts
that the SDK enforces at runtime.

## Verdicts

| Verdict | Meaning | Runtime effect |
| --- | --- | --- |
| `ALLOW` | Continue normally | Execution proceeds |
| `CONSTRAIN` | Continue with advisory constraints | Execution proceeds with constraints available in the response |
| `REQUIRE_APPROVAL` | Human review required | The SDK waits for approval or raises if approval is rejected or expires |
| `BLOCK` | Operation must not continue | Execution raises `GovernanceBlockedError` |
| `HALT` | Agent run must stop | Execution raises `GovernanceHaltError` |

## Enforcement Model

For model calls:

1. `LLMStarted` is evaluated before the model provider is called
2. Prompt-side guardrails may apply
3. The model call executes
4. `LLMCompleted` is evaluated
5. Output-side guardrails may apply
6. Approval may be required on either side

For tool calls:

1. `ToolStarted` is evaluated before the tool executes
2. Input-side guardrails may apply
3. The tool executes
4. `ToolCompleted` is evaluated
5. Output-side guardrails may apply
6. Approval may be required on either side

For agent runs:

- `WorkflowStarted` can stop execution early
- `SignalReceived(user_prompt)` records the initiating prompt
- `WorkflowCompleted` records final output context

## Important Live-Run Behavior

In a standard OpenBox deployment, policy evaluates before guardrails for a given
event.

Operational consequence:

- If policy returns a non-`ALLOW` verdict such as `REQUIRE_APPROVAL`, `BLOCK`, or `HALT`, guardrails for that event may not run.
- If a guardrail UI test passes but the live run shows no guardrail result, inspect the policy verdict first.

## Guardrail Field Selection

Recommended fields:

| Event | Field to check | Example use |
| --- | --- | --- |
| `LLMStarted` | `prompt` | Prompt-side PII, jailbreak, or restricted-topic checks |
| `LLMCompleted` | `completion` | Response-side safety and sensitive output checks |
| `ToolStarted` | `activity_input` | Tool input restrictions before execution |
| `ToolCompleted` | `activity_output` | Tool output restrictions after execution |

Important:

- Agent prompts are also emitted as `SignalReceived(user_prompt)`.
- For live tool guardrails, match on `ToolStarted` whenever possible.

## Approval Handling

When OpenBox returns `REQUIRE_APPROVAL`, the SDK uses the shared OpenBox
governance approval flow.

Typical behavior:

- OpenBox creates an approval request
- The request appears in the [OpenBox dashboard](/approvals)
- A human reviewer approves, rejects, or lets the request expire
- The SDK continues only after approval is granted

Timeout or rejection raises a governance error.

In the standard LangChain middleware path, approval rejection or expiry raises
`GovernanceHaltError`. The lower-level `ApprovalRejectedError` and
`ApprovalExpiredError` classes are still exported for direct approval polling
integrations.

## Output-Time Approval

Approval is not limited to the requested action. `LLMCompleted` and
`ToolCompleted` can also return `REQUIRE_APPROVAL`, which is useful when policy
needs to review actual output instead of just the requested operation.

## Runtime Errors You Should Expect

| Error | Meaning |
| --- | --- |
| `GovernanceBlockedError` | OpenBox returned a `BLOCK` verdict |
| `GovernanceHaltError` | OpenBox returned a `HALT` verdict, or approval rejection/expiry halted execution |
| `GuardrailsValidationError` | Guardrail validation failed |
| `ApprovalRejectedError` | Lower-level direct approval polling received a rejection |
| `ApprovalExpiredError` | Lower-level direct approval polling expired before resolution |

## Production Recommendations

1. Keep approval policy focused on business boundaries.
2. Use `ToolStarted` selectors for tool-input guardrails.
3. Use `LLMStarted` and `LLMCompleted` for prompt and response guardrails.
4. Test live guardrails only after confirming policy returns `ALLOW` for that event.
