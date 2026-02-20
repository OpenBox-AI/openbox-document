---
title: Quick Start
description: Add the OpenBox trust layer to your existing Temporal agent in 5 minutes
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quick Start

Add the OpenBox trust layer to your existing Temporal agent. This guide assumes you already have a working Temporal agent and walks through wrapping it with OpenBox for governance, monitoring, and compliance.

:::tip Building from Scratch?
If you don't have a Temporal agent yet, see **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** for a complete end-to-end setup.
:::

## Prerequisites

- **Existing Temporal agent** with workflows and activities, and a running Temporal server
- **Python 3.11+** installed
- **OpenBox Account** — Sign up at [platform.openbox.ai](https://platform.openbox.ai)

## Step 1: Register Your Agent in OpenBox

Before wrapping your worker, create an agent in the OpenBox platform:

1. **Log in** to the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → Click **Add Agent**
3. Configure the agent:
   - **Workflow Engine**: Temporal
   - **Agent Name**: Your agent name (e.g., "Customer Support Agent")
   - **Agent ID**: Auto-generated
   - **Description**: What your agent does (optional)
   - **Teams**: assign the agent to one or more teams (optional)
   - **Icon**: select an icon (optional)
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

## Step 2: Install OpenBox SDK

Add the OpenBox SDK to your existing project:

**Package:** `openbox-temporal-sdk-python`

```bash
uv add openbox-temporal-sdk-python

# Or with pip
pip install openbox-temporal-sdk-python
```

## Step 3: Configure Environment Variables

Add OpenBox credentials to your environment:

```bash
export OPENBOX_URL=https://core.openbox.ai
export OPENBOX_API_KEY=obx_live_your_api_key_here
```

<details>
<summary>Using an .env file?</summary>

```bash title=".env"
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=obx_live_your_api_key_here
```

Install `python-dotenv` and load it in your worker script:

```bash
uv add python-dotenv
```

```python
from dotenv import load_dotenv
load_dotenv()
```

</details>

## Step 4: Wrap Your Existing Worker

Replace the standard Temporal `Worker` with OpenBox's `create_openbox_worker`. Your existing workflows and activities stay exactly as they are:

<Tabs>
<TabItem value="before" label="Temporal">

```python title="worker.py"
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from your_workflows import YourWorkflow
from your_activities import your_activity

async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="agent-task-queue",
        workflows=[YourWorkflow],
        activities=[your_activity],
    )

    await worker.run()

asyncio.run(main())
```

</TabItem>
<TabItem value="after" label="OpenBox" default>

```python title="worker.py"
import os
import asyncio
from temporalio.client import Client
from openbox import create_openbox_worker  # Changed import
from your_workflows import YourWorkflow
from your_activities import your_activity

async def main():
    client = await Client.connect("localhost:7233")

    # Replace Worker with create_openbox_worker
    worker = create_openbox_worker(
        client=client,
        task_queue="agent-task-queue",
        workflows=[YourWorkflow],
        activities=[your_activity],

        # Add OpenBox configuration
        openbox_url=os.getenv("OPENBOX_URL"),
        openbox_api_key=os.getenv("OPENBOX_API_KEY"),
    )

    await worker.run()

asyncio.run(main())
```

</TabItem>
</Tabs>

## Step 5: Run Your Worker

Start your worker as you normally would, for example:

```bash
uv run worker.py
```

You should see the OpenBox SDK initialize and connect. Your output will vary depending on your agent's configuration:

```
Worker will use LLM model: openai/gpt-4o
Address: localhost:7233, Namespace default
...
...
...
OpenBox SDK initialized successfully
  - Governance policy: fail_open
Starting worker, connecting to task queue: agent-task-queue
```

<details>
<summary>Full initialization output</summary>

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
INFO:openbox.otel_setup:Instrumented: psycopg2
INFO:openbox.otel_setup:Instrumented: asyncpg
INFO:openbox.otel_setup:Instrumented: mysql
INFO:openbox.otel_setup:Instrumented: pymysql
INFO:openbox.otel_setup:Instrumented: pymongo
INFO:openbox.otel_setup:Instrumented: redis
INFO:openbox.otel_setup:Instrumented: sqlalchemy
INFO:openbox.otel_setup:Database instrumentation complete. Instrumented: ['psycopg2', 'asyncpg', 'mysql', 'pymysql', 'pymongo', 'redis', 'sqlalchemy']
INFO:openbox.otel_setup:Instrumented: file I/O (builtins.open)
INFO:openbox.otel_setup:OpenTelemetry governance setup complete. Instrumented: ['requests', 'httpx', 'urllib3', 'urllib', 'psycopg2', 'asyncpg', 'mysql', 'pymysql', 'pymongo', 'redis', 'sqlalchemy', 'file_io']
OpenBox SDK initialized successfully
  - Governance policy: fail_open
  - Governance timeout: 30.0s
  - Events: WorkflowStarted, WorkflowCompleted, WorkflowFailed, SignalReceived, ActivityStarted, ActivityCompleted
  - Database instrumentation: enabled
  - File I/O instrumentation: enabled
  - Approval polling: enabled
Starting worker, connecting to task queue: agent-task-queue
```

</details>

Your agent is now running with the OpenBox trust layer enabled. Having issues? See the **[Troubleshooting Guide](/docs/getting-started/troubleshooting)**.

## Step 6: See It in Action

Trigger your agent the same way you normally do — whether that's a client script, an API call, or a scheduled workflow. No changes are needed to your trigger code.

Once the workflow completes:

1. Open the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → click your agent
3. On the **Overview** tab, find the session that just ran
4. Click **Details** to open the session

The **Event Log Timeline** shows the full execution trace — you should see workflow events, activity events, HTTP requests, and governance decisions for the session. For a full step-by-step playback, click **Watch Replay** to open **[Session Replay](/docs/trust-lifecycle/session-replay)**.

If your session doesn't appear, check that your worker is running and connected to OpenBox. See the **[Troubleshooting Guide](/docs/getting-started/troubleshooting)** for common issues.

## What Just Happened?

Here's how that data got there. Under the hood, the OpenBox SDK:

- **Intercepted workflow events** (started, completed, failed, signals) and **activity events** (started, completed) with their inputs and outputs, sending each to OpenBox for governance evaluation
- **Captured HTTP calls automatically** — any requests your agent made (LLM APIs, external services) were recorded via OpenTelemetry instrumentation, including full request and response details
- **Evaluated your governance policies** against each event, determining whether the action should be allowed, blocked, or flagged for approval
- **Recorded a governance decision** for every event — that's what you see in the Event Log Timeline and Session Replay

This happens on every workflow execution with no changes to your agent code.

## Next Steps

Now that your agent is running with OpenBox:

1. **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** - Set up guardrails, policies, and behavioral rules
2. **[Monitor Sessions](/docs/trust-lifecycle/monitor)** - Use [Session Replay](/docs/trust-lifecycle/session-replay) to debug and audit agent behavior
3. **[Set Up Approvals](/docs/approvals)** - Add human-in-the-loop for sensitive operations
4. **[Advanced Configuration](/docs/developer-guide/configuration)** - Fine-tune timeouts, fail policies, and event filtering

## Need More Details?

- **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** - Complete end-to-end setup from scratch
- **[SDK Reference](/docs/developer-guide/sdk-reference)** - Full SDK documentation and configuration options
- **[Approvals](/docs/approvals)** - Review and act on HITL approvals in the dashboard
