---
title: Configuration
description: "Configure the OpenBox Claude Code integration: hook commands, environment variables, observe vs. enforce modes, and per-developer privacy controls."
llms_description: All Claude Code integration configuration options
sidebar_position: 2
tags:
  - sdk
  - reference
  - claude-code
---

# Configuration

:::tip 🆕 New page in this review
Everything on this page is new.
:::

Configure the integration through `.claude/settings.json` hook entries and environment variables. In production, load secrets from your existing secret manager rather than committing them.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENBOX_URL` | Recommended | None | OpenBox Core API URL |
| `OPENBOX_API_KEY` | Recommended | None | API key (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_AGENT_DID` | Yes, unless disabled | None | DID assigned to this dev-session agent |
| `OPENBOX_AGENT_PRIVATE_KEY` | Yes, unless disabled | None | Base64 raw Ed25519 seed |
| `OPENBOX_CLAUDE_CODE_MODE` | No | `observe` | `observe` or `enforce`; see [Observe vs. Enforce](#observe-vs-enforce) |
| `OPENBOX_DEBUG` | No | `false` | Enable verbose hook logging |

## Hook Configuration

```json title=".claude/settings.json"
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "npx openbox-claude-code hook user-prompt-submit" }] }
    ],
    "PreToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "npx openbox-claude-code hook pre-tool-use" }] }
    ],
    "PostToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "npx openbox-claude-code hook post-tool-use" }] }
    ]
  }
}
```

The `matcher` field follows Claude Code's own hook-matching syntax. `"*"` governs every tool; narrow it (for example to `Bash` or `Write`) if you only want OpenBox in the loop for specific tool types.

### Excluding Tools

```json
{ "matcher": "Read", "hooks": [] }
```

Give a tool an empty hooks array to exclude it from governance entirely (useful for high-volume, low-risk tools like file reads).

## Observe vs. Enforce

| Mode | Behavior |
|------|----------|
| `observe` (default) | Every prompt and tool call is recorded and scored. Nothing is ever blocked, regardless of what a policy would otherwise decide. |
| `enforce` | Governance decisions are enforced at the hook boundary: `PreToolUse` can exit non-zero to block a tool call, per Claude Code's own hook exit-code contract. |

Set globally via `OPENBOX_CLAUDE_CODE_MODE`, or override per developer:

```bash title=".env.local (not committed)"
OPENBOX_CLAUDE_CODE_MODE=observe
```

### Per-Developer Privacy Controls

Because a Claude Code session can include local file contents and shell output, individual developers can restrict what their own hooks send without changing the project's shared configuration:

| Variable | Effect |
|----------|--------|
| `OPENBOX_CLAUDE_CODE_REDACT_FILE_CONTENTS` | Send file paths and diff stats without full file contents |
| `OPENBOX_CLAUDE_CODE_REDACT_SHELL_OUTPUT` | Send the command that ran without its stdout/stderr |

These are read from the developer's own shell environment, not `.claude/settings.json`, so one developer's privacy setting doesn't change what the hooks send for the rest of the team.

## Configuration Resolution

1. `OPENBOX_URL` and `OPENBOX_API_KEY` must be set for the hook commands to reach OpenBox.
2. `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY` are required together unless **Require signing** is disabled for the agent.
3. `OPENBOX_CLAUDE_CODE_MODE` defaults to `observe` when unset.
4. Per-developer redaction variables apply on top of whatever the project's hooks otherwise send.

## Next Steps

1. **[Integration Walkthrough](/developer-guide/claude-code/integration-walkthrough)**: Wire this into a real project
2. **[Troubleshooting](/developer-guide/claude-code/troubleshooting)**: Diagnose configuration issues
