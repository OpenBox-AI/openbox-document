---
title: Claude Code 101
description: "The Claude Code concepts that matter when adding OpenBox governance to a dev session."
llms_description: Claude Code concepts for OpenBox integration
sidebar_position: 1
tags:
  - getting-started
  - claude-code
---

# Claude Code 101

:::tip 🆕 New page in this review
Everything on this page is new.
:::

Claude Code is Anthropic's CLI coding agent. You give it a prompt, it plans, reads and edits files, runs shell commands, and calls MCP tools to get the job done, all inside your terminal, in your repository.

OpenBox does not change any of that. It observes and governs through Claude Code's own [hooks system](https://docs.claude.com/en/docs/claude-code/hooks), the same extension point Claude Code exposes for any external tool.

## Concepts That Matter

| Claude Code concept | OpenBox interpretation |
| --- | --- |
| Session | A governed dev-session agent run, tracked the same way a runtime agent session is |
| User prompt | The stated goal for the session, governed and used for downstream [alignment](/trust-lifecycle/verify) the same way a runtime agent's goal signal is |
| Tool call (file read/write, shell command, MCP tool) | A governed activity, evaluated before it runs (`PreToolUse`) and after it completes (`PostToolUse`) |
| Hook | The extension point OpenBox uses to intercept events; you configure hooks once in `.claude/settings.json`, not per session |
| Commit | If the session's changes are committed, OpenBox tags the commit with an `OpenBox-Session` trailer for [lineage](/core-concepts/agent-lineage#shift-left-one-hop-earlier) |

## What OpenBox Adds

- Prompt-time governance on `UserPromptSubmit`: the stated goal is evaluated before the session starts acting on it
- Pre-execution governance on `PreToolUse`: a file write, shell command, or MCP call can be blocked, constrained, or require approval before it runs
- Post-execution telemetry on `PostToolUse`: what actually happened is recorded against the pre-execution decision
- Dashboard replay and lineage, same as any other governed agent

## Observe First, Enforce When Ready

Every hook can run in **observe** mode (record and score, but never block) before you turn on **enforce** mode. See [Wrap an Existing Session](/getting-started/claude-code/wrap-an-existing-session#step-4-observe-then-enforce) for the switch.

## Next Steps

- [Wrap an Existing Session](/getting-started/claude-code/wrap-an-existing-session)
- [Claude Code Developer Guide](/developer-guide/claude-code)
- [Configuration](/developer-guide/claude-code/configuration)
