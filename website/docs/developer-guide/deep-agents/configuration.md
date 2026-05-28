---
title: Configuration
description: "All configuration options for the OpenBox Deep Agents SDK: environment variables, middleware parameters, and tool type mapping."
llms_description: All Deep Agents SDK configuration options
sidebar_position: 3
tags:
  - sdk
  - reference
  - deep-agents
---

# Configuration

Configure the SDK through parameters passed to `create_openbox_middleware()`. In production, load secrets from environment variables or a secret manager and pass them into the middleware.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENBOX_URL` | Recommended | — | OpenBox Core API URL to pass as `api_url` |
| `OPENBOX_API_KEY` | Recommended | — | API key to pass as `api_key` (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_AGENT_DID` | Yes, unless disabled | — | DID assigned to this OpenBox agent; used automatically when `agent_did` is omitted |
| `OPENBOX_AGENT_PRIVATE_KEY` | Yes, unless disabled | — | Base64 raw Ed25519 seed; used automatically when `agent_private_key` is omitted |
| `OPENBOX_DEBUG` | No | `false` | Enable verbose SDK logging |

## Middleware Parameters

`api_url` and `api_key` are required middleware parameters. `agent_did` and `agent_private_key` are optional parameters because the SDK falls back to `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY`.

### Connection

#### api_url

OpenBox Core API URL. HTTPS required for non-localhost.

```python
api_url="https://core.openbox.ai"          # Production
api_url="https://core.staging.openbox.ai"  # Staging
api_url="http://localhost:8000"            # Local dev (HTTP allowed)
```

#### api_key

Your API key. Always load from environment variables in production:

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

Human-readable name shown in the OpenBox Dashboard. This should match the agent name registered in OpenBox so policies and behavior rules resolve against the intended agent.

```python
agent_name="ResearchBot"
```

### Governance Behavior

#### on_api_error

Behavior when the OpenBox API is unreachable or times out:

| Value | Behavior |
|-------|----------|
| `"fail_open"` | Allow the operation to proceed (log warning). Default. |
| `"fail_closed"` | Block the operation. |

```python
on_api_error="fail_open"    # Default — prioritize availability
on_api_error="fail_closed"  # For high-security environments
```

#### governance_timeout

Maximum seconds to wait for a governance evaluation per operation. Accepts seconds as a float.

```python
governance_timeout=30.0   # Default
governance_timeout=60.0   # For slower networks
governance_timeout=10.0   # For low-latency requirements
```

#### validate

Validate the API key against OpenBox on middleware initialization. Set to `False` to skip the startup check (useful in test environments).

```python
validate=True   # Default — fails fast on bad credentials
validate=False  # Skip validation (e.g. in unit tests)
```

### DeepAgents Runtime Context

#### known_subagents

Subagent names from `create_deep_agent(subagents=[...])`. Always include `"general-purpose"` when the default DeepAgents subagent is active.

```python
known_subagents=["researcher", "analyst", "writer", "general-purpose"]
```

#### session_id

Optional session identifier to include in governance events when you need an explicit SDK-level session value. Most applications should use the DeepAgents/LangGraph invocation config instead:

```python
result = await agent.ainvoke(
    {"messages": [{"role": "user", "content": "Research AI agents"}]},
    config={"configurable": {"thread_id": "research-session-001"}},
)
```

#### task_queue

Optional task queue label included in governance metadata. Defaults to `"langgraph"` because DeepAgents runs on LangGraph.

```python
task_queue="deepagents"
```

#### tool_type_map

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

#### skip_tool_types

Set of tool names to exclude from governance evaluation entirely. Tools matching these names are allowed through without a policy check.

```python
skip_tool_types={"read_file", "write_todos"}
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

### Instrumentation

#### sqlalchemy_engine

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

1. `api_url` and `api_key` must be passed to `create_openbox_middleware()`.
2. `agent_did` and `agent_private_key` use explicit parameters first, then fall back to `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY`.
3. Optional middleware settings use explicit parameters first, then SDK defaults.

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
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),

    # Governance behavior
    on_api_error="fail_closed",   # High-security: block on API failure
    governance_timeout=45.0,
    validate=True,

    # DeepAgents context
    known_subagents=["researcher", "writer", "general-purpose"],
    session_id="research-session-001",
    task_queue="deepagents",

    # Tool classification
    tool_type_map={
        "search_web": "http",
        "fetch_page": "http",
        "write_report": "file",
        "export_data": "file",
    },
    skip_tool_types={"read_file", "write_todos"},

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

## Important Behavioral Notes

### Agent DID Identity

Newly created OpenBox agents require cryptographic DID signing by default. When **Require signing** is enabled for the registered agent, the DeepAgents SDK signs validation, governance evaluation, approval, and telemetry requests with the agent's DID identity.

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

1. **[Error Handling](/developer-guide/deep-agents/error-handling)** — Handle governance decisions in your code
2. **[Event Model](/developer-guide/deep-agents/event-model)** — Understand the DeepAgents event shapes captured by the SDK
3. **[Approvals and Guardrails](/developer-guide/deep-agents/approvals-and-guardrails)** — Review runtime enforcement behavior
