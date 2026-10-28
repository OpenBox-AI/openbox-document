---
title: Editions
description: "The OpenBox n8n node comes in two editions: the Cloud Edition for n8n Cloud and self-hosted n8n, and the Full Edition for self-hosted n8n with HTTP and database telemetry."
llms_description: Cloud Edition versus Full Edition of the n8n node
sidebar_position: 2
tags:
  - sdk
  - n8n
  - javascript
---

# Editions

The **OpenBox: Agent** node ships as one npm package, `n8n-nodes-openbox-hook`,
in two editions:

| Edition | Versions | Runs on |
| --- | --- | --- |
| **Cloud Edition** | `0.5.0` and later | n8n Cloud and self-hosted n8n |
| **Full Edition** | `0.4.x` | Self-hosted n8n only |

Both editions use the same node, the same **OpenBox API** credential, the same
governance settings and the same lifecycle events, so a workflow built with one
runs with the other.

## Which One To Use

- **On n8n Cloud**, use the Cloud Edition. It is the only edition n8n Cloud
  allows.
- **On self-hosted n8n**, use the Cloud Edition unless you need OpenBox to see
  the HTTP requests and database queries your tools make. If you do, use the
  Full Edition.

## What Differs

| | Cloud Edition (0.5.0+) | Full Edition (0.4.x) |
| --- | --- | --- |
| **Where it runs** | n8n Cloud and self-hosted n8n | Self-hosted n8n only |
| **Agent run, user prompt, memory** | Governed | Governed |
| **Model calls** | Prompt, response, model and token counts | Same, plus the HTTP request to the model provider as a span |
| **Tool calls** | Tool input and output | Same, plus HTTP, database and (optionally) file spans from inside the tool |
| **Database queries** | Not captured | Captured per query for `pg`, `mysql2`, `mongodb`, `redis` and `ioredis` |
| **Where a run can be stopped** | Before a model or tool call, or after it completes | Same, plus at an individual HTTP request or query inside a tool |
| **Approvals and guardrails** | Yes | Yes |
| **Workload identity (IAM v3)** | Supported | Not supported |
| **Instrumentation settings** | None | **Instrument HTTP Calls**, **Instrument Databases**, **Database Drivers to Instrument**, **Instrument File I/O** |
| **Effect on the n8n process** | None outside the node | Patches `http`/`https`, `fetch`, database drivers and the module loader for the whole n8n process |
| **Calls to OpenBox per run** | One per governed event | One per governed event, plus one per captured span |

The Full Edition captures more because it instruments the n8n process itself.
That is also why it cannot run on n8n Cloud: n8n Cloud does not allow a
community node to change shared parts of the runtime. The Cloud Edition governs
only through the calls the node makes itself, and leaves the rest of n8n
untouched.

## Install

Both editions install from **Settings → Community Nodes → Install**.

| Edition | Package name to enter |
| --- | --- |
| Cloud Edition | `n8n-nodes-openbox-hook` |
| Full Edition | `n8n-nodes-openbox-hook@0.4.4` |

Restart n8n if prompted. The full install steps are in the
[Integration Walkthrough](/developer-guide/n8n/integration-walkthrough#part-2-install-the-node).

## Switching Editions

Switching keeps your workflows and credentials, because the node type
(`n8n-nodes-openbox-hook.openBoxAgent`) and credential type are the same in
both editions.

1. In **Settings → Community Nodes**, uninstall `n8n-nodes-openbox-hook`.
2. Install the other edition using the package name above.
3. Restart n8n.

When moving from the Full Edition to the Cloud Edition, the four instrumentation
settings disappear from the node and HTTP and database spans stop appearing in
OpenBox. Policies and guardrails that match on `LLMStarted`, `LLMCompleted`,
`ToolStarted` or `ToolCompleted` keep working unchanged.

## Next Steps

1. **[Integration Walkthrough](/developer-guide/n8n/integration-walkthrough)** — Install your edition and govern an agent
2. **[Configuration](/developer-guide/n8n/configuration)** — Credential fields and node settings for both editions
3. **[Telemetry](/developer-guide/n8n/telemetry)** — What the Full Edition's instrumentation captures
