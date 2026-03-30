---
title: Event Model
description: "Understand how Mastra workflows, tools, agents, and telemetry are represented in OpenBox."
llms_description: Mastra SDK event model and payload guidance
sidebar_position: 4
tags:
  - sdk
  - mastra
  - observability
  - reference
---

# Event Model

OpenBox receives both governed boundary events and operational telemetry from the Mastra SDK. Understanding that model is necessary for writing policy, configuring guardrails, and interpreting the dashboard correctly.

## Top-Level Event Types

| Event type | Emitted by | Primary use |
| --- | --- | --- |
| `WorkflowStarted` | Wrapped workflows and agents | Start-of-run governance |
| `WorkflowCompleted` | Wrapped workflows and agents | Final outcome and summary telemetry |
| `WorkflowFailed` | Wrapped workflows and agents | Failure reporting |
| `SignalReceived` | Workflow resumes and agent lifecycle signals | Resume handling and agent-specific data |
| `ActivityStarted` | Wrapped tools and governed non-tool workflow steps | Input-time governance and approvals |
| `ActivityCompleted` | Wrapped tools and governed non-tool workflow steps | Output-time governance and approvals |

## Business Activities Versus Internal Telemetry

In the Mastra SDK, a business activity is:

- a wrapped tool execution
- a wrapped non-tool workflow step

These are not separate business activities:

- internal HTTP telemetry
- internal DB telemetry
- internal file telemetry
- internal traced-function telemetry
- agent-only model calls

Those appear as operational spans associated with a parent activity, signal, or workflow.

## How Agent Runs Appear

Wrapped agents are represented as workflow-like entities in OpenBox.

Agent identity is emitted as:

- `workflow_type = agent.id ?? agent.name`
- `workflow_id = "agent:" + workflow_type`

That is why an agent run appears as a workflow run in the dashboard.

## Signals

Agent runs emit these signals:

| Signal | When emitted | Purpose |
| --- | --- | --- |
| `user_input` | `generate()` or `stream()` start | Carry the initiating prompt or request |
| `resume` | `resumeGenerate()` or `resumeStream()` | Carry resume payload |
| `agent_output` | Completion or failure finalization | Carry agent output plus model telemetry |

Important implications:

- Agent prompts are signals, not `ActivityStarted` events.
- Agent-only model work is surfaced on `SignalReceived(agent_output)` and `WorkflowCompleted`, not as a tool activity.

## Activity Payload Shape Guidance

### `ActivityStarted`

For live guardrails and policy, `ActivityStarted` is the preferred place to inspect tool inputs.

Examples:

- `input.command` for `runCommand`
- `input.content` for `writeFile`
- `input.path` for path checks

### `ActivityCompleted`

`ActivityCompleted` retains a compatibility-oriented input shape for downstream systems. Correlate started and completed events with `activity_id` rather than assuming identical payload structure.

## Typical Event Sequences

### Tool Or Governed Step

```text
ActivityStarted
-> zero or more telemetry spans during execution
-> ActivityCompleted
```

### Agent Run

```text
WorkflowStarted
-> SignalReceived(user_input)
-> internal model and telemetry spans
-> SignalReceived(agent_output)
-> WorkflowCompleted
```

## Why You Might Not See Spans On `ActivityStarted`

This is expected for agent-only runs. If an agent is doing model work without executing tools, the model spans are attached to the agent signal path rather than a tool activity boundary.

## Model Usage And Tool Health In The UI

- Model and token usage are most relevant on agent runs.
- Tool health metrics only populate for agents that actually execute tools.
- A workflow or gateway that only orchestrates child agents may show runs without direct model usage of its own.

## Policy And Guardrail Guidance

Recommended approach:

1. Treat workflow and activity boundary events as governable business actions.
2. Treat hook-triggered telemetry as internal by default.
3. Match live tool input guardrails on `ActivityStarted`.
4. Remember that agent prompts are signals, not activities.
