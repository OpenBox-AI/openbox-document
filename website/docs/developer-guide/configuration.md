---
title: Configuration
description: SDK configuration options
llms_description: All SDK configuration options
sidebar_position: 4
tags:
  - sdk
  - reference
---

# Configuration

The SDK can be configured via environment variables or function parameters.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENBOX_URL` | Yes | - | OpenBox Core API URL (HTTPS required for non-localhost) |
| `OPENBOX_API_KEY` | Yes | - | API key for authentication (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_ENABLED` | No | `true` | Enable/disable governance |
| `OPENBOX_GOVERNANCE_TIMEOUT` | No | `30.0` | Seconds to wait for governance evaluation |
| `OPENBOX_GOVERNANCE_POLICY` | No | `fail_open` | Behavior when API unreachable |
| `OPENBOX_SEND_START_EVENT` | No | `true` | Send WorkflowStarted events |
| `OPENBOX_SEND_ACTIVITY_START_EVENT` | No | `true` | Send ActivityStarted events |

## Function Parameters

Parameters passed to `create_openbox_worker()` override environment variables:

See **[Example: Full Configuration](#example-full-configuration)** for a complete `create_openbox_worker()` example.

## Configuration Options

### openbox_url

OpenBox Core API URL. HTTPS required for non-localhost.

```python
openbox_url="https://core.openbox.ai"  # Production
openbox_url="https://core.staging.openbox.ai"  # Staging
```

### openbox_api_key

Your API key (`obx_live_*` or `obx_test_*`). Always use environment variables in production:

```python
openbox_api_key=os.environ.get("OPENBOX_API_KEY")
```

### governance_timeout

Maximum seconds to wait for governance evaluation per operation.

```python
governance_timeout=30.0  # Default
governance_timeout=60.0  # For slower networks
governance_timeout=10.0  # For low-latency requirements
```

If timeout is exceeded, behavior follows `governance_policy`.

### governance_policy

What happens when OpenBox API is unreachable:

| Value | Behavior |
|-------|----------|
| `fail_open` | Allow operation to proceed (log warning) |
| `fail_closed` | Block operation |

```python
governance_policy="fail_open"   # Default - prioritize availability
governance_policy="fail_closed" # For high-security environments
```

### hitl_enabled

Enable Human-in-the-Loop approvals.

```python
hitl_enabled=True   # Default - REQUIRE_APPROVAL triggers HITL
hitl_enabled=False  # REQUIRE_APPROVAL treated as BLOCK
```

### send_start_event

Send `WORKFLOW_START` / WorkflowStarted events.

```python
send_start_event=True  # Default
send_start_event=False
```

### send_activity_start_event

Send `ACTIVITY_START` / ActivityStarted events.

```python
send_activity_start_event=True  # Default
send_activity_start_event=False
```

### skip_workflow_types

Workflow types to exclude from governance:

```python
skip_workflow_types={"UtilityWorkflow", "HealthCheckWorkflow"}
```

These workflows run without OpenBox interception.

### skip_activity_types

Activity types to exclude from governance:

```python
skip_activity_types={"internal_helper", "logging_activity"}
```

These activities run without governance evaluation.

### skip_signals

Signal names to exclude from governance:

```python
skip_signals={"heartbeat", "progress_update"}
```

These signals are not intercepted.

### instrument_databases

Enable automatic database operation instrumentation:

```python
instrument_databases=True  # Default - capture database queries
instrument_databases=False
```

### db_libraries

Select which database libraries to instrument.

```python
db_libraries={"psycopg2", "redis"}
```

Supported values:
- `psycopg2`
- `asyncpg`
- `mysql`
- `pymysql`
- `pymongo`
- `redis`
- `sqlalchemy`

### instrument_file_io

Enable automatic file I/O instrumentation:

```python
instrument_file_io=False  # Default
instrument_file_io=True   # Capture file operations
```

## Configuration Precedence

1. Function parameters (highest priority)
2. Environment variables
3. Default values (lowest priority)

## Example: Full Configuration

```python
import asyncio
import os
from temporalio.client import Client
from openbox import create_openbox_worker

async def main():
    client = await Client.connect("localhost:7233")

    worker = create_openbox_worker(
        client=client,
        task_queue="production-queue",
        workflows=[CustomerWorkflow, OrderWorkflow],
        activities=[
            process_order,
            send_notification,
            update_inventory,
        ],

        # OpenBox config from environment
        openbox_url=os.environ.get("OPENBOX_URL"),
        openbox_api_key=os.environ.get("OPENBOX_API_KEY"),

        # Event filtering
        send_start_event=True,
        send_activity_start_event=True,

        # Governance behavior
        governance_timeout=45.0,
        governance_policy="fail_closed",  # High security
        hitl_enabled=True,

        # Exclude internal workflows
        skip_workflow_types={"HealthCheck", "Metrics"},
        skip_activity_types={"log_event"},
        skip_signals={"heartbeat", "progress_update"},

        # Full instrumentation
        instrument_databases=True,
        db_libraries={"psycopg2", "redis"},
        instrument_file_io=False,
    )

    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

## Next Steps

1. **[Error Handling](/docs/developer-guide/error-handling)** - Handle governance decisions in your code
2. **[Event Types](/docs/developer-guide/event-types)** - Understand the semantic event types captured by the SDK
3. **[Approvals](/docs/approvals)** - Review and act on HITL approval requests


