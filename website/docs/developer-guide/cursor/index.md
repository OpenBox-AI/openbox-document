---
title: Cursor
description: "Developer reference for governing Cursor IDE agents with OpenBox: architecture, event lifecycle, goal alignment, and configuration."
llms_description: Cursor Hooks developer reference
tags:
  - cursor
---

# Cursor

The [`cursor-hooks`](https://github.com/OpenBox-AI/cursor-hooks) package connects [Cursor IDE](https://cursor.com) to [OpenBox](https://openbox.ai) via Cursor's official hooks system. It sends every agent action to the platform — all trust logic, policies, guardrails, and UI management happens on OpenBox, not in cursor-hooks.

## Installation

See **[Getting Started with Cursor](/getting-started/cursor)** for setup instructions.

## How it works

```mermaid
flowchart TD
    subgraph cursor["Cursor IDE"]
        agent["Agent Loop<br/>(unchanged)"]
    end

    agent --> hooks

    subgraph hooks["cursor-hooks"]
        handler["<b>Hook Handler</b><br/>Intercepts all agent actions<br/>Routes to OpenBox<br/>Enforces verdicts"]
    end

    hooks --> engine

    engine["<b>OpenBox Trust Engine</b><br/><br/>Verdicts:<br/>ALLOW · REQUIRE_APPROVAL<br/>BLOCK · HALT"]
```

## What it captures

cursor-hooks automatically captures and sends to OpenBox:

### Prompt events
- User prompt text and attachments
- Agent response text
- Agent reasoning (thinking)

### File events
- File content on read (before the agent sees it)
- File edits (after the agent writes)

### Shell events
- Shell commands before execution
- Command output and exit code after execution

### MCP events
- MCP tool name and arguments before execution
- MCP tool response after execution

### Session events
- Session start and stop
- Goal signal (user's original prompt for drift detection)

All captured data is evaluated against your trust policies on the OpenBox platform.

## Event lifecycle

All hooks within a Cursor conversation share one OpenBox session.

| Cursor hook | What happens |
|-------------|-------------|
| `sessionStart` | Creates the OpenBox session |
| `beforeSubmitPrompt` | Captures user goal, evaluates prompt against guardrails |
| `beforeReadFile` | Evaluates file content, can redact secrets/PII |
| `beforeShellExecution` | Evaluates command against policies |
| `beforeMCPExecution` | Evaluates MCP tool call against policies |
| `afterMCPExecution` | Can redact PII from tool response |
| `afterAgentResponse` | Scores goal alignment between prompt and response |
| `afterAgentThought` | Observes agent reasoning |
| `afterShellExecution` | Records command output |
| `afterFileEdit` | Records file changes |
| `stop` | Finalizes session, generates attestation |

## Verdicts

When OpenBox evaluates an action, it returns a verdict that cursor-hooks enforces in Cursor:

| Verdict | Cursor behavior |
|---------|----------------|
| **Allow** | Action proceeds normally |
| **Require approval** | Action is paused. Approve on the OpenBox dashboard, then retry in Cursor. |
| **Block** | Action is blocked. Cursor shows the policy or guardrail message. |
| **Halt** | Action is blocked and the session is terminated. |

## Guardrails

Guardrails run automatically on before-hooks. Configure them per activity type on the OpenBox dashboard under **Agent → Authorize**:

| Activity type | Available guardrails |
|--------------|---------------------|
| `PromptSubmission` | PII detection, toxicity, content filter, ban words |
| `FileRead` | PII detection, secret redaction |
| `ShellExecution` | Rego policies |
| `MCPToolCall` | Rego policies |
| `MCPToolResponse` | PII detection |

When a guardrail triggers, the verdict determines the behavior — block the action, redact the content, or require approval.

## Redaction

For `FileRead` and `MCPToolResponse`, sensitive content is redacted before the agent sees it. The original content is never exposed — Cursor receives the redacted version.

This applies to:
- API keys and tokens in file content
- PII (emails, phone numbers, addresses) in file content or MCP responses
- Any content matched by your guardrail rules

## Human-in-the-loop approvals

When an action receives a **require_approval** verdict, cursor-hooks pauses the action and polls the OpenBox dashboard for a decision. The user approves or rejects on the dashboard, and cursor-hooks enforces the result.

Configure polling behavior in `~/.cursor-hooks/config.json`:
- `HITL_POLL_INTERVAL` — how often to check (default 5 seconds)
- `HITL_MAX_WAIT` — maximum wait before timing out (default 300 seconds)

## Goal alignment

OpenBox automatically compares the user's original prompt against the agent's response to detect drift:

1. When the user submits a prompt, the goal is captured
2. When the agent responds, the response is compared against the goal
3. OpenBox scores alignment from 0-100%

Results are visible in the OpenBox dashboard under **Agent → Verify → Goal Alignment**.

## Configuration

Config file: `~/.cursor-hooks/config.json`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `OPENBOX_API_KEY` | string | — | API key (required) |
| `OPENBOX_ENDPOINT` | string | `https://core.openbox.ai` | Core API URL |
| `GOVERNANCE_POLICY` | string | `fail_open` | `fail_open` allows actions when OpenBox is unreachable. `fail_closed` blocks them. |
| `GOVERNANCE_TIMEOUT` | number | `15` | API timeout in seconds |
| `VERBOSE` | boolean | `false` | Enable detailed logging |
| `DRY_RUN` | boolean | `false` | Allow all actions without calling OpenBox |
| `HITL_ENABLED` | boolean | `true` | Enable human-in-the-loop approval polling |
| `HITL_POLL_INTERVAL` | number | `5` | Seconds between approval status checks |
| `HITL_MAX_WAIT` | number | `300` | Maximum seconds to wait for approval |

## Troubleshooting

### Hooks not firing

Re-run `npm run install-hooks` and restart Cursor.

### File reads getting blocked

Check guardrail configuration for `FileRead` on the OpenBox dashboard. PII detection may flag API keys in file content.

## Next steps

- **[Core Concepts](/core-concepts)** — Trust Scores, Trust Tiers, Governance Decisions
- **[Trust Lifecycle](/trust-lifecycle)** — Assess, Authorize, Monitor, Verify, Adapt
