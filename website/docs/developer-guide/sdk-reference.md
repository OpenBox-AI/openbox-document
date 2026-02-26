---
title: SDK Reference
description: Thin wrapper for Temporal workflow integration
sidebar_position: 6
---

# SDK Reference

The OpenBox SDK integrates with Temporal workflows. It handles event capture, telemetry collection, and trust evaluation with a single function call.

:::info What the SDK Does
The SDK's primary job is to **wrap your Temporal worker** and send workflow/activity events to the OpenBox platform. All trust logic, policies, and UI management happens on the platform - not in the SDK.
:::

## Philosophy

The SDK is intentionally minimal:

- **One function call** to wrap your worker (`create_openbox_worker`)
- **Zero code changes** to workflow/activity logic. Worker initialization requires adding OpenBox wrapper (~5 lines).
- **Automatic telemetry** - captures HTTP, database, and file I/O operations

## Supported Engines

| Engine | Language | Status |
|--------|----------|--------|
| Temporal | Python | ✅ Supported |

## Installation and Setup

See:

1. **[Wrap an Existing Agent](/docs/getting-started/wrap-an-existing-agent)** - Wrap an existing Temporal worker
2. **[Temporal (Python)](/docs/developer-guide/temporal-integration-guide-python)** - End-to-end setup from scratch
3. **[Configuration](/docs/developer-guide/configuration)** - All SDK options for `create_openbox_worker`

## What the SDK Captures

The SDK automatically captures and sends to OpenBox:

### Workflow Events
- Workflow started/completed/failed
- Signal received
- Query executed

### Activity Events
- Activity started (with input)
- Activity completed (with output and duration)
- Activity failed (with error)

### HTTP Telemetry
- Request/response bodies (for LLM calls, external requests)
- Headers and status codes
- Request duration and timing

### Database Operations (Optional)
- SQL queries (PostgreSQL, MySQL)
- NoSQL operations (MongoDB, Redis)

### File I/O (Optional)
- File read/write operations
- File paths and sizes

All captured data is evaluated against your trust policies on the OpenBox platform.

## Tracing

The `@traced` decorator wraps any function in an OpenTelemetry span so it appears in session replay. It works on both sync and async functions.

### Import

```python
from openbox.tracing import traced
```

### Basic Usage

```python
@traced
def process_data(input_data):
    return transform(input_data)

@traced
async def fetch_data(url):
    return await http_get(url)
```

### With Options

```python
@traced(
    name="custom-span-name",
    capture_args=True,       # Capture function arguments (default: True)
    capture_result=True,     # Capture return value (default: True)
    capture_exception=True,  # Capture exception details on error (default: True)
    max_arg_length=2000,     # Max length for serialized arguments (default: 2000)
)
async def process_sensitive_data(data):
    return await handle(data)
```

### Manual Spans

For more control, use `create_span` as a context manager:

```python
from openbox.tracing import create_span

with create_span("my-operation", {"input": data}) as span:
    result = do_something()
    span.set_attribute("output", result)
```

## How It Works

```mermaid
flowchart TD
    subgraph worker["Your Temporal Worker"]
        workflow["Your Workflow<br/>(unchanged)"]
        activity["Your Activity<br/>(unchanged)"]
        sdk["<b>OpenBox SDK (Interceptors)</b><br/>Captures events<br/>Collects HTTP/DB/File telemetry<br/>Sends events to OpenBox"]
        workflow --> sdk
        activity --> sdk
    end

    sdk --> engine

    engine["<b>OpenBox Trust Engine</b><br/><br/>Verdicts:<br/>ALLOW · REQUIRE_APPROVAL<br/>BLOCK · HALT"]
```

## Configuration

See **[Configuration](/docs/developer-guide/configuration)** for all options including:
- Environment variables
- Governance timeout and fail policies
- Event filtering (skip workflows/activities)
- Database and file I/O instrumentation

## Next Steps

1. **[Temporal Integration](/docs/developer-guide/temporal-integration-guide-python)** - Wrap an existing Temporal agent with the SDK
2. **[Configuration](/docs/developer-guide/configuration)** - Configure timeouts, fail policies, and exclusions
3. **[Error Handling](/docs/developer-guide/error-handling)** - Handle governance decisions in your code
