---
title: Configuration
description: "All configuration options for the OpenBox LangChain SDK: environment variables, DID signing, middleware parameters, and tool type mapping."
llms_description: All LangChain SDK configuration options
sidebar_position: 3
tags:
  - sdk
  - langchain
  - configuration
---

# Configuration

The LangChain SDK is configured through explicit options passed to
`create_openbox_langchain_middleware()`. In production, load connection and
identity values from environment variables in your application code.

## Configuration Precedence

Configuration is resolved in this order:

1. Explicit options passed in code
2. `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY` environment fallback when identity options are omitted
3. SDK defaults for optional fields

`api_url` and `api_key` are always required as function parameters. Most
applications pass them from `OPENBOX_URL` and `OPENBOX_API_KEY`.

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENBOX_URL` | Yes | - | OpenBox Core base URL, passed as `api_url` |
| `OPENBOX_API_KEY` | Yes | - | OpenBox API key, passed as `api_key` |
| `OPENBOX_AGENT_DID` | Yes, unless disabled | - | DID assigned to this OpenBox agent |
| `OPENBOX_AGENT_PRIVATE_KEY` | Yes, unless disabled | - | Base64 raw Ed25519 seed returned during identity provision or rotation |
| `OPENBOX_DEBUG` | No | `false` | Enable verbose SDK logging |

:::note DID signing defaults
DID signing is enabled by default for newly registered agents in OpenBox. If it
has been explicitly disabled for the agent, `OPENBOX_AGENT_DID` and
`OPENBOX_AGENT_PRIVATE_KEY` can be omitted. Otherwise, provide both values
together.
:::

## Middleware Parameters

All parameters are passed as keyword arguments to
`create_openbox_langchain_middleware()`.

### api_url

OpenBox Core API URL.

```python
api_url="https://core.openbox.ai"          # Production
api_url="https://core.staging.openbox.ai"  # Staging
api_url="http://localhost:8000"            # Local dev
```

### api_key

Agent API key issued by OpenBox. Load it from the environment in production:

```python
api_key=os.environ["OPENBOX_API_KEY"]
```

### agent_did and agent_private_key

Agent identity used to sign governance requests. These values default to
`OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY`.

```python
middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    agent_did=os.environ["OPENBOX_AGENT_DID"],
    agent_private_key=os.environ["OPENBOX_AGENT_PRIVATE_KEY"],
)
```

Provide both values together. Passing only one of them fails during SDK
configuration.

### agent_name

Human-readable name shown in the OpenBox Dashboard.

```python
agent_name="CustomerSupportAgent"
```

### on_api_error

Behavior when OpenBox Core is unreachable or times out:

| Value | Behavior |
|-------|----------|
| `"fail_open"` | Allow the operation to proceed and log a warning. Default. |
| `"fail_closed"` | Block the operation. |

```python
on_api_error="fail_open"    # Default — prioritize availability
on_api_error="fail_closed"  # High-security deployments
```

### governance_timeout

Maximum seconds to wait for a governance evaluation response.

```python
governance_timeout=30.0  # Default
governance_timeout=60.0  # Slower networks
governance_timeout=10.0  # Low-latency requirements
```

### validate

Validate the API key against OpenBox when the middleware is created.

```python
validate=True   # Default
validate=False  # Useful in tests or offline development
```

### session_id

Optional session identifier for grouping runs.

```python
session_id="support-ticket-123"
```

### task_queue

Task queue label included in emitted OpenBox events. Defaults to `langchain`.

```python
task_queue="customer-support"
```

### tool_type_map

Map LangChain tool names to semantic types. These values can be used by OpenBox
policies to target categories of tools rather than individual function names.

```python
tool_type_map={
    "search_web": "http",
    "lookup_customer": "database",
    "send_email": "communication",
}
```

### skip_tool_types

Set of LangChain tool names to exclude from governance evaluation. Use this
sparingly for internal logging or health-check tools.

```python
skip_tool_types={"log_metric", "health_check"}
```

### Event Emission Flags

Control which lifecycle events the SDK sends to OpenBox. All default to `True`.

| Parameter | Event sent |
|-----------|------------|
| `send_chain_start_event` | `WorkflowStarted` |
| `send_chain_end_event` | `WorkflowCompleted` |
| `send_tool_start_event` | `ToolStarted` |
| `send_tool_end_event` | `ToolCompleted` |
| `send_llm_start_event` | `LLMStarted` |
| `send_llm_end_event` | `LLMCompleted` |

```python
send_llm_start_event=True
send_llm_end_event=True
```

### sqlalchemy_engine

Pre-created SQLAlchemy engine for database governance. When provided, the SDK
instruments SQL queries executed through this engine.

```python
from sqlalchemy import create_engine

engine = create_engine(os.environ["DATABASE_URL"])

middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    agent_did=os.environ["OPENBOX_AGENT_DID"],
    agent_private_key=os.environ["OPENBOX_AGENT_PRIVATE_KEY"],
    sqlalchemy_engine=engine,
)
```

## Full Configuration Example

```python
import os

from langchain.agents import create_agent
from openbox_langchain import create_openbox_langchain_middleware
from sqlalchemy import create_engine

middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    agent_did=os.environ["OPENBOX_AGENT_DID"],
    agent_private_key=os.environ["OPENBOX_AGENT_PRIVATE_KEY"],
    agent_name="SupportAgent",
    on_api_error="fail_closed",
    governance_timeout=45.0,
    validate=True,
    session_id="support-session",
    task_queue="customer-support",
    tool_type_map={
        "search_web": "http",
        "lookup_customer": "database",
        "send_email": "communication",
    },
    skip_tool_types={"log_metric"},
    send_chain_start_event=True,
    send_chain_end_event=True,
    send_tool_start_event=True,
    send_tool_end_event=True,
    send_llm_start_event=True,
    send_llm_end_event=True,
    sqlalchemy_engine=create_engine(os.environ["DATABASE_URL"]),
)

agent = create_agent(
    model="openai:gpt-4o",
    tools=[search_web, lookup_customer, send_email],
    middleware=[middleware],
)
```

## Next Steps

1. **[Error Handling](/developer-guide/langchain/error-handling)** — Handle governance decisions in your code
2. **[Integration Walkthrough](/developer-guide/langchain/integration-walkthrough)** — Wire and verify an existing LangChain agent
3. **[Event Model](/developer-guide/langchain/event-model)** — Understand the event payloads used by policies and guardrails
4. **[Troubleshooting](/developer-guide/langchain/troubleshooting)** — Diagnose configuration and telemetry issues
