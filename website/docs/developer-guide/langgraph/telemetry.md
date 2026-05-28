---
title: Telemetry
description: "See what operational telemetry the OpenBox LangGraph SDK captures and how it appears in OpenBox."
llms_description: LangGraph SDK telemetry capture and runtime behavior
sidebar_position: 7
tags:
  - sdk
  - langgraph
  - observability
---

# Telemetry

The LangGraph SDK uses OpenTelemetry and hook-level governance to attach operational evidence to governed runs. This is what lets OpenBox show HTTP calls, data access, custom traced functions, and optional lower-level file operations alongside graph and activity events.

## Capture Surfaces

### HTTP

The SDK instruments common HTTP clients used by model providers and external services:

- `requests`
- `httpx`
- `urllib3`
- `urllib`

The OpenBox Core URL is ignored automatically to prevent recursive governance calls.

### Databases

Database instrumentation is enabled by default for supported libraries where instrumentation is available:

- PostgreSQL through `psycopg2` and `asyncpg`
- MySQL through supported DB-API clients
- SQLite
- MongoDB
- Redis
- SQLAlchemy

If a SQLAlchemy engine is created before OpenBox setup, pass it to `create_openbox_graph_handler()` using `sqlalchemy_engine`.

### File I/O

File instrumentation exists in the lower-level OpenTelemetry setup path and is disabled by default. The standard `create_openbox_graph_handler()` path does not enable file instrumentation.

### Custom Functions

For work that does not naturally appear as a tool or graph boundary, use `traced()` to create a span that OpenBox can attach to the surrounding execution.

```python
from openbox_langgraph.tracing import traced

@traced(name="fetch-account-context")
async def fetch_account_context(account_id: str) -> dict:
    return await account_store.load(account_id)
```

## Where Telemetry Appears

Telemetry is attached to the surrounding activity or workflow context.

That means:

- tool-related telemetry is usually attached to the tool activity
- LLM provider HTTP telemetry is associated with the governed LLM call where context is available
- custom traced functions attach to the current governed context
- internal telemetry does not create a new business activity row by itself

## Request Signing

When `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY` are configured, governance and hook-level OpenBox requests are signed with the agent's DID identity. This includes validation, evaluation, approval polling, and telemetry-derived evaluations.

## Why Tool Health Can Be Empty

Tool health only appears for agents that actually execute tools. If a graph only performs model generation or delegates to a child agent, tool health may be empty for that run.

## Why Model Usage Can Differ By Run Type

- Model usage depends on whether the model provider response includes token usage metadata.
- A routing graph may have no direct model usage if it only delegates work.
- Child or subagent runs can still carry their own model/token usage.

## Recommended Defaults

| Setting | Recommended value |
| --- | --- |
| HTTP instrumentation | Enabled |
| Database instrumentation | Enabled |
| File I/O instrumentation | Disabled until needed |
| Traced functions | Use selectively for meaningful custom operations |

## Privacy And Noise Control

Use these levers when telemetry is too noisy or too sensitive:

- omit file instrumentation unless needed
- use skip lists for known low-value chain or tool traffic
- avoid tracing helper functions that do not matter to operators
- use `ignored_urls` through lower-level setup only when you intentionally need additional URL exclusions

## Next Steps

- [Configuration](/developer-guide/langgraph/configuration)
- [Event Model](/developer-guide/langgraph/event-model)
- [Troubleshooting](/developer-guide/langgraph/troubleshooting)
