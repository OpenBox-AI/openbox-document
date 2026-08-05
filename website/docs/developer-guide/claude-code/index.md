---
title: Claude Code Hooks
description: "Developer reference for governing Claude Code dev sessions with OpenBox: hook configuration, event model, and observe/enforce modes."
llms_description: Claude Code hooks integration reference and architecture
sidebar_position: 1
tags:
  - sdk
  - claude-code
  - hooks
---

# Claude Code Hooks

:::tip 🆕 New page in this review
Everything on this page is new.
:::

The OpenBox Claude Code integration connects a Claude Code session to OpenBox through Claude Code's own hooks system. It handles event capture, telemetry collection, and trust evaluation, with no changes to how you use Claude Code.

| Guide | Description |
|-------|-------------|
| **[Configuration](/developer-guide/claude-code/configuration)** | Hook commands, environment variables, and observe vs. enforce modes |
| **[Integration Walkthrough](/developer-guide/claude-code/integration-walkthrough)** | End-to-end guide for wiring OpenBox into a project |
| **[Troubleshooting](/developer-guide/claude-code/troubleshooting)** | Diagnose hook, configuration, and UI interpretation issues |

:::info What the Integration Does
The integration's job is to **connect Claude Code's hook events to OpenBox** and send them to the platform. All trust logic, policies, and UI management happen on the platform, not in the hook commands.
:::

## Philosophy

- **Zero session changes**: keep using Claude Code exactly as you do today; only `.claude/settings.json` changes
- **Hook-native**: uses Claude Code's own `UserPromptSubmit`, `PreToolUse`, and `PostToolUse` hooks; no forked CLI, no wrapper process
- **Observe before enforce**: new integrations default to recording and scoring without blocking anything, until you opt in to enforcement

## Installation

**Package:** `openbox-claude-code`
**Requires:** Node.js `18+` (run via `npx`, no separate install step required)

```bash
npx openbox-claude-code --version
```

## Hook Commands

| Command | Bound to | Purpose |
|---------|----------|---------|
| `openbox-claude-code hook user-prompt-submit` | `UserPromptSubmit` | Governs the session's stated goal before the session acts on it |
| `openbox-claude-code hook pre-tool-use` | `PreToolUse` | Governs a tool call before it runs: file writes, shell commands, MCP calls |
| `openbox-claude-code hook post-tool-use` | `PostToolUse` | Records the tool call's actual result against the pre-execution decision |

See **[Configuration](/developer-guide/claude-code/configuration)** for environment variables and the full `.claude/settings.json` shape.

## What The Integration Captures

- User prompts, evaluated on `UserPromptSubmit`
- Tool calls (file read/write, shell command, MCP tool), evaluated on `PreToolUse` and completed on `PostToolUse`
- Governance decisions per hook invocation: ALLOW, CONSTRAIN, BLOCK, REQUIRE_APPROVAL, or HALT
- Commits produced during the session, tagged with an `OpenBox-Session` trailer

All captured data is evaluated against your trust policies on the OpenBox platform, same as any other integration.

## Observe And Enforce

| Mode | Behavior |
|------|----------|
| **observe** (default) | Every prompt and tool call is recorded and scored. Nothing is ever blocked. |
| **enforce** | Governance decisions are enforced: a tool call can be blocked, constrained, or paused for approval. |

Mode is set per developer, not just per project; see [Configuration → Observe vs. Enforce](/developer-guide/claude-code/configuration#observe-vs-enforce).

## Next Steps

1. **[Configuration](/developer-guide/claude-code/configuration)**: Hook commands, environment variables, and mode settings
2. **[Integration Walkthrough](/developer-guide/claude-code/integration-walkthrough)**: Wire OpenBox into a real project
