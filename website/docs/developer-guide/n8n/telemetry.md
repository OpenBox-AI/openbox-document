---
title: Telemetry
description: "See what operational telemetry the OpenBox n8n node captures and how it appears in OpenBox."
llms_description: n8n node telemetry capture and runtime behavior
sidebar_position: 7
tags:
  - sdk
  - n8n
  - observability
---

# Telemetry

The **OpenBox: Agent** node uses its own lifecycle events plus built-in HTTP
and database instrumentation to attach operational evidence to governed
runs. This lets OpenBox show model calls, tool calls, HTTP calls, and data
access alongside governance decisions.

## Capture Surfaces

### Node Lifecycle

The node captures:

- agent run start and completion
- user prompt signal
- model call start and completion
- tool call start and completion

### HTTP

The node patches Node's `https` module for the duration of the run, so
outbound HTTP calls — including the call to the model provider itself and
any HTTP-based Tool sub-node — are captured as spans attached to the active
model or tool call. This is enabled by default and is not currently exposed
as a node option.

### Databases

Outbound database queries made during the run are instrumented by default.
n8n's own internal Postgres connection (used for n8n's own execution and
credential storage) is filtered out, so only queries your workflow makes —
for example through a Postgres node or tool — produce spans.

There is no `sqlalchemy_engine`-style option to configure; database
instrumentation applies automatically to database calls made while the
governed node is executing.

### File I/O

File I/O instrumentation is disabled by default and is not currently exposed
as a node option.

## Where Telemetry Appears

Telemetry is attached to the surrounding model call, tool call, or workflow
context.

That means:

- tool-related telemetry is usually attached to the tool call
- model provider HTTP telemetry is usually associated with the model call path
- internal telemetry does not create a new business event row by itself

## Why Tool Health Can Be Empty

Tool health is only meaningful for agents that actually execute tools. If a
node only performs model generation, you should not expect tool health
metrics for that run.

## Why Model Usage Can Be Empty

Model and token usage depend on metadata returned by the connected Chat
Model sub-node's provider integration. If the provider does not expose usage
metadata, the OpenBox run can still show model events without token totals.

## Current Defaults

| Setting | Value | Configurable from the node UI? |
| --- | --- | --- |
| Model and tool lifecycle events | Enabled | No |
| HTTP capture | Enabled | No |
| Database capture | Enabled (excludes n8n's own internal connection) | No |
| File I/O capture | Disabled | No |

See
[Configuration](/developer-guide/n8n/configuration#current-defaults-not-yet-configurable)
for the full list of fixed defaults.

## Next Steps

- [Configuration](/developer-guide/n8n/configuration)
- [Event Model](/developer-guide/n8n/event-model)
- [Troubleshooting](/developer-guide/n8n/troubleshooting)
