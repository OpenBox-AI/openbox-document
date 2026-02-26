---
title: Wrap an Existing Agent
description: Add the OpenBox trust layer to your existing Temporal agent
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Wrap an Existing Agent

Add the OpenBox trust layer to your existing Temporal agent. This guide assumes you already have a working Temporal agent and walks through wrapping it with OpenBox for governance, monitoring, and compliance.

## Prerequisites

- **Existing Temporal agent** with workflows and activities, and a running Temporal server
- **Python 3.11+** installed
- **OpenBox API Key** — [Register your agent](/docs/dashboard/agents/registering-agents) in the dashboard to get one

## Step 1: Install OpenBox SDK

Add the OpenBox SDK to your existing project:

**Package:** `openbox-temporal-sdk-python`

```bash
uv add openbox-temporal-sdk-python

# Or with pip
pip install openbox-temporal-sdk-python
```

## Step 2: Configure Environment Variables

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

:::warning
In production, inject `OPENBOX_API_KEY` via your platform's secret management rather than `.env` files.
:::

## Step 3: Wrap Your Existing Worker

Replace `Worker` with `create_openbox_worker`:

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

## Step 4: Run Your Worker

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

Having issues? See the **[Troubleshooting Guide](/docs/getting-started/troubleshooting)**.

## Step 5: See It in Action

Trigger a workflow the way you normally would. Once it completes:

1. Open the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → click your agent
3. On the **Overview** tab, find the session that just ran
4. Click **Details** to open the session

The **Event Log Timeline** shows the full execution trace. You should see:

- Workflow events
- Activity events
- HTTP requests
- Governance decisions

For a full step-by-step playback, click **Watch Replay** to open **[Session Replay](/docs/trust-lifecycle/session-replay)**.

If your session doesn't appear, check that your worker is running and connected to OpenBox. See the **[Troubleshooting Guide](/docs/getting-started/troubleshooting)** for common issues.

## What Just Happened?

Under the hood, the OpenBox SDK:

- **Intercepted workflow events** (started, completed, failed, signals) and **activity events** (started, completed) with their inputs and outputs, sending each to OpenBox for governance evaluation
- **Captured HTTP calls automatically** — any requests your agent made (LLM APIs, external services) were recorded via OpenTelemetry instrumentation, including full request and response details
- **Evaluated your governance policies** against each event, determining whether the action should be allowed, blocked, or flagged for approval
- **Recorded a governance decision** for every event — that's what you see in the Event Log Timeline and Session Replay

This runs on every workflow execution automatically.

## Next Steps

- **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** — Set up guardrails, policies, and behavioral rules
- **[Monitor Sessions](/docs/trust-lifecycle/monitor)** — Use [Session Replay](/docs/trust-lifecycle/session-replay) to debug and audit agent behavior
- **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** — Deep dive into configuration options, HITL approvals, and advanced scenarios
