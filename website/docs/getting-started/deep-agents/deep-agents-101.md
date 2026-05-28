---
title: Deep Agents 101
description: "The DeepAgents concepts that matter when you add OpenBox governance: agents, tools, subagents, middleware, and runtime state."
llms_description: DeepAgents conceptual overview for OpenBox users
sidebar_position: 2
tags:
  - getting-started
  - deep-agents
  - python
---

# Deep Agents 101

DeepAgents builds production-oriented agents on top of LangGraph. You define a model, tools, optional subagents, memory, skills, and a backend. OpenBox adds governance through DeepAgents middleware, so your agent code stays in the DeepAgents runtime while OpenBox evaluates actions and records evidence.

## Core Concepts

| Concept | DeepAgents role | OpenBox relevance |
| --- | --- | --- |
| `create_deep_agent()` | Builds the agent graph | The OpenBox middleware is passed through `middleware=[...]` |
| Tools | Functions the agent can call | Governed with `ToolStarted` and `ToolCompleted` events |
| Subagents | Specialized agents dispatched through the `task` tool | Labeled as agent-to-agent (`a2a`) activity when the SDK resolves the subagent name |
| Memory | Instructions and context loaded into the agent | Appears as part of the normal model/tool execution context |
| Skills | Reusable task procedures | Governed through the model and tool calls they trigger |
| Backend | Persistence layer for files/state | File and database operations can be captured as telemetry |
| Middleware | Runtime hook surface | OpenBox evaluates policy, guardrails, approvals, and telemetry from here |

## Standard OpenBox Integration Shape

```python
import os
from deepagents import create_deep_agent
from langchain.chat_models import init_chat_model
from openbox_deepagent import create_openbox_middleware

middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    agent_name="ResearchBot",
    known_subagents=["researcher", "writer", "general-purpose"],
    tool_type_map={"search_web": "http"},
)

agent = create_deep_agent(
    model=init_chat_model("openai:gpt-4o-mini"),
    tools=[search_web, write_report],
    subagents=[
        {"name": "researcher", "description": "Researches sources", "tools": [search_web]},
        {"name": "writer", "description": "Drafts final reports", "tools": [write_report]},
    ],
    middleware=[middleware],
)
```

If **Require signing** is enabled for the registered OpenBox agent, provide both `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY`. If signing is disabled, omit both DID values.

## What OpenBox Captures

- A user prompt signal when the SDK can extract the initiating human message
- Root workflow start and completion for each agent invocation
- Model calls, including prompt and usage metadata when the provider returns it
- Tool calls before and after execution
- DeepAgents `task` calls, including resolved subagent names where available
- HTTP, file, and configured database telemetry that happens during governed activities
- Governance verdicts, approvals, guardrail outcomes, and runtime errors

## Subagents

DeepAgents dispatches subagents through the `task` tool. The SDK inspects the `subagent_type` argument, records that value as `subagent_name`, and automatically classifies the call as `a2a`.

Always pass the subagent names you configure:

```python
known_subagents=["researcher", "analyst", "writer", "general-purpose"]
```

Include `"general-purpose"` if you use the default DeepAgents subagent. If a `task` call does not include `subagent_type`, the SDK falls back to `"general-purpose"`.

## Where To Go Next

1. Use [Wrap an Existing Agent](/getting-started/deep-agents/wrap-an-existing-agent) to integrate an existing DeepAgents app.
2. Use the [Deep Agents Integration Guide](/developer-guide/deep-agents/integration-walkthrough) to run the content builder demo.
3. Use [Configuration](/developer-guide/deep-agents/configuration) for the full middleware option list.
