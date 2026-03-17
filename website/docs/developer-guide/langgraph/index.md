---
title: LangGraph SDK (Python)
description: "Developer reference for governing LangGraph agents with OpenBox: graph handler, policy enforcement, guardrails, HITL, and tool classification."
llms_description: LangGraph Python SDK reference and architecture
tags:
  - sdk
  - langgraph
  - python
---

# LangGraph SDK (Python)

:::info Docs coming soon
This SDK is open source — full developer documentation is on the way.
In the meantime, refer to the README and examples in the repo:
**[OpenBox-AI/openbox-langgraph-sdk-python](https://github.com/OpenBox-AI/openbox-langgraph-sdk-python)**
:::

The `openbox-langgraph-sdk` provides real-time governance and observability for [LangGraph](https://github.com/langchain-ai/langgraph) agents — powered by [OpenBox](https://openbox.ai).

## What to expect

- Zero graph changes — wrap your compiled graph; keep writing LangGraph as normal
- OPA/Rego policies for tool calls and LLM invocations
- Guardrails — PII redaction, content filtering, toxicity detection
- Human-in-the-loop approvals
- Behavior Rules and tool classification
- Automatic HTTP telemetry
