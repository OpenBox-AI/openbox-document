---
title: Configuration
description: "All configuration options for the OpenBox n8n node: credential fields, node parameters, and governance settings for the Cloud Edition and the Full Edition."
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

Everything on this page applies to both editions unless it is marked
**Cloud Edition** or **Full Edition**. See [Editions](/developer-guide/n8n/editions).

## OpenBox API Credential

Create this once under **Settings → Credentials → Add Credential**.

| Field | Required | Description |
|---|---|---|
| **API Base URL** | Yes | OpenBox Core URL. Defaults to `https://core.openbox.ai`; change it only for your own OpenBox deployment. |
| **API Key** | Yes | Agent API key issued by OpenBox. Live keys start with `obx_live_`; test keys with `obx_test_`. |
| **Agent DID** | No | Agent decentralised identifier (`did:aip:<uuid>`). |
| **Agent Private Key** | No | Base64-encoded raw 32-byte Ed25519 seed. |
| **Workload Private Key** | No | **Cloud Edition.** PKCS8 PEM RSA private key of the agent's workload identity. |

Which fields to fill depends on how the agent is registered in OpenBox:

| Agent | Fill in |
|---|---|
| **Require signing** disabled | API Base URL, API Key |
| **Require signing** enabled (the default) | API Base URL, API Key, Agent DID, Agent Private Key |
| Workload identity (organization has an identity provider) | API Base URL, API Key, Workload Private Key. Leave Agent DID and Agent Private Key blank. Cloud Edition only. |

The credential's **Test** button checks the key (and, for workload identity,
that a token can be obtained) without sending a governance event.

### Agent DID and Agent Private Key

DID signing is enabled by default for newly registered agents. If signing is
enabled, set both **Agent DID** and **Agent Private Key** on the credential —
every request is then signed locally with an Ed25519 signature. If
**Require signing** is disabled for the agent, leave both fields blank.

### Workload Private Key

**Cloud Edition.** Agents created in an organization with an active identity
provider authenticate with a workload identity (IAM v3). Paste the agent's RSA
private key (PKCS8 PEM) into **Workload Private Key**; a key pasted on a single
line is accepted. For each run the node:

1. reads the agent's workload settings from OpenBox Core (`GET /api/v3/auth/bootstrap`);
2. signs a one-minute RS256 client assertion with the key and exchanges it with
   the identity provider for an access token;
3. sends every governance request to `/api/v3/*` with the API key plus the token
   in the `X-OpenBox-Workload-Token` header.

The token is kept for one run (at most five minutes) and discarded as soon as
OpenBox rejects it. The private key never leaves n8n: only the signed assertion
goes to the identity provider, and the API key never does.

Workload authentication never fails open. If a token cannot be obtained, the
run stops with `OpenBox workload authentication failed` and no governed request
is sent, even when **On API Error** is **Fail Open**.

## OpenBox: Agent Node Parameters

These are set per node, in the n8n editor.

### Source for Prompt (User Message)

| Value | Behavior |
|-------|----------|
| **Connected Chat Trigger Node** (`auto`, default) | Reads `chatInput` from a connected Chat Trigger. If absent, the node falls back to the first non-empty string field among `chatInput`, `text`, `message`, `input`, `query`, `prompt`, then any string field on the item. |
| **Define Below** (`define`) | Use the **Prompt** field, which accepts static text or an expression. |

### Enable Fallback Model

Turn this on to add a second **Fallback Model** input. If the primary Chat
Model fails, the agent retries on the fallback, which is governed the same way.

### Options

| Option | Default | Description |
|--------|---------|-------------|
| **System Message** | `You are a helpful assistant` | Sent to the agent before the conversation starts. |
| **Max Iterations** | `10` | Maximum model/tool loop iterations before the node stops and returns a truncation message. |
| **Enable Streaming** | `false` | Stream the response when the workflow's trigger supports it. |
| **Return Intermediate Steps** | `false` | Include intermediate agent steps in the output. |
| **On Tool Error** | Return the error to the model | Let the model recover from a failed tool, or stop the agent and return the error. |
| **Automatically Passthrough Binary Images** | `true` | Pass binary images through to the agent as image-type messages. |

### Advanced Governance

| Setting | Default | Description |
|---|---|---|
| **Governance Events to Send** | all six | Which events are evaluated: workflow started/completed, LLM started/completed, tool started/completed. |
| **On API Error** | Fail Open | If OpenBox cannot be reached, continue ungoverned (**Fail Open**) or stop the workflow (**Fail Closed**). An invalid API key always stops the run. |
| **Governance Request Timeout (Seconds)** | `30` | Timeout for each call to OpenBox. |
| **Tools to Exclude From Governance** | none | Comma-separated tool names whose calls are never governed. |
| **Human-in-the-Loop Approval Enabled** | `true` | Whether the node pauses for approval when a policy asks for it. |
| **Approval Poll Interval (Seconds)** | `5` | How often to check for an approval decision. |
| **Approval Max Wait (Seconds)** | `3600` | How long to wait for a decision before halting. `0` waits indefinitely. |

#### Instrumentation (Full Edition)

The Full Edition adds four settings to **Advanced Governance**. The Cloud
Edition has no instrumentation and does not show them.

| Setting | Default | Description |
|---|---|---|
| **Instrument HTTP Calls** | `true` | Capture outgoing HTTP calls, including the model provider call, as spans. |
| **Instrument Databases** | `true` | Capture database queries made during tool execution as spans. |
| **Database Drivers to Instrument** | all five | Which drivers to instrument: `pg`, `mysql2`, `mongodb`, `redis`, `ioredis`. |
| **Instrument File I/O** | `false` | Capture file reads and writes during tool execution as spans. |

See [Telemetry](/developer-guide/n8n/telemetry) for what each one records.

## Fixed Values

| Setting | Value | Python/TypeScript SDK equivalent |
|---|---|---|
| `agentName` | Derived from the node's name (`n8n.Agent.<Node_Name>`, spaces become underscores) | `agent_name` |
| `taskQueue` | `"n8n"` | `task_queue` |
| `toolTypeMap` | `{}` (no tool classification) | `tool_type_map` |

Renaming the node changes the agent name reported to OpenBox, so its runs start
appearing under a new name.

## Next Steps

1. **[Error Handling](/developer-guide/n8n/error-handling)** — Handle governance decisions with Continue On Fail
2. **[Integration Walkthrough](/developer-guide/n8n/integration-walkthrough)** — Wire and verify an existing n8n agent
3. **[Event Model](/developer-guide/n8n/event-model)** — Understand the event payloads used by policies and guardrails
4. **[Troubleshooting](/developer-guide/n8n/troubleshooting)** — Diagnose configuration and telemetry issues
