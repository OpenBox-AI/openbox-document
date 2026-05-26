---
title: Event Model
description: "Understand how LangGraph graph runs, tools, LLM calls, signals, and telemetry are represented in OpenBox."
llms_description: LangGraph SDK event model and payload guidance
sidebar_position: 5
tags:
  - sdk
  - langgraph
  - observability
  - reference
---

# Event Model

OpenBox receives governed LangGraph event-stream boundaries plus operational telemetry from HTTP, database, custom traced-function hooks, and optional lower-level file hooks. Understanding that model is necessary for writing policy, configuring guardrails, and interpreting the dashboard correctly.

## Top-Level Event Types

| Event type | Emitted by | Primary use |
| --- | --- | --- |
| `SignalReceived` | User prompt pre-screen | Capture the initiating human prompt |
| `WorkflowStarted` | Root graph invocation | Start-of-run governance |
| `WorkflowCompleted` | Root graph invocation | Final outcome and summary telemetry |
| `ActivityStarted` | Tool, subagent, or LLM start | Input-time governance and approvals |
| `ActivityCompleted` | Tool, subagent, or LLM completion | Output-time governance, usage, and result telemetry |

The SDK maps LangGraph's callback stream into OpenBox events. Root `on_chain_start` and `on_chain_end` represent the run boundary. Tool calls and resolved subagent calls become activity boundaries. Human-turn model calls are pre-screened before the provider request.

## Business Activities Versus Internal Telemetry

In the LangGraph SDK, a business activity is:

- a tool execution
- a resolved subagent call
- a human-turn LLM invocation

These are operational telemetry, not separate business activities:

- internal HTTP spans
- internal DB spans
- internal file spans when lower-level file instrumentation is enabled
- internal traced-function spans

Operational telemetry is attached to the surrounding governed boundary so the dashboard can show what happened during a tool, LLM call, subagent call, or graph run.

## How Graph Runs Appear

Each governed invocation gets a fresh workflow/run boundary. This avoids reusing a sealed workflow ID after OpenBox finalizes a completed run.

The SDK uses:

- `workflow_type` from `agent_name` when provided, otherwise a LangGraph-derived fallback
- a stable thread/session input from LangGraph config when available
- a fresh workflow/run identity for each execution attempt

## Signals

Before the workflow starts, the SDK emits a user prompt signal when it can extract human text from the graph input.

| Signal | When emitted | Purpose |
| --- | --- | --- |
| `user_prompt` | Before `WorkflowStarted` | Show the user request that triggered the run |

Important implications:

- Prompt governance can happen before the graph starts.
- If the graph input contains no human text, no user prompt signal is emitted.

## Activity Payload Shape Guidance

### Tools

For tool guardrails and policy, `ActivityStarted` is the preferred place to inspect tool input.

Examples:

- `input.query` for search tools
- `input.path` for file/path tools
- `input.command` for shell-command tools

### LLM Calls

Human-turn LLM calls use `activity_type = "llm_call"` and include prompt/model metadata where available.

### Subagents

If you configure `resolve_subagent_name`, matching tool or chain events are labeled with the resolved subagent name and can appear as agent-to-agent activity in OpenBox.

## Typical Event Sequences

### Root Graph Run

```text
SignalReceived(user_prompt)
-> WorkflowStarted
-> zero or more activities and telemetry spans
-> WorkflowCompleted
```

### Tool Or Subagent Call

```text
ActivityStarted
-> zero or more telemetry spans during execution
-> ActivityCompleted
```

### Human-Turn LLM Call

```text
ActivityStarted(llm_call)
-> provider HTTP telemetry where available
-> ActivityCompleted(llm_call)
```

## Model Usage And Tool Health In The UI

- Model and token usage appear when the model provider response includes usage metadata.
- Tool health metrics only populate for agents that actually execute tools.
- A routing graph that only delegates to child agents may show runs without direct model usage of its own.

## Policy And Guardrail Guidance

Recommended approach:

1. Treat workflow and activity boundary events as governable business actions.
2. Treat hook-triggered telemetry as operational evidence by default.
3. Match live tool input guardrails on `ActivityStarted`.
4. Use `resolve_subagent_name` when tool calls represent another agent.
