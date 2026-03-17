---
title: How It Works
description: "How the OpenBox OpenClaw plugin works: tool governance flow, LLM guardrails, governance verdicts, session lifecycle, OTel span capture, and fail-open design."
llms_description: OpenClaw plugin governance flow and architecture
sidebar_position: 2
tags:
  - sdk
  - openclaw
---

# How It Works

The OpenBox plugin governs your OpenClaw agent through two paths: **tool governance** for agent tool calls and **LLM guardrails** for model inference requests. Both paths evaluate actions against your OpenBox Core policies in real time before execution.

## Tool Governance

Every tool call your agent makes passes through the plugin's `before_tool_call` hook before execution.

### Flow

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
         │
         ▼
after_tool_call hook fires
         │
         ▼
Plugin reports tool result + OTel spans to Core
```

When a tool is blocked, the agent receives a message like:

```
Blocked by governance policy: <reason from your policy>
```

The agent sees this as the tool result and can respond accordingly.

### What gets sent to Core

For each tool call, the plugin sends:
- **Tool name** — which tool the agent is calling
- **Parameters** — the full parameters passed to the tool
- **Session identity** — workflow ID, run ID, agent ID
- **Timestamps** — when the activity started

After execution, the plugin also sends:
- **Tool result** — the output (truncated to 4000 characters for string results)
- **Error information** — if the tool failed
- **Duration** — how long the tool took
- **OTel spans** — HTTP requests and filesystem operations that occurred during execution

## LLM Guardrails

When you route your LLM provider through the OpenBox gateway (see [Configuration](/developer-guide/openclaw/configuration#llm-gateway-setup)), every LLM request is evaluated for guardrails before reaching the model.

### Flow

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
         │
         ▼
LLM provider response returned to agent
```

### Guardrails

Guardrails are configured in the OpenBox platform — no code or plugin configuration changes needed.

| Type | What it does |
|------|-------------|
| **PII Detection** | Detects and redacts emails, phone numbers, SSNs, passport numbers, and other personally identifiable information |
| **Content Filtering** | Blocks requests matching specific content categories |
| **Toxicity** | Blocks abusive or hostile language from user interactions |
| **Ban Words** | Censors or blocks domain-specific banned terms (competitor names, internal codenames, regulated terms) |

When guardrails detect sensitive content:

- **Redaction** — sensitive content is replaced with sanitized values before the request reaches the LLM. The agent continues normally with the sanitized input.
- **Block** — the request is stopped entirely. The agent receives a message explaining why, formatted as a valid LLM response so the agent can process it normally.

Blocked responses are returned in the correct format for both Chat Completions and Responses APIs, including proper SSE streaming format when the agent requests streaming.

## Session Lifecycle

The plugin tracks the full lifecycle of each agent session and reports it to OpenBox Core.

### Lifecycle events

```
session_start
     │
     ▼
WorkflowStarted sent to Core (on first tool call)
     │
     ▼
┌─── Tool call ──────────────────────┐
│  ActivityStarted  → Core evaluates │  (repeats for each
│  Tool executes                     │   tool call)
│  ActivityCompleted → Core receives │
└────────────────────────────────────┘
     │
┌─── LLM inference ─────────────────┐
│  ActivityStarted  → Core records   │  (repeats for each
│  LLM responds                      │   LLM call)
│  ActivityCompleted → Core receives │
└────────────────────────────────────┘
     │
     ▼
agent_end (success or failure captured)
     │
     ▼
session_end
     │
     ▼
WorkflowCompleted or WorkflowFailed sent to Core
Gateway stopped, state reset
```

### Identity and session tracking

The plugin accumulates session identity across multiple hooks:

- `session_start` provides the `sessionId`
- `before_tool_call` provides the `sessionKey`
- Both are needed to register the session with Core

The session is registered with Core on the first governance evaluation (not at `session_start`). All subsequent events in the session reference the same `workflow_id` and `run_id`.

## OTel Span Capture

The plugin captures OpenTelemetry spans during tool execution and LLM inference and attaches them to governance events.

### What is captured

| Span type | Source | Examples |
|-----------|--------|----------|
| HTTP requests | Undici instrumentation | API calls, web fetches made during tool execution |
| Filesystem operations | Filesystem instrumentation | File reads, writes, deletes |

Spans are mapped to semantic names:

| Raw operation | Mapped name |
|--------------|-------------|
| `fs readFile`, `fs stat`, `fs readdir` | `file.read` |
| `fs writeFile`, `fs rename`, `fs mkdir` | `file.write` |
| `fs unlink`, `fs rm`, `fs rmdir` | `file.delete` |
| `fs open`, `fs close` | `file.open` |

### Self-call filtering

HTTP requests to OpenBox Core itself are automatically excluded from span capture. This prevents governance API calls from appearing as tool activity.

## Fail-Open Design

The plugin is designed to fail open. If OpenBox Core is unreachable or returns an error, tools and LLM calls execute normally.

| Scenario | Behavior |
|----------|----------|
| Core is unreachable (network error, timeout) | Tool executes, error is logged |
| Core returns an unexpected response | Tool executes, error is logged |
| Core returns no verdict | Tool executes (defaults to `allow`) |
| Core returns `allow` | Tool executes |
| Core returns `block` | Tool is prevented |

Only an explicit `block` verdict prevents execution. Everything else defaults to allowing the action.

The LLM gateway follows the same pattern: if Core is unreachable during guardrails evaluation, the LLM request is forwarded to the provider as-is.
