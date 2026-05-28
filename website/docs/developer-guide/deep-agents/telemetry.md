---
title: Telemetry
description: "OpenTelemetry capture behavior for the OpenBox Deep Agents SDK: model calls, tools, HTTP, file I/O, database operations, and DID-signed requests."
llms_description: DeepAgents SDK telemetry and instrumentation behavior
sidebar_position: 7
tags:
  - sdk
  - deep-agents
  - observability
---

# Telemetry

The DeepAgents SDK uses the OpenBox LangGraph telemetry layer and adds DeepAgents-specific middleware context for tools, subagents, and built-in file operations.

## Telemetry Layers

| Layer | Captured by | Notes |
| --- | --- | --- |
| Agent lifecycle | DeepAgents middleware hooks | Root workflow start/completion and prompt signal |
| Model calls | `awrap_model_call` | Prompt, model metadata, output, usage when returned by provider |
| Tool calls | `awrap_tool_call` | Tool name, input, output, duration, status, policy verdict |
| Subagent dispatch | `task` tool inspection | Resolved `subagent_name` and `a2a` classification |
| HTTP spans | OpenTelemetry instrumentation | Provider calls and tool outbound requests |
| File spans | OpenTelemetry file instrumentation | Enabled by the DeepAgents middleware because DeepAgents commonly reads/writes workspace files |
| Database spans | Database instrumentation | Pass `sqlalchemy_engine` for SQLAlchemy engines created before middleware initialization |

## DID-Signed Telemetry

When **Require signing** is enabled for the registered OpenBox agent, governance and telemetry requests are signed with the agent DID identity.

```python
middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    agent_name="ResearchBot",
)
```

If signing is disabled for the agent, omit both DID values.

## HTTP Telemetry

HTTP calls made by model providers and tools are captured through OpenTelemetry instrumentation where supported. This commonly includes calls through HTTP clients used by LangChain providers and custom tools.

Policy should usually treat HTTP spans as operational evidence attached to the current model, tool, subagent, or workflow boundary.

## File Telemetry

DeepAgents includes built-in file tools such as `read_file`, `write_file`, `edit_file`, `glob`, and `grep`. The OpenBox DeepAgents middleware enables file instrumentation by default so these operations can be attached to the current governed activity.

Use file telemetry to answer questions such as:

- Which files did the agent read?
- Which files did the agent write or edit?
- Did a subagent perform file operations during a delegated task?

Avoid placing secrets in workspace paths or file contents that should not appear in operational telemetry.

## Database Telemetry

If your database engine is created after OpenBox middleware initialization, supported instrumentation can capture operations automatically. If your SQLAlchemy engine already exists, pass it explicitly:

```python
from sqlalchemy import create_engine

engine = create_engine(os.getenv("DATABASE_URL"))

middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    agent_name="ResearchBot",
    sqlalchemy_engine=engine,
)
```

## Tool And Subagent Classification

Tool classification makes policy and dashboard filtering easier:

```python
middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_name="ResearchBot",
    known_subagents=["researcher", "writer", "general-purpose"],
    tool_type_map={
        "search_web": "http",
        "export_data": "http",
        "query_db": "database",
    },
)
```

The SDK automatically classifies DeepAgents `task` calls as `a2a` when a subagent is resolved. Do not add `"task"` to `tool_type_map` for that purpose.

## Data Volume Controls

You can reduce event volume with lifecycle flags:

```python
middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_name="ResearchBot",
    send_llm_start_event=False,
    send_llm_end_event=False,
)
```

Use these flags carefully. Disabling LLM events also removes prompt and model-call evidence from OpenBox.

## Troubleshooting Missing Telemetry

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| No model usage | Provider did not return usage metadata | Confirm the model wrapper exposes token usage |
| Tool health empty | Agent did not execute tools | Run a prompt that calls at least one tool |
| Database spans missing | Engine created before instrumentation | Pass `sqlalchemy_engine` |
| Subagent name missing | `task` call did not include `subagent_type` | Configure subagents normally and include `"general-purpose"` as fallback |
| 401 on telemetry requests | DID/key mismatch or rotated private key | Verify API key, DID, and private key belong to the same registered agent |
