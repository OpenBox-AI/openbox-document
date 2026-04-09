---
title: Configuration
description: "Configure the LangChain Python SDK: environment variables, middleware parameters, tool classification, event filtering, and database instrumentation."
llms_description: LangChain Python SDK configuration reference
sidebar_position: 2
tags:
  - sdk
  - langchain
  - python
  - configuration
---

# Configuration

The SDK can be configured via environment variables or function parameters.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENBOX_URL` | Yes | - | OpenBox Core API URL (HTTPS required for non-localhost) |
| `OPENBOX_API_KEY` | Yes | - | API key for authentication (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_DEBUG` | No | `false` | Enable verbose SDK logging |

## Function Parameters

Parameters passed to `create_openbox_langchain_middleware()` override environment variables:

See **[Example: Full Configuration](#example-full-configuration)** for a complete `create_openbox_langchain_middleware()` example.

## Configuration Options

### api_url

OpenBox Core API URL. HTTPS required for non-localhost.

```python
api_url="https://core.openbox.ai"
```

### api_key

Your API key (`obx_live_*` or `obx_test_*`). Always use environment variables in production:

```python
api_key=os.environ.get("OPENBOX_API_KEY")
```

### agent_name

Human-readable name that matches the agent registered in the OpenBox dashboard. Defaults to `None` (falls back to `"LangChainRun"`).

```python
agent_name="ContentWriter"
```

### governance_timeout

Maximum seconds to wait for a governance API response. Default is `30.0`. Values above `600` are interpreted as milliseconds.

```python
governance_timeout=30.0   # Default
governance_timeout=60.0   # Longer timeout for slow networks
```

If timeout is exceeded, behavior follows `on_api_error`.

### on_api_error

What happens when the OpenBox API is unreachable:

| Value | Behavior |
|-------|----------|
| `fail_open` | Allow operation to proceed (log warning) |
| `fail_closed` | Block operation |

```python
on_api_error="fail_open"   # Default - prioritize availability
on_api_error="fail_closed" # For high-security environments
```

### validate

Validate API key against the server at initialization. Default `True`. Set to `False` for tests or offline development:

```python
validate=True   # Default - catches bad credentials at startup
validate=False  # Skip validation (tests, offline)
```

### tool_type_map

Map tool names to semantic types for category-level governance policies:

```python
tool_type_map={
    "web_search": "http",
    "fetch_page": "http",
    "query_db": "database",
    "save_report": "file",
}
```

Tools with a mapped type get `tool_type` metadata in their `ToolStarted` event, enabling Rego policies that target categories:

```rego
result := {"decision": "REQUIRE_APPROVAL"} if {
    input.event_type == "ToolStarted"
    input.tool_type == "http"
}
```

### skip_tool_types

Set of tool names to exclude from governance entirely. No `ToolStarted` / `ToolCompleted` events are sent:

```python
skip_tool_types={"read_file", "get_current_time"}
```

### Event Filtering

Control which events are sent to OpenBox. All default to `True`:

| Flag | Event |
|------|-------|
| `send_chain_start_event` | `WorkflowStarted` |
| `send_chain_end_event` | `WorkflowCompleted` |
| `send_llm_start_event` | `LLMStarted` (disabling also disables guardrails and PII redaction) |
| `send_llm_end_event` | `LLMCompleted` |
| `send_tool_start_event` | `ToolStarted` |
| `send_tool_end_event` | `ToolCompleted` |

```python
# Disable LLM completion events for reduced overhead
middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    send_llm_end_event=False,
)
```

:::warning
Disabling `send_llm_start_event` also disables **guardrails** and **PII redaction** since those are evaluated on the `LLMStarted` event.
:::

### sqlalchemy_engine

Pass a pre-created SQLAlchemy engine to enable database governance (Layer 2). The SDK instruments the engine to capture SQL queries as OTel spans:

```python
from sqlalchemy import create_engine

middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    sqlalchemy_engine=create_engine(os.environ["DATABASE_URL"]),
)
```

## Configuration Precedence

Function parameters take priority over environment variables, which take priority over defaults:

```
Function parameters → Environment variables → Defaults
```

## Example: Full Configuration

```python
import os
from sqlalchemy import create_engine
from openbox_langchain import create_openbox_langchain_middleware

middleware = create_openbox_langchain_middleware(
    # Required
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],

    # Identity
    agent_name="ContentWriter",

    # Governance behavior
    governance_timeout=30.0,
    on_api_error="fail_open",
    validate=True,

    # Tool classification
    tool_type_map={
        "web_search": "http",
        "fetch_page": "http",
        "query_db": "database",
    },
    skip_tool_types={"read_file", "get_time"},

    # Event filtering
    send_chain_start_event=True,
    send_chain_end_event=True,
    send_llm_start_event=True,
    send_llm_end_event=True,
    send_tool_start_event=True,
    send_tool_end_event=True,

    # Database governance
    sqlalchemy_engine=create_engine(os.getenv("DATABASE_URL")),
)
```

## Next Steps

1. **[Error Handling](/developer-guide/langchain-python/error-handling)** — Handle governance decisions in your code
2. **[Event Types](/developer-guide/event-types)** — Understand the semantic event types captured by the SDK
3. **[Approvals](/approvals)** — Review and act on HITL approval requests
