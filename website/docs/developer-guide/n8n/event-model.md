---
title: Event Model
description: "Understand how n8n agent runs, model calls, tools, and telemetry are represented in OpenBox."
llms_description: n8n node event model and payload guidance
sidebar_position: 5
tags:
  - sdk
  - n8n
  - observability
  - reference
---

# Event Model

OpenBox receives both governed lifecycle events and operational telemetry
from the **OpenBox: Agent** node. Understanding that model is necessary for
writing policy, configuring guardrails, and interpreting the dashboard
correctly.

<mark className="diff-mark">Governance payloads on activity-boundary events also include a `fallback_used` field indicating whether a fail-safe path was used.</mark>

## Top-Level Event Types

| Event type | Emitted by | Primary use |
| --- | --- | --- |
| `WorkflowStarted` | `beforeAgent` | Start-of-run governance |
| `WorkflowCompleted` | `afterAgent` | Final outcome (`completed` or `failed`) and summary telemetry |
| `SignalReceived` | `beforeAgent`, before the model runs | Prompt-level context and auditability |
| `LLMStarted` | `wrapModelCall`, before the Chat Model is invoked | Input-time model governance and prompt guardrails |
| `LLMCompleted` | `wrapModelCall`, after the Chat Model returns | Output-time model governance, token usage, and response metadata |
| `ToolStarted` | `wrapToolCall`, before the Tool sub-node executes | Input-time tool governance and approvals |
| `ToolCompleted` | `wrapToolCall`, after the Tool sub-node executes | Output-time tool governance and tool result telemetry |

On the wire, `LLMStarted`/`LLMCompleted` and `ToolStarted`/`ToolCompleted`
are sent to OpenBox Core as `ActivityStarted`/`ActivityCompleted`; the
original LangChain-style name is preserved as `metadata.sdk_event_type` so
the dashboard can still distinguish LLM spans from tool spans.

## Business Events Versus Internal Telemetry

Business events are the node's four lifecycle stages:

- agent run start and completion
- model call start and completion
- tool call start and completion

These are not separate business events:

- internal HTTP telemetry (including the HTTP call to the model provider itself)
- internal database telemetry

Those appear as operational spans associated with the active model call,
tool call, or agent run.

## How Agent Runs Appear

Each **OpenBox: Agent** node execution creates a fresh run identity in
`beforeAgent`. The workflow type sent to OpenBox is
`n8n.Agent.<node display name>` unless you configure the node's display name
differently. See
[Configuration](/developer-guide/n8n/configuration#current-defaults-not-yet-configurable).

Important implications:

- A single node execution can appear as a workflow run in OpenBox.
- The initiating prompt is emitted as `SignalReceived(user_prompt)`.
- Model work is represented by `LLMStarted` and `LLMCompleted`, not as a tool activity.
- If the item has a string `sessionId` field, it is used as the OpenBox session identifier for that item.

## Model Payload Shape Guidance

### `LLMStarted`

Common fields:

- `prompt`: the last human message, not the full concatenated chat history
- `activity_input[0].prompt`
- `activity_type = "llm_call"`

### `LLMCompleted`

Common fields:

- `completion`
- `llm_model`
- `input_tokens`, `output_tokens`, `total_tokens`
- `has_tool_calls`

## Tool Payload Shape Guidance

### `ToolStarted`

Common fields:

- `tool_name`
- `tool_type`: always absent in the current n8n node; there is no
  `tool_type_map` equivalent in the UI yet
- `activity_type`
- `activity_input`

### `ToolCompleted`

Common fields:

- `tool_name`
- `activity_output`
- `status` (`completed` or `failed`)
- `duration_ms`

## Typical Event Sequences

### Agent Run With A Model Call

```text
SignalReceived(user_prompt)
-> WorkflowStarted
-> LLMStarted
-> zero or more telemetry spans during model execution
-> LLMCompleted
-> WorkflowCompleted
```

### Agent Run With A Tool Call

```text
SignalReceived(user_prompt)
-> WorkflowStarted
-> LLMStarted -> LLMCompleted (model decides to call a tool)
-> ToolStarted
-> zero or more telemetry spans during tool execution
-> ToolCompleted
-> LLMStarted -> LLMCompleted (model reads the tool result)
-> WorkflowCompleted
```

## Output-Side Redaction

If `WorkflowCompleted`'s guardrail result redacts the activity output, the
node overwrites the node's returned `output` field with the redacted text.
The unredacted response was already written to Memory, if a Memory sub-node
is connected; redaction is applied to the OpenBox-facing node output only.

## Model Usage And Tool Health In The UI

- Model and token usage come from `LLMCompleted` metadata when the connected Chat Model returns it.
- Tool health populates for agents that actually execute tools.
- An agent run that only generates text without tools may show model usage but no tool health.

## Policy And Guardrail Guidance

Recommended approach:

1. Use `LLMStarted` for prompt-side model governance.
2. Use `LLMCompleted` for response-side model governance.
3. Use `ToolStarted` for tool-input guardrails and approval policies.
4. Use `ToolCompleted` for tool-output guardrails and result review.
5. Treat HTTP and database telemetry as internal by default.
