---
title: Approvals and Guardrails
description: "How OpenBox verdicts, approvals, and guardrails are enforced at runtime in LangGraph."
llms_description: LangGraph SDK approvals and guardrails behavior
sidebar_position: 6
tags:
  - sdk
  - langgraph
  - governance
  - guardrails
  - hitl
---

# Approvals and Guardrails

OpenBox evaluates governed LangGraph boundaries and returns verdicts that the SDK enforces at runtime.

## Verdicts

| Verdict            | Meaning                     | Runtime effect                                                                                        |
| ------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `allow`            | Continue normally           | Execution proceeds                                                                                    |
| `require_approval` | Human review required       | Execution waits for approval at HITL-capable boundaries; otherwise it raises `GovernanceBlockedError` |
| `block`            | Operation must not continue | Execution raises `GovernanceBlockedError`                                                             |
| `halt`             | Graph run must stop         | Execution raises `GovernanceHaltError`                                                                |

## Enforcement Model

For governed activities:

1. `ActivityStarted` is evaluated first
2. Input-side guardrails may apply
3. The tool, subagent, or LLM call executes
4. `ActivityCompleted` is evaluated
5. Output-side guardrails may apply
6. Approval may be required on either side

For graph runs:

- `WorkflowStarted` can stop execution early
- `WorkflowCompleted` records the final outcome and can still be evaluated
- prompt pre-screening can happen before the root graph starts

## Prompt Pre-Screening

The SDK extracts the last human/user message from the graph input and evaluates it before streaming the graph. This path is used so prompt guardrail, block, halt, and approval decisions propagate to your `ainvoke()` or `astream_governed()` caller instead of being swallowed by LangGraph callback internals.

If the graph input has no human-turn text, prompt pre-screening is skipped.

## Guardrail Field Selection

For live activity guardrails, match on `ActivityStarted` whenever possible.

Recommended fields:

| Activity type | Field to check  | Example use                      |
| ------------- | --------------- | -------------------------------- |
| tool call     | `input.query`   | Search or retrieval restrictions |
| tool call     | `input.path`    | Path restrictions                |
| tool call     | `input.command` | Banned shell commands            |
| `llm_call`    | `prompt`        | Prompt-side safety checks        |

For provider responses and tool outputs, use `ActivityCompleted`.

## Approval Handling

Configure the approval polling interval in handler configuration:

```python
governed = create_openbox_graph_handler(
    graph=app,
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    hitl={"enabled": True, "poll_interval_ms": 5000},
)
```

When OpenBox returns `require_approval`, the SDK polls OpenBox for the human decision. Execution continues only after approval is granted. Rejection or server-side expiration raises a typed exception.

Use policy to decide which actions require approval. The SDK uses `poll_interval_ms` to control how often it checks OpenBox for the decision.

## Output-Time Approval

Approval is not limited to requested action. `ActivityCompleted` can also return `require_approval`, which is useful when policy needs to review actual output instead of only the requested operation.

## Runtime Errors You Should Expect

| Error                       | Meaning                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `GovernanceBlockedError`    | OpenBox returned `block`, or `require_approval` was not eligible for HITL |
| `GovernanceHaltError`       | OpenBox returned `halt`                                                   |
| `GuardrailsValidationError` | Guardrail validation failed                                               |
| `ApprovalRejectedError`     | Human reviewer rejected the activity                                      |
| `ApprovalExpiredError`      | Approval expired before resolution                                        |

## Production Recommendations

1. Keep approval policy focused on business boundaries.
2. Match prompt checks on `llm_call` or the user prompt signal rather than unrelated tool fields.
3. Use `ActivityStarted` selectors for tool-input guardrails.
4. Test live guardrails after confirming policy returns `allow` for that event.
