---
title: Event Model
description: "Understand how LangChain agent runs, model calls, tools, and telemetry are represented in OpenBox."
llms_description: LangChain SDK event model and payload guidance
sidebar_position: 5
tags:
  - sdk
  - langchain
  - observability
  - reference
---

# Event Model

OpenBox receives both governed middleware events and operational telemetry from
the LangChain SDK. Understanding that model is necessary for writing policy,
configuring guardrails, and interpreting the dashboard correctly.

## Top-Level Event Types

| Event type | Emitted by | Primary use |
| --- | --- | --- |
| `WorkflowStarted` | `before_agent` middleware hook | Start-of-run governance |
| `WorkflowCompleted` | `after_agent` middleware hook | Final outcome and summary telemetry |
| `SignalReceived` | User prompt extraction before the agent starts | Prompt-level context and auditability |
| `LLMStarted` | `wrap_model_call` before model execution | Input-time model governance and prompt guardrails |
| `LLMCompleted` | `wrap_model_call` after model execution | Output-time model governance, token usage, and response metadata |
| `ToolStarted` | `wrap_tool_call` before tool execution | Input-time tool governance and approvals |
| `ToolCompleted` | `wrap_tool_call` after tool execution | Output-time tool governance and tool result telemetry |

## Business Events Versus Internal Telemetry

In the LangChain SDK, business events are the middleware boundaries:

- agent run start and completion
- model call start and completion
- tool call start and completion

These are not separate business events:

- internal HTTP telemetry
- internal database telemetry
- internal file telemetry
- internal traced-function telemetry

Those appear as operational spans associated with the active model call, tool
call, or agent run.

## How Agent Runs Appear

LangChain agent runs are represented as workflow-like entities in OpenBox.

The middleware creates a run identity at `before_agent` time and uses the
configured `agent_name` as the workflow type when present.

Important implications:

- A LangChain agent run can appear as a workflow run in OpenBox.
- The initiating prompt is emitted as `SignalReceived(user_prompt)`.
- Model work is represented by `LLMStarted` and `LLMCompleted`, not as a tool activity.

## Model Payload Shape Guidance

### `LLMStarted`

Use `LLMStarted` to inspect prompt-side data.

Common fields:

- `prompt`
- `activity_input[0].prompt`
- `activity_type = "llm_call"`

### `LLMCompleted`

Use `LLMCompleted` to inspect model response metadata.

Common fields:

- `completion`
- `llm_model`
- `input_tokens`
- `output_tokens`
- `total_tokens`
- `has_tool_calls`

## Tool Payload Shape Guidance

### `ToolStarted`

Use `ToolStarted` to inspect tool inputs and require approval before a tool
executes.

Common fields:

- `tool_name`
- `tool_type`
- `activity_type`
- `activity_input`

### `ToolCompleted`

Use `ToolCompleted` to inspect the tool output and final status.

Common fields:

- `tool_name`
- `tool_type`
- `activity_output`
- `status`
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

### Tool Call

```text
ToolStarted
-> zero or more telemetry spans during tool execution
-> ToolCompleted
```

## Model Usage And Tool Health In The UI

- Model and token usage come from `LLMCompleted` metadata when the underlying model provider returns it.
- Tool health populates for agents that actually execute tools.
- An agent run that only generates text without tools may show model usage but no tool health.

## Policy And Guardrail Guidance

Recommended approach:

1. Use `LLMStarted` for prompt-side model governance.
2. Use `LLMCompleted` for response-side model governance.
3. Use `ToolStarted` for tool-input guardrails and approval policies.
4. Use `ToolCompleted` for tool-output guardrails and result review.
5. Treat hook-triggered telemetry as internal by default.
