---
title: Configuration
description: "Configure the OpenBox LangGraph SDK: environment variables, handler parameters, governance behavior, and instrumentation options."
llms_description: All LangGraph SDK configuration options
sidebar_position: 2
tags:
  - sdk
  - reference
  - langgraph
---

# Configuration

The SDK can be configured via environment variables or function parameters passed to `create_openbox_graph_handler()`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENBOX_URL` | Yes | — | OpenBox Core API URL (HTTPS required for non-localhost) |
| `OPENBOX_API_KEY` | Yes | — | API key for authentication (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_DEBUG` | No | `false` | Enable verbose SDK logging |

## Handler Parameters

Parameters passed to `create_openbox_graph_handler()` override environment variables.

### Connection

#### api_url

OpenBox Core API URL. HTTPS required for non-localhost.

```python
api_url="https://core.openbox.ai"          # Production
api_url="https://core.staging.openbox.ai"  # Staging
```

#### api_key

Your API key (`obx_live_*` or `obx_test_*`). Always use environment variables in production:

```python
api_key=os.getenv("OPENBOX_API_KEY")
```

#### agent_name

Human-readable name shown in the dashboard. Defaults to the graph class name if omitted.

```python
agent_name="CustomerSupportAgent"
```

### Governance Behavior

#### on_api_error

What happens when the OpenBox API is unreachable or times out:

| Value | Behavior |
|-------|----------|
| `"fail_open"` | Allow operation to proceed (log warning) — default |
| `"fail_closed"` | Block operation |

```python
on_api_error="fail_open"   # Default - prioritize availability
on_api_error="fail_closed" # For high-security environments
```

#### governance_timeout

Maximum seconds to wait for a governance evaluation response. The factory function accepts seconds as a float and converts internally.

```python
governance_timeout=30.0  # Default
governance_timeout=60.0  # For slower networks
governance_timeout=10.0  # For low-latency requirements
```

If timeout is exceeded, behavior follows `on_api_error`.

### Human-in-the-Loop

#### hitl.enabled

Enable Human-in-the-Loop approvals. When `True`, a `REQUIRE_APPROVAL` verdict suspends the graph and waits for a human decision in the dashboard.

```python
hitl={"enabled": True, "poll_interval_ms": 5000}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hitl.enabled` | `bool` | `False` | Enable HITL approval flow |
| `hitl.poll_interval_ms` | `int` | `5000` | Milliseconds between approval status polls |

When `hitl.enabled=False`, a `REQUIRE_APPROVAL` verdict is treated as a BLOCK and raises `GovernanceBlockedError`.

### Event Filtering

Control which events the SDK sends to OpenBox. All default to `True`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `send_chain_start_event` | `bool` | `True` | Send graph invocation started event |
| `send_chain_end_event` | `bool` | `True` | Send graph invocation completed event |
| `send_tool_start_event` | `bool` | `True` | Send tool execution started event |
| `send_tool_end_event` | `bool` | `True` | Send tool execution completed event |
| `send_llm_start_event` | `bool` | `True` | Send LLM call started event |
| `send_llm_end_event` | `bool` | `True` | Send LLM call completed event |

#### skip_chain_types

Chain (node) types to exclude from governance. These nodes run without interception.

```python
skip_chain_types={"HealthCheckChain", "LoggingChain"}
```

#### skip_tool_types

Tool types to exclude from governance evaluation.

```python
skip_tool_types={"internal_lookup", "cache_read"}
```

#### tool_type_map

Map tool names to semantic types for richer policy targeting. Values are used in OPA policy rules.

```python
tool_type_map={
    "send_email": "communication",
    "query_database": "data_access",
    "call_api": "external_request",
}
```

### Instrumentation

#### sqlalchemy_engine

Pass a pre-created SQLAlchemy engine to enable database operation governance. The SDK hooks into the engine's event system to capture SQL queries.

```python
from sqlalchemy import create_engine

engine = create_engine("postgresql://user:pass@localhost/db")

governed = create_openbox_graph_handler(
    graph=app,
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    sqlalchemy_engine=engine,
)
```

#### resolve_subagent_name

A callable that inspects a tool call and returns a subagent name if it represents a call to another agent, or `None` otherwise. Used to build the agent call graph in the dashboard.

```python
from openbox_langgraph.types import LangGraphStreamEvent

def my_resolver(event: LangGraphStreamEvent) -> str | None:
    if event.name == "invoke_research_agent":
        return "ResearchAgent"
    return None

governed = create_openbox_graph_handler(
    graph=app,
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    resolve_subagent_name=my_resolver,
)
```

## Configuration Precedence

1. Function parameters (highest priority)
2. Environment variables
3. Default values (lowest priority)

## Example: Full Configuration

```python
import os
from sqlalchemy import create_engine
from openbox_langgraph import create_openbox_graph_handler

engine = create_engine(os.getenv("DATABASE_URL"))

governed = create_openbox_graph_handler(
    graph=app,

    # Connection
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_name="ProductionAgent",

    # Governance behavior
    on_api_error="fail_closed",  # High security
    governance_timeout=45.0,

    # Human-in-the-loop
    hitl={"enabled": True, "poll_interval_ms": 3000},

    # Event filtering
    send_chain_start_event=True,
    send_chain_end_event=True,
    send_tool_start_event=True,
    send_tool_end_event=True,
    send_llm_start_event=True,
    send_llm_end_event=True,

    # Exclude internal nodes and tools
    skip_chain_types={"HealthCheck", "Metrics"},
    skip_tool_types={"log_event"},
    tool_type_map={
        "send_email": "communication",
        "query_db": "data_access",
    },

    # Database instrumentation
    sqlalchemy_engine=engine,
)
```

## Next Steps

1. **[Error Handling](/developer-guide/langgraph/error-handling)** — Handle governance decisions in your code
2. **[Event Types](/developer-guide/event-types)** — Understand the semantic event types captured by the SDK
3. **[Approvals](/approvals)** — Review and act on HITL approval requests
