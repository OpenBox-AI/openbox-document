---
title: Telemetry
description: "See what operational telemetry the OpenBox LangChain SDK captures and how it appears in OpenBox."
llms_description: LangChain SDK telemetry capture and runtime behavior
sidebar_position: 7
tags:
  - sdk
  - langchain
  - observability
---

# Telemetry

The LangChain SDK uses LangChain middleware events and the shared OpenBox
OpenTelemetry layer to attach operational evidence to governed runs. This lets
OpenBox show model calls, tool calls, HTTP calls, data access, file operations,
and traced functions alongside governance decisions.

## Capture Surfaces

### LangChain Middleware

The SDK captures:

- agent run start and completion
- user prompt signal
- model call start and completion
- tool call start and completion
- tool classification through `tool_type_map`

### HTTP

The shared telemetry layer captures outbound HTTP operations when instrumentation
is active. This is the primary path for model provider traffic and external API
calls made during tools.

### Databases

Pass a SQLAlchemy engine to `sqlalchemy_engine` to enable database operation
governance for queries executed through that engine.

```python
from sqlalchemy import create_engine

middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    agent_did=os.environ["OPENBOX_AGENT_DID"],
    agent_private_key=os.environ["OPENBOX_AGENT_PRIVATE_KEY"],
    sqlalchemy_engine=create_engine(os.environ["DATABASE_URL"]),
)
```

### File I/O

File telemetry is captured by the shared hook layer when available in the
runtime. Enable or rely on it only when you have a concrete file-governance
requirement.

### Custom Functions

For work that does not naturally appear as a model call or tool boundary, use
`traced()` to create a span that OpenBox can attach to the surrounding
execution.

```python
from openbox_langchain import traced

@traced
def enrich_customer_context(customer_id: str) -> dict:
    return {"customer_id": customer_id}
```

## Where Telemetry Appears

Telemetry is attached to the surrounding model call, tool call, or workflow
context.

That means:

- tool-related telemetry is usually attached to the tool call
- model provider HTTP telemetry is usually associated with the model call path
- internal telemetry does not create a new business event row by itself

## Why Tool Health Can Be Empty

Tool health is only meaningful for agents that actually execute tools. If an
agent only performs model generation, you should not expect tool health metrics
for that run.

## Why Model Usage Can Be Empty

Model and token usage depend on metadata returned by the underlying LangChain
model/provider integration. If the provider does not expose usage metadata, the
OpenBox run can still show model events without token totals.

## Recommended Defaults

| Setting | Recommended value |
| --- | --- |
| Model and tool middleware events | Enabled |
| HTTP capture | Enabled |
| SQLAlchemy instrumentation | Pass an engine when database governance matters |
| File I/O instrumentation | Use only when needed |
| Traced functions | Use selectively for meaningful custom operations |

## Privacy And Noise Control

Use these levers when telemetry is too noisy or too sensitive:

- avoid tracing helper functions that do not matter to operators
- classify only policy-relevant tools with `tool_type_map`
- use `skip_tool_types` for low-value internal tool names
- avoid enabling database or file capture unless operators need that evidence

## Next Steps

- [Configuration](/developer-guide/langchain/configuration)
- [Event Model](/developer-guide/langchain/event-model)
- [Troubleshooting](/developer-guide/langchain/troubleshooting)
