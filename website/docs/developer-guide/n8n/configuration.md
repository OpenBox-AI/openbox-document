---
title: Configuration
description: "All configuration options for the OpenBox n8n node: credential fields, node parameters, and current governance defaults."
llms_description: n8n node configuration options
sidebar_position: 3
tags:
  - sdk
  - n8n
  - configuration
---

# Configuration

Unlike the Python and TypeScript SDKs, the n8n node has no environment
variables or a middleware-options object. Configuration happens in two
places: the **OpenBox API** credential, and the node's own parameters.

## OpenBox API Credential

Create this once under **Settings → Credentials → Add Credential**.

| Field | Required | Description |
|---|---|---|
| **API Key** | Yes | Agent API key issued by OpenBox. Live keys start with `obx_live_`; test keys with `obx_test_`. |
| **Agent DID** | No | Agent decentralised identifier (`did:aip:<uuid>`). |
| **Agent Private Key** | No | Base64-encoded raw 32-byte Ed25519 seed. |

There is no OpenBox URL field. The credential always talks to
`https://core.openbox.ai`.

### Agent DID and Agent Private Key

DID signing is enabled by default for newly registered agents. If signing is
enabled, set both **Agent DID** and **Agent Private Key** on the credential —
every request is then signed locally with an Ed25519 signature. If
**Require signing** is disabled for the agent, leave both fields blank.

## OpenBox: Agent Node Parameters

These are set per node, in the n8n editor.

### Source for Prompt (User Message)

| Value | Behavior |
|-------|----------|
| **Connected Chat Trigger Node** (`auto`, default) | Reads `chatInput` from a connected Chat Trigger. If absent, the node falls back to the first non-empty string field among `chatInput`, `text`, `message`, `input`, `query`, `prompt`, then any string field on the item. |
| **Define Below** (`define`) | Use the **Prompt** field, which accepts static text or an expression. |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| **System Message** | `You are a helpful assistant` | Sent to the agent before the conversation starts. |
| **Max Iterations** | `10` | Maximum model/tool loop iterations before the node stops and returns a truncation message. |
| **Return Intermediate Steps** | `false` | Include intermediate agent steps in the output. |
| **Automatically Passthrough Binary Images** | `true` | Pass binary images through to the agent as image-type messages. |

## Current Defaults (Not Yet Configurable)

The node always constructs its internal governance middleware with a fixed
set of options — these are not exposed as node parameters yet, unlike the
equivalent settings in the Python and TypeScript SDKs.

| Setting | Fixed value | Python/TypeScript SDK equivalent |
|---|---|---|
| `agentName` | Derived from the node's display name (`n8n.Agent.<Node Name>`) | `agent_name` |
| `taskQueue` | `"n8n"` | `task_queue` |
| `onApiError` | `fail_open` | `on_api_error` |
| `governanceTimeout` | `30` seconds | `governance_timeout` |
| `toolTypeMap` | `{}` (no tool classification) | `tool_type_map` |
| `skipToolTypes` | none | `skip_tool_types` |
| Event emission flags (`send*Event`) | all enabled | `send_chain_start_event`, etc. |
| HITL polling | enabled, 5s interval, 5 minute timeout | — |
| HTTP instrumentation | enabled | — |
| File I/O instrumentation | disabled | — |
| Database instrumentation | enabled (n8n's own internal Postgres connection is excluded) | `sqlalchemy_engine` |

If you need one of these tuned per agent, rename the node to control the
`agentName` value shown in traces, or open an issue against
[n8n-nodes-openbox-hook](https://github.com/OpenBox-AI/openbox-n8n-sdk/issues).

## Next Steps

1. **[Error Handling](/developer-guide/n8n/error-handling)** — Handle governance decisions with Continue On Fail
2. **[Integration Walkthrough](/developer-guide/n8n/integration-walkthrough)** — Wire and verify an existing n8n agent
3. **[Event Model](/developer-guide/n8n/event-model)** — Understand the event payloads used by policies and guardrails
4. **[Troubleshooting](/developer-guide/n8n/troubleshooting)** — Diagnose configuration and telemetry issues
