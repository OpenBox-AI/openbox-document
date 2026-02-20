---
title: Quick Start
description: Add the OpenBox trust layer to your existing Temporal agent in 5 minutes
sidebar_position: 1
---

# Quick Start

Add a trust layer to your existing Temporal agent with OpenBox. This guide assumes you already have a working Temporal agent and shows you how to wrap it with OpenBox for trust, monitoring, and compliance.

:::tip Building from Scratch?
If you don't have a Temporal agent yet, see **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** for a complete end-to-end setup.
:::

---

## Prerequisites

- **Existing Temporal agent** with workflows and activities
- **Python 3.11+** installed
- **OpenBox Account** - Sign up at [platform.openbox.ai](https://platform.openbox.ai)

---

## Step 1: Register Your Agent in OpenBox

Before wrapping your worker, create an agent in the OpenBox platform:

1. **Log in** to the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → Click **Add Agent**
3. Configure the agent:
   - **Workflow Engine**: Temporal
   - **Agent Name**: Your agent name (e.g., "Customer Support Agent")
   - **Agent ID**: Auto-generated
   - **Description**: What your agent does
   - **Teams**: assign the agent to one or more teams
   - **Icon**: select an icon
4. **API Key Generation**:
   - Click **Generate API Key**
   - Copy and store the key (shown only once)
5. Configure platform settings:
   - **Initial Risk Assessment** (**[Risk Profile](/docs/trust-lifecycle/assess)**) - select a risk profile (Tier 1-4)
   - **Attestation** (**[Execution Evidence](/docs/administration/attestation-and-cryptographic-proof)**) - select **AWS KMS**
6. Click **Add Agent**

See **[Registering Agents](/docs/getting-started/registering-agents)** for a field-by-field walkthrough of the form.

:::tip
Your API key format: `obx_live_xxxxxxxxxxxxxxxxxx`
:::

---

## Step 2: Install OpenBox SDK

Add the OpenBox SDK to your existing project:

```bash
pip install openbox-temporal-sdk-python

# Or with uv
uv add openbox-temporal-sdk-python
```

---

## Step 3: Configure Environment Variables

Add OpenBox credentials to your environment. You can either export them directly or use a `.env` file:

```bash
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=obx_live_your_api_key_here
```

:::tip Using a .env file?
1. Install `python-dotenv`:
   ```bash
   pip install python-dotenv
   ```
2. Add this to the top of your worker script:
   ```python
   from dotenv import load_dotenv
   load_dotenv()
   ```
:::

---

## Step 4: Wrap Your Existing Worker

Replace your standard Temporal `Worker` with OpenBox's `create_openbox_worker`:

**Before (Standard Temporal):**

```python
from temporalio.client import Client
from temporalio.worker import Worker

async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="my-task-queue",
        workflows=[MyWorkflow],
        activities=[my_activity],
    )

    await worker.run()
```

**After (With OpenBox):**

```python
import os
from temporalio.client import Client
from openbox import create_openbox_worker  # Changed import

async def main():
    client = await Client.connect("localhost:7233")

    # Replace Worker with create_openbox_worker
    worker = create_openbox_worker(
        client=client,
        task_queue="my-task-queue",
        workflows=[MyWorkflow],
        activities=[my_activity],

        # Add OpenBox configuration
        openbox_url=os.getenv("OPENBOX_URL"),
        openbox_api_key=os.getenv("OPENBOX_API_KEY"),
    )

    await worker.run()
```

That's it! Your workflows and activities remain **completely unchanged**.

---

## Step 5: Run Your Worker

:::warning Temporal Must Be Running
Make sure the Temporal server is running before starting your worker:

```bash
temporal server start-dev
```

:::


Start your worker as usual:

```bash
uv run worker.py
```

:::tip
If you are not using `uv`, you can also run with:
- **macOS / Linux**: `python3 worker.py`
- **Windows**: `python worker.py`
:::


Expected Output
```
Worker will use LLM model: openai/gpt-4o
Address: localhost:7233, Namespace default
(If unset, then will try to connect to local server)
Initializing ToolActivities with LLM model: openai/gpt-4o
MCP client manager enabled for connection pooling
ToolActivities initialized with LLM model: openai/gpt-4o
Worker ready to process tasks!
Initializing OpenBox SDK with URL: https://core.openbox.ai/
INFO:openbox.config:OpenBox API key validated successfully
INFO:openbox.config:OpenBox SDK initialized with API URL: https://core.openbox.ai/
INFO:openbox.otel_setup:Ignoring URLs with prefixes: {'https://core.openbox.ai/'}
INFO:openbox.otel_setup:Registered WorkflowSpanProcessor with OTel TracerProvider
INFO:openbox.otel_setup:Instrumented: requests
INFO:openbox.otel_setup:Instrumented: httpx
INFO:openbox.otel_setup:Instrumented: urllib3
INFO:openbox.otel_setup:Instrumented: urllib
INFO:openbox.otel_setup:Patched httpx for body capture
INFO:openbox.otel_setup:OpenTelemetry HTTP instrumentation complete. Instrumented: ['requests', 'httpx', 'urllib3', 'urllib']
INFO:openbox.otel_setup:Instrumented: psycopg2                                  INFO:openbox.otel_setup:Instrumented: asyncpg
INFO:openbox.otel_setup:Instrumented: mysql                                     INFO:openbox.otel_setup:Instrumented: pymysql                                   INFO:openbox.otel_setup:Instrumented: pymongo                                   INFO:openbox.otel_setup:Instrumented: redis
INFO:openbox.otel_setup:Instrumented: sqlalchemy
INFO:openbox.otel_setup:Database instrumentation complete. Instrumented: ['psycopg2', 'asyncpg', 'mysql', 'pymysql', 'pymongo', 'redis', 'sqlalchemy']
INFO:openbox.otel_setup:Instrumented: file I/O (builtins.open)                  INFO:openbox.otel_setup:OpenTelemetry governance setup complete. Instrumented: ['requests', 'httpx', 'urllib3', 'urllib', 'psycopg2', 'asyncpg', 'mysql', 'pymysql', 'pymongo', 'redis', 'sqlalchemy', 'file_io']
OpenBox SDK initialized successfully                                              - Governance policy: fail_open
  - Governance timeout: 30.0s                                                     - Events: WorkflowStarted, WorkflowCompleted, WorkflowFailed, SignalReceived, ActivityStarted, ActivityCompleted                                                - Database instrumentation: enabled
  - File I/O instrumentation: enabled
  - Approval polling: enabled                                                   Starting worker, connecting to task queue: agent-task-queue

```
Your agent now runs with the OpenBox trust layer enabled.

:::tip Having issues?
See the **[Troubleshooting Guide](/docs/getting-started/troubleshooting)** for common setup problems and solutions.
:::

---

## Step 6: Verify in OpenBox Dashboard

Trigger a workflow and view it in the dashboard:

1. **Run a workflow** (using your existing trigger/client code)
2. **Open the [OpenBox Dashboard](https://platform.openbox.ai)**
3. Navigate to **Agents** → Click your agent
4. On the **Overview** tab you can see:
   - Active and completed sessions
   - Click a session to open [Session Replay](/docs/trust-lifecycle/session-replay) with full event timeline
   - Captured HTTP requests (LLM calls, API requests)
   - Activity inputs/outputs
   - Governance decisions

---

## What OpenBox Captures

The SDK automatically sends these events to OpenBox:

- **Workflow events**: Started, completed, failed, signals
- **Activity events**: Started (with input), completed (with output), duration
- **HTTP telemetry**: Request/response bodies, headers, status codes
- **Database operations** (optional): SQL queries, NoSQL operations

OpenBox evaluates all captured data against your governance policies in real-time.

---

## Next Steps

Now that your agent is running with OpenBox:

1. **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** - Set up guardrails, policies, and behavioral rules
2. **[Monitor Sessions](/docs/trust-lifecycle/monitor)** - Use [Session Replay](/docs/trust-lifecycle/session-replay) to debug and audit agent behavior
3. **[Set Up Approvals](/docs/approvals)** - Add human-in-the-loop for sensitive operations
4. **[Advanced Configuration](/docs/developer-guide/configuration)** - Fine-tune timeouts, fail policies, and event filtering

---

## Need More Details?

- **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** - Complete end-to-end setup from scratch
- **[SDK Reference](/docs/developer-guide/sdk-reference)** - Full SDK documentation and configuration options
- **[Approvals](/docs/approvals)** - Review and act on HITL approvals in the dashboard
