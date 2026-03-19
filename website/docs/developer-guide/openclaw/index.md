---
title: OpenClaw Plugin
description: "Developer reference for the OpenBox OpenClaw plugin: tool governance, LLM guardrails via a local gateway, OTel span capture, and fail-open design."
llms_description: OpenClaw governance plugin reference and overview
tags:
  - sdk
  - openclaw
---

# OpenClaw Plugin

The OpenBox plugin for [OpenClaw](https://openclaw.dev) governs your agent through two paths: **tool governance** for agent tool calls and **LLM guardrails** for model inference requests. Both paths evaluate actions against your OpenBox Core policies in real time before execution.

## Key Features

- **Tool-level governance** — every tool call passes through `before_tool_call` / `after_tool_call` hooks
- **LLM guardrails** — a local gateway intercepts LLM requests for PII detection, content filtering, toxicity, and ban words
- **OTel span capture** — HTTP requests and filesystem operations are captured and attached to governance events
- **Fail-open design** — if OpenBox Core is unreachable, tools and LLM calls execute normally
- **Dashboard integration** — session timelines, policy audit trails, and usage analytics

## Installation

See **[Getting Started with OpenClaw](/getting-started/openclaw)** for a step-by-step setup guide.

## How Governance Works

### Tool governance

Every tool call passes through the plugin's `before_tool_call` hook:

```
Agent decides to call a tool (e.g. Bash)
         │
         ▼
before_tool_call hook fires
         │
         ▼
Plugin sends tool name + parameters to OpenBox Core
         │
         ▼
Core evaluates against your policies
         │
         ├── allow  → tool executes normally
         └── block  → tool is prevented, agent sees the block reason
```

When a tool is blocked, the agent receives a message like `"Blocked by governance policy: <reason>"` as the tool result.

### LLM guardrails

When you route your LLM provider through the OpenBox gateway, every LLM request is evaluated:

```
Agent sends LLM request
         │
         ▼
Request hits local gateway (http://127.0.0.1:18919/v1)
         │
         ▼
Gateway sends request content to OpenBox Core
         │
         ▼
Core runs guardrails checks
         │
         ├── pass (no issues)           → request forwarded to LLM provider as-is
         ├── pass (with redaction)       → sensitive content redacted, then forwarded
         └── fail (validation failed)    → request blocked, agent receives block message
```

## Governance Verdicts

| Verdict | Effect |
|---------|--------|
| `allow` | Tool executes normally. Default when no policy matches or Core is unreachable (fail-open). |
| `block` | Current tool call is prevented. The agent receives the block reason and can try other actions. |

## Guide Contents

| Guide | Description |
|-------|-------------|
| **[How It Works](/developer-guide/openclaw/how-it-works)** | Tool governance flow, LLM guardrails, session lifecycle, OTel spans, fail-open design |
| **[Configuration](/developer-guide/openclaw/configuration)** | Plugin config, environment variables, LLM gateway setup |
| **[Verifying Your Setup](/developer-guide/openclaw/verify-setup)** | Step-by-step verification checklist |
| **[OpenBox Dashboard](/developer-guide/openclaw/dashboard)** | Session timelines, policy config, guardrails, usage analytics |
| **[Examples](/developer-guide/openclaw/examples)** | Policy, guardrail, and behavioral rule examples |
| **[Troubleshooting](/developer-guide/openclaw/troubleshooting)** | Common issues, verification checklist, and log message reference |
