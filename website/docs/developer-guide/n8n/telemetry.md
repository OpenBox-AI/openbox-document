---
title: Telemetry
description: "See what operational telemetry each edition of the OpenBox n8n node captures, and how it appears in OpenBox."
llms_description: n8n node telemetry capture and runtime behavior
sidebar_position: 7
tags:
  - sdk
  - n8n
  - observability
---

# Telemetry

Both editions send the node's lifecycle events. The **Full Edition** also
instruments HTTP, database, and file activity during the run and attaches it as
spans to the model or tool call that caused it. The **Cloud Edition** captures
no operational telemetry. See [Editions](/developer-guide/n8n/editions).

| Capture surface | Cloud Edition | Full Edition |
| --- | --- | --- |
| Node lifecycle (run, prompt, model, tool, memory) | Yes | Yes |
| HTTP, including the model provider call | No | Yes, on by default |
| Database queries | No | Yes, on by default |
| File reads and writes | No | Off by default |

## Node Lifecycle

Both editions capture:

- agent run start and completion
- user prompt signal
- model call start and completion, with model name and token counts when the provider reports them
- tool call start and completion, with tool input and output
- memory load and save, when a Memory sub-node is connected

In the Cloud Edition this is the complete record of a run: OpenBox sees what
went into and came out of each model and tool call, but not the I/O a tool
performed internally.

## Full Edition Instrumentation

Spans are only recorded for work that runs **inside a governed model or tool
call**. I/O elsewhere in the n8n process (background jobs, queue polling, n8n's
own persistence between executions) is not captured. Each span is sent as a
`started` / `completed` pair sharing one span ID, so the dashboard can show its
duration.

| Kind | Span name | Setting |
| --- | --- | --- |
| HTTP | `POST https://…`, with the status code on the completed half | **Instrument HTTP Calls** (on) |
| PostgreSQL | `SELECT postgresql`, `INSERT postgresql`, … | **Instrument Databases** (on) |
| MySQL | `SELECT mysql`, … | **Instrument Databases** (on) |
| MongoDB | `FIND mongodb`, `INSERTONE mongodb`, … | **Instrument Databases** (on) |
| Redis | `GET redis`, `HGETALL redis`, … | **Instrument Databases** (on) |
| File I/O | `file.read`, `file.write`, … | **Instrument File I/O** (off) |
| Failed connections | `CONNECT postgresql`, `CONNECT redis`, … | Emitted only when a database connection fails |

**Database Drivers to Instrument** limits database capture to the drivers you
choose.

### Failed Connections

A database that cannot be reached produces no queries, so a wrong host or an
expired password would otherwise look like an idle tool. A failed connection is
reported as a `CONNECT` span carrying the driver's error and the target host,
port, and database. The credential itself is never included. Successful
connections are not reported.

### Separating Your Work From n8n's

The node runs inside n8n, so it can see n8n's own database and Redis traffic.
Two filters remove it:

- **Postgres:** queries issued by n8n's own ORM are skipped, regardless of host,
  database, or table, because n8n and an agent's memory often share one
  database.
- **Redis:** n8n's Bull queue connection (`QUEUE_BULL_REDIS_HOST` and
  `QUEUE_BULL_REDIS_PORT`) and n8n's own keys (`bull:*`, `n8n.*`, honouring
  `QUEUE_BULL_PREFIX`) are skipped.

Both filters err toward showing too much: an unrecognised internal query appears
as one stray span rather than a needed span being dropped. MySQL and MongoDB
have no filter, because n8n does not use them internally.

### Why This Is Self-Hosted Only

To capture these spans the Full Edition patches `http`/`https`, `fetch`, the
database drivers, and Node's module loader for the whole n8n process. n8n Cloud
does not allow community nodes to do this, which is why the Cloud Edition
exists.

## Where Telemetry Appears

Full Edition spans are attached to the surrounding model call, tool call, or
workflow context:

- tool-related telemetry is attached to the tool call
- model provider HTTP telemetry is associated with the model call
- telemetry does not create a new business event row by itself

## Why Tool Health Can Be Empty

Tool health is only meaningful for agents that actually execute tools. If a
node only performs model generation, you should not expect tool health
metrics for that run.

## Why Model Usage Can Be Empty

Model and token usage depend on metadata returned by the connected Chat
Model sub-node's provider integration. If the provider does not expose usage
metadata, the OpenBox run can still show model events without token totals.

## Next Steps

- [Editions](/developer-guide/n8n/editions)
- [Configuration](/developer-guide/n8n/configuration)
- [Event Model](/developer-guide/n8n/event-model)
- [Troubleshooting](/developer-guide/n8n/troubleshooting)
