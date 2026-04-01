---
title: LangChain SDK (Python)
description: "Developer reference for governing LangChain Python agents with OpenBox: middleware hooks, guardrails, PII redaction, HITL approvals, and hook-level governance."
llms_description: LangChain Python SDK reference and architecture
sidebar_position: 1
tags:
  - sdk
  - langchain
  - python
---

# LangChain SDK (Python)

The `openbox-langchain-sdk-python` package provides real-time governance and observability for [LangChain](https://www.langchain.com/) Python agents. It extends [`openbox-langgraph-sdk`](/developer-guide/langgraph) with a LangChain-specific `AgentMiddleware` integration.

| Guide | Description |
|-------|-------------|
| **[Integration Walkthrough](/developer-guide/langchain-python/integration-walkthrough)** | Step-by-step guide using the content builder demo |
| **[Configuration](/developer-guide/langchain-python/configuration)** | Environment variables and all middleware parameters |
| **[Error Handling](/developer-guide/langchain-python/error-handling)** | Handle governance decisions and failures in your code |
| **[Extending the Demo](/developer-guide/langchain-python/extending-the-demo-agent)** | Add your own tools and subagent patterns |
| **[Demo Architecture](/developer-guide/langchain-python/demo-architecture)** | Middleware lifecycle, event flow, and OTel instrumentation |
| **[Troubleshooting](/developer-guide/langchain-python/troubleshooting)** | Common issues and fixes for LangChain SDK setup |

:::info What the SDK Does
The SDK's primary job is to **connect your LangChain agent to OpenBox** and evaluate governance on every model call and tool call. All trust logic, policy evaluation, and UI management happens on the OpenBox platform — not in the SDK.
:::

## Philosophy

The SDK is intentionally minimal:

- **One function call** — `create_openbox_langchain_middleware()` returns a ready-to-use middleware
- **Zero agent changes** — your tools, prompts, and chains stay exactly as they are
- **Automatic telemetry** — HTTP calls, database queries, and file I/O are captured via OpenTelemetry without extra code

## Installation

```bash
uv add openbox-langchain-sdk-python
```

Requires **Python 3.11+**. Depends on `langchain >= 0.3.0`, `langchain-core >= 0.3.0`, and `langgraph >= 0.2.0`.

## Quick Start

```python
import os
from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from openbox_langchain import create_openbox_langchain_middleware

middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    agent_name="MyAgent",
)

agent = create_agent(
    model=init_chat_model("openai:gpt-4o-mini"),
    tools=[...],
    middleware=[middleware],
)

result = agent.invoke({"messages": [("user", "Hello")]})
```

## Function Signature

```python
def create_openbox_langchain_middleware(
    *,
    api_url: str,
    api_key: str,
    agent_name: str | None = None,
    governance_timeout: float = 30.0,
    validate: bool = True,
    sqlalchemy_engine: Any = None,
    **kwargs: Any,
) -> OpenBoxLangChainMiddleware
```

The returned `OpenBoxLangChainMiddleware` implements LangChain's `AgentMiddleware` interface. Pass it to `create_agent(middleware=[...])`.

## Lifecycle Hooks

The middleware provides 8 hooks (4 sync + 4 async) that LangChain calls automatically at runtime:

| Hook | When | What OpenBox Does |
|------|------|-------------------|
| `before_agent` / `abefore_agent` | Before agent graph runs | Sends `SignalReceived`, `WorkflowStarted`, pre-screen `LLMStarted`; applies guardrails on user prompt |
| `after_agent` / `aafter_agent` | After agent graph completes | Sends `WorkflowCompleted`; cleans up span processor state |
| `wrap_model_call` / `awrap_model_call` | Before every LLM call | Runs PII redaction on prompt; sends `LLMStarted` / `LLMCompleted` with token counts |
| `wrap_tool_call` / `awrap_tool_call` | Before every tool execution | Classifies tool type; sends `ToolStarted` / `ToolCompleted`; enforces governance verdict |

### Governance Decisions

Each hook evaluates a governance verdict before the operation proceeds:

| Verdict | Behavior |
|---------|----------|
| `ALLOW` | Operation continues normally |
| `REQUIRE_APPROVAL` | Middleware polls for human decision; proceeds or halts |
| `BLOCK` | `GovernanceBlockedError` raised — single tool blocked, agent may continue |
| `HALT` | `GovernanceHaltError` raised — entire session terminated |

## What the SDK Captures

### Model Calls

Every LLM invocation is recorded:

- Prompt messages (after PII redaction if guardrails fire)
- Completion text
- Model name (`gpt-4o-mini`, etc.)
- Token counts (input, output, total)
- Latency
- Whether the response contains tool calls

### Tool Calls

Every tool execution is governed:

- Tool name and input arguments
- Output or error
- Duration
- Governance decision (allow, block, require approval)
- Tool type classification (if configured via `tool_type_map`)

### HTTP Calls (Automatic)

Via OpenTelemetry auto-instrumentation:

- Request/response bodies, headers, status codes
- Timing and latency
- Linked to the tool or model call that triggered them

### Database Operations (Optional)

When `sqlalchemy_engine` is provided:

- SQL queries and parameters
- Connection metadata

## Tool Type Classification

Map tool names to semantic types for category-level governance policies:

```python
middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    tool_type_map={
        "web_search": "http",
        "query_db": "database",
        "fetch_page": "http",
    },
    skip_tool_types={"read_file", "get_time"},
)
```

Tools in `skip_tool_types` bypass governance entirely — no `ToolStarted` / `ToolCompleted` events are sent.

## Configuration Summary

The middleware accepts configuration via:

- Environment variables
- Governance timeout and fail policies (`on_api_error`)
- Tool type mapping (`tool_type_map`, `skip_tool_types`)
- Event filtering flags
- Database instrumentation

## Next Steps

1. **[Integration Walkthrough](/developer-guide/langchain-python/integration-walkthrough)** — End-to-end setup with the content builder demo
2. **[Configuration](/developer-guide/langchain-python/configuration)** — All middleware parameters and environment variables
3. **[Error Handling](/developer-guide/langchain-python/error-handling)** — Handle governance decisions in your code
4. **[Extending the Demo](/developer-guide/langchain-python/extending-the-demo-agent)** — Add tools and subagent patterns
5. **[Policies](/trust-lifecycle/authorize/policies)** — Write Rego policies for governance rules
