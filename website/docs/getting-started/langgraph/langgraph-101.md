---
title: LangGraph 101
description: "The LangGraph concepts that matter when adding OpenBox governance to a graph-based agent."
llms_description: LangGraph concepts for OpenBox integration
sidebar_position: 2
tags:
  - getting-started
  - langgraph
  - python
---

# LangGraph 101

LangGraph is a graph runtime for building stateful AI applications. You define nodes, edges, conditional routing, and state transitions, then compile the graph into an executable app.

OpenBox does not require you to rewrite that graph. The LangGraph SDK wraps the compiled graph and observes the event stream produced during execution.

## Concepts That Matter

| LangGraph concept | OpenBox interpretation |
| --- | --- |
| Compiled graph | The unit wrapped by `create_openbox_graph_handler()` |
| Root graph invocation | A governed workflow-like run |
| Tool node | Governed activity when a tool executes |
| Model node | Governed LLM activity when human prompt content is present |
| Conditional edge | Normal graph routing; OpenBox observes the path that actually runs |
| Thread ID | Logical conversation/session input used to correlate an invocation |

## What OpenBox Adds

OpenBox adds runtime governance around the graph without changing your node definitions:

- API-key authentication and DID request signing
- prompt, tool, and output policy evaluation
- human-in-the-loop approval polling
- guardrail enforcement
- HTTP, database, custom traced-function telemetry, and optional lower-level file telemetry
- dashboard replay and operational evidence

## Standard Integration Shape

```python
governed = create_openbox_graph_handler(
    graph=app,
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    agent_name="MyAgent",
)
```

Call `governed.ainvoke()`, `governed.invoke()`, or `governed.astream()` instead of calling the raw compiled graph directly.

## DID Signing

Newly created OpenBox agents require DID signing by default. Keep `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY` together as per-agent secrets. If **Require signing** is disabled for the registered agent, omit both values.

## Next Steps

- [Wrap an Existing Graph](/getting-started/langgraph/wrap-an-existing-agent)
- [LangGraph SDK Reference](/developer-guide/langgraph)
- [Configuration](/developer-guide/langgraph/configuration)
