---
title: Configuration
description: "All configuration options for the OpenBox Deep Agents SDK: environment variables, middleware parameters, and tool type mapping."
llms_description: All Deep Agents SDK configuration options
sidebar_position: 2
tags:
  - sdk
  - reference
  - deep-agents
---

# Configuration

The SDK can be configured via environment variables or parameters passed to `create_openbox_middleware()`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENBOX_URL` | Yes | — | OpenBox Core API URL (HTTPS required for non-localhost) |
| `OPENBOX_API_KEY` | Yes | — | API key for authentication (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_DEBUG` | No | `false` | Enable verbose SDK logging |

## Middleware Parameters

All parameters are passed as keyword arguments to `create_openbox_middleware()`. Function parameters override environment variables.

### api_url

OpenBox Core API URL. HTTPS required for non-localhost.

```python
api_url="https://core.openbox.ai"          # Production
api_url="https://core.staging.openbox.ai"  # Staging
api_url="http://localhost:8000"            # Local dev (HTTP allowed)
```

### api_key

Your API key. Always load from environment variables in production:

```python
api_key=os.getenv("OPENBOX_API_KEY")
```

### agent_name

Human-readable name shown in the OpenBox Dashboard. Defaults to the graph class name if omitted.

```python
agent_name="ResearchBot"
```

### on_api_error

Behavior when the OpenBox API is unreachable or times out:

| Value | Behavior |
|-------|----------|
| `"fail_open"` | Allow the operation to proceed (log warning). Default. |
| `"fail_closed"` | Block the operation. |

```python
on_api_error="fail_open"    # Default — prioritize availability
on_api_error="fail_closed"  # For high-security environments
```

### governance_timeout

Maximum seconds to wait for a governance evaluation per operation. Accepts seconds as a float. Values greater than 600 are interpreted as milliseconds and auto-converted.

```python
governance_timeout=30.0   # Default
governance_timeout=60.0   # For slower networks
governance_timeout=10.0   # For low-latency requirements
```

### validate

Validate the API key against OpenBox on middleware initialization. Set to `False` to skip the startup check (useful in test environments).

```python
validate=True   # Default — fails fast on bad credentials
validate=False  # Skip validation (e.g. in unit tests)
```

### tool_type_map

Map tool function names to semantic type strings. Used to apply category-level policies (e.g. block all `"http"` tools) without listing each tool individually.

```python
tool_type_map={
    "search_web": "http",
    "fetch_page": "http",
    "write_report": "file",
    "export_data": "file",
    "query_db": "database",
}
```

### skip_tool_types

Set of semantic tool types to exclude from governance evaluation entirely. Tools matching these types are allowed through without a policy check.

```python
skip_tool_types={"internal", "logging"}
```

### Event Emission Flags

Control which lifecycle events are sent to OpenBox. All default to `True`.

| Parameter | Event sent |
|-----------|-----------|
| `send_chain_start_event` | Agent graph started |
| `send_chain_end_event` | Agent graph completed |
| `send_tool_start_event` | Tool call started |
| `send_tool_end_event` | Tool call completed |
| `send_llm_start_event` | LLM call started |
| `send_llm_end_event` | LLM call completed |

```python
# Disable LLM event emission (reduces data volume)
send_llm_start_event=False,
send_llm_end_event=False,
```

### sqlalchemy_engine

Pre-created SQLAlchemy engine for database governance. When provided, the SDK instruments SQL queries executed through this engine.

```python
from sqlalchemy import create_engine

engine = create_engine("postgresql+psycopg2://user:pass@localhost/mydb")

middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    sqlalchemy_engine=engine,
)
```

## Configuration Precedence

1. Function parameters (highest priority)
2. Environment variables
3. Default values (lowest priority)

## Full Configuration Example

```python
import os
from sqlalchemy import create_engine
from openbox_deepagent import create_openbox_middleware

middleware = create_openbox_middleware(
    # Required
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),

    # Agent identity
    agent_name="ResearchBot",
    # Governance behavior
    on_api_error="fail_closed",   # High-security: block on API failure
    governance_timeout=45.0,
    validate=True,

    # Tool classification
    tool_type_map={
        "search_web": "http",
        "fetch_page": "http",
        "write_report": "file",
        "export_data": "file",
    },
    skip_tool_types={"internal"},

    # Event emission — disable LLM events to reduce data volume
    send_chain_start_event=True,
    send_chain_end_event=True,
    send_tool_start_event=True,
    send_tool_end_event=True,
    send_llm_start_event=False,
    send_llm_end_event=False,

    # Database instrumentation
    sqlalchemy_engine=create_engine(os.getenv("DATABASE_URL")),
)
```

## Next Steps

1. **[Error Handling](/developer-guide/deep-agents/error-handling)** — Handle governance decisions in your code
2. **[Event Types](/developer-guide/event-types)** — Understand the semantic event types captured by the SDK
3. **[Approvals](/approvals)** — Review and act on HITL approval requests
