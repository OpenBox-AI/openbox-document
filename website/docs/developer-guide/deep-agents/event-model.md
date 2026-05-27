---
title: Event Model
description: "Understand how DeepAgents invocations, model calls, tools, subagents, and telemetry are represented in OpenBox."
llms_description: DeepAgents SDK event model and payload guidance
sidebar_position: 5
tags:
  - sdk
  - deep-agents
  - observability
  - reference
---

# Event Model

OpenBox receives governed DeepAgents middleware boundaries plus operational telemetry from HTTP, file, and configured database instrumentation. Understanding that model is necessary for writing policy, configuring guardrails, and interpreting the dashboard correctly.

## Top-Level Event Types

| Event type | Emitted by | Primary use |
| --- | --- | --- |
| `SignalReceived` | User prompt pre-screen | Capture the initiating human prompt |
| `WorkflowStarted` | Agent invocation start | Start-of-run governance |
| `WorkflowCompleted` | Agent invocation end | Final outcome and summary telemetry |
| `LLMStarted` | Prompt pre-screen or model call start | Prompt-side governance and guardrails |
| `LLMCompleted` | Model call completion | Usage, model response, and output-side checks |
| `ToolStarted` | Tool or subagent call start | Input-time governance and approvals |
| `ToolCompleted` | Tool or subagent call completion | Output-time governance, result telemetry, and approvals |

The SDK implements the DeepAgents `AgentMiddleware` lifecycle. It emits root workflow events in `abefore_agent` and `aafter_agent`, model events in `awrap_model_call`, and tool/subagent events in `awrap_tool_call`.

## Business Activities Versus Internal Telemetry

In the DeepAgents SDK, a business activity is:

- a model call
- a tool execution
- a DeepAgents `task` call that dispatches to a subagent

These are operational telemetry, not separate business activities:

- provider or tool HTTP spans
- database spans from supported instrumentation
- file spans from DeepAgents built-in file tools and lower-level file instrumentation

Operational telemetry is attached to the surrounding governed boundary so the dashboard can show what happened during a model call, tool call, subagent dispatch, or full agent run.

## How Agent Runs Appear

Each `invoke()` or `ainvoke()` gets a fresh workflow/run boundary. This avoids reusing a sealed workflow ID after OpenBox finalizes a completed run.

The SDK uses:

- `agent_name` as the workflow type when provided
- `config={"configurable": {"thread_id": "..."}}` as the stable session input when available
- a fresh workflow and run identity for each execution attempt

## Signals

Before the workflow starts, the SDK emits a user prompt signal when it can extract human text from the input messages.

| Signal | When emitted | Purpose |
| --- | --- | --- |
| `user_prompt` | Before `WorkflowStarted` | Show the user request that triggered the run |

Important implications:

- Prompt governance can happen before the agent starts.
- If the input contains no human-turn text, no user prompt signal is emitted.

## Activity Payload Shape Guidance

### Tools

For tool guardrails and policy, `ToolStarted` is the preferred place to inspect tool input.

Common fields:

- `tool_name`
- `tool_type`
- `tool_input`
- `activity_input`
- `activity_input[*].__openbox.tool_type`

Examples:

- `tool_input.query` for search tools
- `tool_input.path` for file/path tools
- `tool_input.command` for execution tools

### LLM Calls

LLM events use `activity_type = "llm_call"` and include prompt/model metadata where available.

Model and token usage appear when the provider response includes usage metadata. If the provider or wrapper does not return usage, the run can still show model activity without token totals.

### Subagents

DeepAgents subagents are dispatched through the `task` tool. The SDK inspects `tool_args["subagent_type"]`, records it as `subagent_name`, and classifies the activity as `a2a`.

When a subagent is detected, the SDK appends OpenBox metadata to `activity_input`:

```json
{
  "__openbox": {
    "tool_type": "a2a",
    "subagent_name": "researcher"
  }
}
```

If `subagent_type` is missing, the SDK falls back to `"general-purpose"`.

## Typical Event Sequences

### Root Agent Run

```text
SignalReceived(user_prompt)
-> WorkflowStarted
-> zero or more model, tool, subagent, and telemetry events
-> WorkflowCompleted
```

### Tool Or Subagent Call

```text
ToolStarted
-> zero or more telemetry spans during execution
-> ToolCompleted
```

### Model Call

```text
LLMStarted
-> provider HTTP telemetry where available
-> LLMCompleted
```

## Model Usage And Tool Health In The UI

- Model and token usage appear when the model provider response includes usage metadata.
- Tool health metrics only populate for agents that actually execute tools.
- A routing agent or subagent dispatcher may show many tool/subagent calls without direct model usage of its own.

## Policy And Guardrail Guidance

Recommended approach:

1. Treat workflow, model, tool, and subagent boundary events as governable business actions.
2. Treat HTTP, database, and file spans as operational evidence by default.
3. Match live tool input guardrails on `ToolStarted`.
4. Keep `known_subagents` aligned with your configured subagent list and rely on the `task` tool payload for automatic subagent labeling.
