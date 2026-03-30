---
title: Cursor
description: "Developer reference for governing Cursor IDE agents with OpenBox: hook handler architecture, lifecycle events, and span instrumentation."
llms_description: Cursor Hooks TypeScript developer reference
tags:
  - sdk
  - cursor
  - typescript
---

# Cursor

:::info Docs coming soon
This integration is open source — full developer documentation is on the way.
In the meantime, refer to the README and examples in the repo:
**[OpenBox-AI/cursor-hooks](https://github.com/OpenBox-AI/cursor-hooks)**
:::

The `cursor-hooks` package connects [Cursor IDE](https://cursor.com) to [OpenBox](https://openbox.ai) via Cursor's official hooks system — giving you governance policies, guardrails, and human oversight over every agent action.

## What to expect

- Hook-based integration — install once, every agent action flows through governance
- Before-hooks block or constrain prompts, file reads, shell commands, and MCP tool calls
- After-hooks observe agent responses for goal alignment and drift detection
- PII/secret redaction on file content and MCP responses
- Human-in-the-loop approvals with dashboard polling
- Session persistence across hook invocations for full lifecycle tracking
