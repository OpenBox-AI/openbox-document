---
title: Approvals and Guardrails
description: "How OpenBox verdicts, approvals, and guardrails are enforced at runtime in DeepAgents."
llms_description: DeepAgents SDK approvals and guardrails behavior
sidebar_position: 6
tags:
  - sdk
  - deep-agents
  - governance
  - guardrails
  - hitl
---

# Approvals and Guardrails

OpenBox evaluates governed DeepAgents boundaries and returns verdicts that the SDK enforces at runtime.

## Verdicts

| Verdict | Meaning | Runtime effect |
| --- | --- | --- |
| `allow` | Continue normally | Execution proceeds |
| `require_approval` | Human review required | Execution waits for approval at HITL-capable boundaries; rejection or expiration halts the run |
| `block` | Operation must not continue | Execution raises `GovernanceBlockedError` |
| `halt` | Agent run must stop | Execution raises `GovernanceHaltError` |

## Enforcement Model

For governed tools and subagents:

1. `ToolStarted` is evaluated first
2. Input-side guardrails may apply
3. The tool or DeepAgents `task` subagent dispatch executes
4. `ToolCompleted` is evaluated
5. Output-side guardrails may apply
6. Approval may be required on either side

For agent runs:

- `WorkflowStarted` can stop execution early
- `WorkflowCompleted` records the final outcome and can still be evaluated
- prompt pre-screening can happen before the root agent starts

For model calls:

- the initiating user prompt can be pre-screened before execution
- `LLMStarted` can enforce prompt-side policy and guardrails
- `LLMCompleted` records model output and usage metadata when available

## Prompt Pre-Screening

The SDK extracts the last human/user message from the DeepAgents input and evaluates it before the agent graph runs. This path is used so prompt guardrail, block, halt, and approval decisions propagate to your `invoke()` or `ainvoke()` caller.

If the input has no human-turn text, prompt pre-screening is skipped.

## Guardrail Field Selection

For live activity guardrails, match on `ToolStarted` or `LLMStarted` whenever possible.

Recommended fields:

| Activity type | Field to check | Example use |
| --- | --- | --- |
| tool call | `tool_input.query` | Search or retrieval restrictions |
| tool call | `tool_input.path` | Path restrictions |
| tool call | `tool_input.command` | Banned shell commands |
| tool call | `tool_name` | Tool-specific restrictions |
| subagent call | `subagent_name` | Approval for a named DeepAgents subagent |
| subagent call | `activity_input[*].__openbox.tool_type` | Approval for all `a2a` dispatches |
| `llm_call` | `prompt` | Prompt-side safety checks |

For provider responses and tool outputs, use `ToolCompleted` or `LLMCompleted`.

## Approval Handling

Approval behavior is policy-driven. When OpenBox returns `require_approval`, the SDK polls OpenBox for a human decision and continues only after approval is granted. Rejection or server-side expiration raises a typed exception.

Example middleware setup:

```python
middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    agent_name="ResearchBot",
    known_subagents=["researcher", "writer", "general-purpose"],
    tool_type_map={"web_search": "http"},
)
```

Use OpenBox policy to decide which actions require approval. The DeepAgents SDK uses the base OpenBox HITL polling behavior from the underlying LangGraph SDK.

## Output-Time Approval

Approval is not limited to requested action. `ToolCompleted` and `LLMCompleted` can also return `require_approval`, which is useful when policy needs to review actual output instead of only the requested operation.

## DeepAgents `interrupt_on`

DeepAgents has its own Human-in-the-Loop mechanism through `interrupt_on`. OpenBox also provides approval through policies.

Avoid enabling both mechanisms for the same tool. If both are active, users can see confusing double pauses. For OpenBox-governed deployments, prefer OpenBox approval policies and remove matching tools from DeepAgents `interrupt_on`.

## Runtime Errors You Should Expect

| Error | Meaning |
| --- | --- |
| `GovernanceBlockedError` | OpenBox returned `block`, or a hook-level operation was blocked |
| `GovernanceHaltError` | OpenBox returned `halt`, approval was rejected, or approval expired |
| `GuardrailsValidationError` | Guardrail validation failed |
| `ApprovalRejectedError` | Human reviewer rejected the activity; usually surfaced as `GovernanceHaltError` |
| `ApprovalExpiredError` | Approval expired before resolution; usually surfaced as `GovernanceHaltError` |

## Production Recommendations

1. Keep approval policy focused on business boundaries.
2. Match prompt checks on `LLMStarted` rather than unrelated tool fields.
3. Use `ToolStarted` selectors for tool-input guardrails.
4. Use `ToolCompleted` and `LLMCompleted` when policy must inspect actual output.
5. Keep `known_subagents` aligned for runtime clarity and configure `tool_type_map` so policies can target tool categories clearly.
