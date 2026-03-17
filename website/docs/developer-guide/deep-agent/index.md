---
title: Deep Agent SDK (Python)
description: "Developer reference for governing DeepAgents workflows with OpenBox: per-subagent policy targeting, HITL, tool classification, and configuration."
llms_description: DeepAgents Python SDK reference and architecture
tags:
  - sdk
  - deep-agent
  - python
---

# Deep Agent SDK (Python)

:::info Docs coming soon
This SDK is open source — full developer documentation is on the way.
In the meantime, refer to the README and examples in the repo:
**[OpenBox-AI/openbox-deepagent-sdk-python](https://github.com/OpenBox-AI/openbox-deepagent-sdk-python)**
:::

The `openbox-deepagent` package provides real-time governance and observability for [DeepAgents](https://github.com/langchain-ai/deepagents) — extending [`openbox-langgraph-sdk`](/developer-guide/langgraph) with governance features specific to the DeepAgents framework.

## What to expect

- Per-subagent policy targeting with Rego
- HITL conflict detection for DeepAgents `interrupt_on`
- Built-in tool classification for category-level policies
- Zero graph changes — wrap your existing `create_deep_agent()` graph
