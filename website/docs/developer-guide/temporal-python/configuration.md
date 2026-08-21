---
title: Configuration
description: "Configure the OpenBox plugin: Set API keys, define policies, control runtime behavior - no infrastructure changes needed."
llms_description: All plugin configuration options
sidebar_position: 4
tags:
  - sdk
  - reference
---

# Configuration

The sole OpenBox integration surface is the native Temporal `Worker(..., plugins=[OpenBoxPlugin(...)])` shape. The plugin initializer owns all OpenBox Worker, Workflow, and Activity setup.

The plugin can be configured via environment variables or constructor parameters.

## Environment Variables

| Variable                            | Required | Default     | Description                                               |
| ----------------------------------- | -------- | ----------- | --------------------------------------------------------- |
| `OPENBOX_URL`                       | Yes      | -           | OpenBox Core API URL (HTTPS required for non-localhost)   |
| `OPENBOX_API_KEY`                   | Yes      | -           | API key for authentication (`obx_live_*` or `obx_test_*`) |
| `OPENBOX_ENABLED`                   | No       | `true`      | Enable/disable governance                                 |
| `OPENBOX_GOVERNANCE_TIMEOUT`        | No       | `30.0`      | Seconds to wait for governance evaluation                 |
| `OPENBOX_GOVERNANCE_POLICY`         | No       | `fail_open` | Behavior when API unreachable                             |
| `OPENBOX_SEND_START_EVENT`          | No       | `true`      | Send WorkflowStarted events                               |
| `OPENBOX_SEND_ACTIVITY_START_EVENT` | No       | `true`      | Send ActivityStarted events                               |

## Plugin Parameters

Parameters passed to `OpenBoxPlugin()` override environment variables:

See **[Example: Full Configuration](#example-full-configuration)** for a complete example.

## Configuration Options

### openbox_url

OpenBox Core API URL. HTTPS required for non-localhost.

```python
openbox_url="https://core.openbox.ai"
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

| Value         | Behavior                                 |
| ------------- | ---------------------------------------- |
| `fail_open`   | Allow operation to proceed (log warning) |
| `fail_closed` | Block operation                          |

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

### sandbox

`SandboxConfig` enters only through `OpenBoxPlugin`. Its required `registry` is an immutable `GovernedCommandRegistry` that defines the admitted executables, bounded arguments, and typed result schemas. The plugin intercepts the application's Activity at the Worker boundary and owns command derivation, dispatch, heartbeats, result mapping, and cleanup:

```python
from openbox import OpenBoxPlugin
from openbox.sandbox import SandboxConfig

plugin = OpenBoxPlugin(
    openbox_url=os.environ["OPENBOX_URL"],
    openbox_api_key=os.environ["OPENBOX_API_KEY"],
    governance_policy="fail_closed",
    sandbox=SandboxConfig(
        registry=command_registry,
        service_config=service_config_path,
        policy=policy_path,
        ca=ca_path,
        certificate=certificate_path,
        private_key=private_key_path,
        timeout_seconds=300,
        heartbeat_interval_seconds=10.0,
    ),
)
```

| `SandboxConfig` field | Constraint |
|---|---|
| `registry` | Required immutable registry of admitted command profiles |
| `service_config`, `policy` | Optional trusted service and policy documents |
| `socket_path` | Optional Unix-domain agent socket |
| `ca`, `certificate`, `private_key` | Optional direct-mTLS material |
| `timeout_seconds` | Integer from 1 through 300 |
| `heartbeat_interval_seconds` | Number from 0.1 through 60 |
| `stdout_bytes`, `stderr_bytes` | Optional positive output bounds |

For a registered command, `CONSTRAIN` selects sandbox execution and aborts the corresponding host action before its side effect. Policy routing uses `constraints: ["run_in_sandbox"]`; a behavioral `CONSTRAIN` can select a registered replacement profile. Ordinary Temporal operations that cannot enforce `CONSTRAIN` fail closed. Keep all OpenBox setup in the same plugin initializer; there is no separate Worker path for sandboxed commands.

The sandbox runtime defaults to the native `srt` provider. Provision it with `obs provision --provider srt --yes` (or omit `--provider` because `srt` is the default), then load `~/.config/openbox-sandbox/agent.env`. For a guest-kernel boundary, provision the optional [OpenShell Provider (VM)](/developer-guide/temporal-python/openshell-provider) explicitly.

See [Governed Sandbox Commands](/developer-guide/temporal-python/governed-sandbox-commands) for registry construction, native Worker composition, result bounds, and the zero-host deployment requirement.

## Configuration Precedence

1. Function parameters (highest priority)
2. Environment variables
3. Default values (lowest priority)

## Example: Full Configuration

```python
import asyncio
import os
from temporalio.client import Client
from temporalio.worker import Worker
from openbox import OpenBoxPlugin

async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="production-queue",
        workflows=[CustomerWorkflow, OrderWorkflow],
        activities=[
            process_order,
            send_notification,
            update_inventory,
        ],
        plugins=[OpenBoxPlugin(
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
        )],
    )

    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

## Next Steps

1. **[Governed Sandbox Commands](/developer-guide/temporal-python/governed-sandbox-commands)** - Configure constrained command execution
2. **[Error Handling](/developer-guide/temporal-python/error-handling)** - Handle governance decisions in your code
3. **[Approvals](/approvals)** - Review and act on HITL approval requests
