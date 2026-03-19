---
title: LangChain SDK (TypeScript)
description: "Developer reference for governing LangChain agents with OpenBox: callback handler, wrapTools, guardrails, HITL approvals, and hook-level governance."
llms_description: LangChain TypeScript SDK reference and architecture
tags:
  - sdk
  - langchain
  - typescript
---

# LangChain SDK (TypeScript)

:::info Docs coming soon
This SDK is open source — full developer documentation is on the way.
In the meantime, refer to the README and examples in the repo:
**[OpenBox-AI/openbox-langchain-sdk-ts](https://github.com/OpenBox-AI/openbox-langchain-sdk-ts)**
:::

The `@openbox/langchain-sdk` connects your [LangChain](https://www.langchain.com/) agents to [OpenBox](https://openbox.ai) — giving you governance policies, guardrails, and human oversight without rewriting any agent logic.

## What to expect

- Callback-based integration — attach a handler and every event flows through governance
- Hook-level governance for outbound HTTP requests
- Guardrails with automatic PII redaction
- Human-in-the-loop approvals
- Signal monitor for mid-execution abort
- `wrapTools` / `wrapLLM` helpers
