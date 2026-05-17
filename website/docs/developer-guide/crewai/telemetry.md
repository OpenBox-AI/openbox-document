---
title: Telemetry
description: "Understand what the OpenBox CrewAI SDK captures: task events, HTTP and database telemetry, file operations, and flow correlation."
llms_description: CrewAI task and hook telemetry model
tags:
  - sdk
  - crewai
  - python
---

# Telemetry

The CrewAI SDK emits two kinds of data to OpenBox:

- governed task boundary events
- operational telemetry from started and completed hooks

## Event Types

| Event | When | Layer |
| --- | --- | --- |
| `WorkflowStarted` | first governed task per agent per kickoff | session open |
| `WorkflowCompleted` | governed cleanup or kickoff-start drain | session close |
| `ActivityStarted` | before each governed task | Layer 1 |
| `ActivityCompleted` | after each governed task | Layer 2 |
| hook payload | HTTP, DB, or file operations | Layer 3 |

## Default Instrumentation

| Surface | Default | Notes |
| --- | --- | --- |
| HTTP | on | covers supported client libraries |
| Databases | on | captures supported DB drivers |
| File I/O | off | enable only when required |
| LLM gate | on | CrewAI before-LLM-call governance gate |

## What Hook Payloads Are For

Layer 3 data is best treated as operational telemetry:

- outbound HTTP activity
- database queries
- file operations when enabled
- runtime context for policy investigation

Use task boundaries for most business-policy decisions. Use hook-level policy only when you truly need to govern runtime operations directly.

## Correlation

Each governed run carries identifiers that let OpenBox group related activity:

- per-agent workflow session ids
- per-crew execution ids
- `flow_execution_id` when running inside `create_openbox_flow()`

This is what lets OpenBox represent nested, delegated, and multi-crew runs coherently in the UI.

## Multi-Agent Attribution

For hierarchical and delegated crews, the SDK preserves the currently active execution context so HTTP, DB, file, and LLM-gate behavior is attributed to the right governed agent rather than whichever agent first opened the trace.

## Policy Guidance

- use `ActivityStarted` and `ActivityCompleted` for business decisions
- treat hook payloads as internal telemetry unless you intentionally want to govern runtime operations
- avoid duplicate approval flows by not treating every hook payload as a business action
