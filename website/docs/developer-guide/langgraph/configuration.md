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

Configure the SDK through parameters passed to `create_openbox_graph_handler()`. In production, load secrets from environment variables or a secret manager and pass them into the handler.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENBOX_URL` | Recommended | — | OpenBox Core API URL to pass as `api_url` |
| `OPENBOX_API_KEY` | Recommended | — | API key to pass as `api_key` (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_AGENT_DID` | Yes, unless disabled | — | DID assigned to this OpenBox agent; used automatically when `agent_did` is omitted |
| `OPENBOX_AGENT_PRIVATE_KEY` | Yes, unless disabled | — | Base64 raw Ed25519 seed; used automatically when `agent_private_key` is omitted |
| `OPENBOX_DEBUG` | No | `false` | Enable verbose SDK logging |

## Handler Parameters

`api_url` and `api_key` are required handler parameters. `agent_did` and `agent_private_key` are optional parameters because the SDK falls back to `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY`.

### Connection

#### api_url

OpenBox Core API URL. HTTPS required for non-localhost.

```python
api_url="https://core.openbox.ai"          # Production
```

#### api_key

Your API key (`obx_live_*` or `obx_test_*`). Always use environment variables in production:

```python
api_key=os.getenv("OPENBOX_API_KEY")
```

#### agent_did

The DID assigned to the registered OpenBox agent. The SDK falls back to `OPENBOX_AGENT_DID` when this parameter is omitted.

```python
agent_did=os.getenv("OPENBOX_AGENT_DID")
```

#### agent_private_key

Base64 raw Ed25519 seed returned by OpenBox during identity provision or rotation. The SDK falls back to `OPENBOX_AGENT_PRIVATE_KEY` when this parameter is omitted.

```python
agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY")
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

Configure Human-in-the-Loop approval polling. When OpenBox returns `REQUIRE_APPROVAL` at a HITL-capable boundary, the SDK waits for a human decision in the dashboard.

```python
hitl={"enabled": True, "poll_interval_ms": 5000}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hitl.enabled` | `bool` | `True` | HITL flow setting; leave enabled for normal approval handling |
| `hitl.poll_interval_ms` | `int` | `5000` | Milliseconds between approval status polls |

Use policy to decide which actions require approval. `poll_interval_ms` controls how often the SDK checks OpenBox for the human decision.

### Event Filtering

Control which events the SDK sends to OpenBox. All default to `True`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `send_chain_start_event` | `bool` | `True` | Send graph invocation started event |
| `send_chain_end_event` | `bool` | `True` | Send graph invocation completed event |
| `send_tool_start_event` | `bool` | `True` | Send tool execution started event |
| `send_tool_end_event` | `bool` | `True` | Send tool execution completed event |
| `send_llm_start_event` | `bool` | `True` | Send LLM call started event |
| `send_llm_end_event` | `bool` | `True` | Accepted for configuration parity; LLM completion closes an existing LLM-start row |

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

## Configuration Resolution

1. `api_url` and `api_key` must be passed to `create_openbox_graph_handler()`.
2. `agent_did` and `agent_private_key` use explicit parameters first, then fall back to `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY`.
3. Optional handler settings use explicit parameters first, then SDK defaults.

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
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
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

## Important Behavioral Notes

### Agent DID Identity

Newly created OpenBox agents require cryptographic DID signing by default. When **Require signing** is enabled for the registered agent, the LangGraph SDK signs validation, governance evaluation, and approval requests with the agent's DID identity.

Set both values together:

```bash title=".env"
OPENBOX_AGENT_DID=did:aip:550e8400-e29b-41d4-a716-446655440000
OPENBOX_AGENT_PRIVATE_KEY=base64_raw_ed25519_seed
```

Rules:

- `OPENBOX_AGENT_DID` must use the `did:aip:<uuid>` format.
- `OPENBOX_AGENT_PRIVATE_KEY` must be the base64 raw 32-byte Ed25519 seed returned by OpenBox.
- Setting only one of the two values fails SDK configuration parsing.
- The SDK never logs the private key.

The private key is returned only when the agent identity is provisioned or rotated. Store it as a per-agent secret and rotate it from OpenBox if it is exposed.

If **Require signing** is disabled for the agent, omit both DID values and authenticate with `OPENBOX_API_KEY` only.

### Validation

Startup validation checks:

- API key format
- OpenBox URL format
- DID identity pair consistency when DID signing values are present
- live API key validation unless `validate=False`

Use `validate=False` only for tests, local mocks, or fixture servers.

## Next Steps

1. **[Error Handling](/developer-guide/langgraph/error-handling)** — Handle governance decisions in your code
2. **[Event Model](/developer-guide/langgraph/event-model)** — Understand the LangGraph event shapes captured by the SDK
3. **[Approvals and Guardrails](/developer-guide/langgraph/approvals-and-guardrails)** — Review runtime enforcement behavior
