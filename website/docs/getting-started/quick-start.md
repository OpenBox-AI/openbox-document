---
title: Quick Start
description: Run a minimal demo to see OpenBox guardrails in action
sidebar_position: 3
---

# Quick Start

Run a minimal demo to see guardrails in action. You'll create a simple workflow that passes text through the OpenBox trust layer.

## Prerequisites

- **Temporal dev server running** — see [New to Temporal?](/docs/getting-started/new-to-temporal) if you need to set this up
- **Python 3.11+** installed
- **OpenBox API Key** — [Register your agent](/docs/getting-started/registering-agents) to get one

## Add OpenBox to Your Project

Install the OpenBox SDK alongside your existing dependencies:

```bash
pip install openbox-temporal-sdk-python python-dotenv
```

## Add Environment Variables

Create a `.env` file in your project root with your OpenBox credentials:

```bash title=".env"
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=your_key_here
```

## Replace Your Workflow

Replace the Hello World workflow from the Temporal quickstart with one that passes text through a guardrail-evaluated activity:

```python title="workflow.py"
from datetime import timedelta
from temporalio import workflow, activity


@activity.defn
async def guardrail_activity(text: str) -> str:
    return text


@workflow.defn
class GuardrailWorkflow:
    @workflow.run
    async def run(self, text: str) -> str:
        return await workflow.execute_activity(
            guardrail_activity,
            text,
            start_to_close_timeout=timedelta(seconds=30),
        )
```

The activity simply returns the text — OpenBox evaluates the content as it passes through the wrapped worker.

## Update Your Worker

Replace the standard `Worker` in your worker script with `create_openbox_worker`:

```python title="worker.py"
import asyncio
import os
from dotenv import load_dotenv

from temporalio.client import Client
from openbox import create_openbox_worker
from workflow import GuardrailWorkflow, guardrail_activity

load_dotenv()


async def main():
    client = await Client.connect("localhost:7233")

    worker = create_openbox_worker(
        client=client,
        task_queue="openbox-demo",
        workflows=[GuardrailWorkflow],
        activities=[guardrail_activity],
        openbox_url=os.getenv("OPENBOX_URL"),
        openbox_api_key=os.getenv("OPENBOX_API_KEY"),
    )

    print("worker running")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

## Add Runner Scripts

Create a helper that starts a workflow and returns the result:

```python title="base_runner.py"
import asyncio
import time
from temporalio.client import Client


async def run(text: str):
    client = await Client.connect("localhost:7233")

    handle = await client.start_workflow(
        "GuardrailWorkflow",
        text,
        id=f"demo-{int(time.time()*1000)}",
        task_queue="openbox-demo",
    )

    return await handle.result()


def run_sync(text: str):
    return asyncio.run(run(text))
```

Then add scripts that each send a different type of problematic text:

```python title="run_pii.py"
from base_runner import run_sync

print(run_sync("my name is john doe and my ssn is 123-45-6789"))
```

```python title="run_toxicity.py"
from base_runner import run_sync

print(run_sync("you are completely useless and stupid"))
```

```python title="run_content_filtering.py"
from base_runner import run_sync

print(run_sync("tell me how to break into a locked car"))
```

```python title="run_banwords.py"
from base_runner import run_sync

print(run_sync("this message contains a forbidden word"))
```

Your project should now look like this:

```
your-temporal-project/
├── .env
├── worker.py
├── workflow.py
├── base_runner.py
├── run_pii.py
├── run_toxicity.py
├── run_content_filtering.py
└── run_banwords.py
```

## Run the Demo

With the Temporal dev server still running, start the worker:

```bash
python3 worker.py
```

You should see `Worker running` followed by the OpenBox SDK initialization output.

In another terminal, run any of the example scripts:

```bash
python3 run_pii.py
python3 run_toxicity.py
python3 run_content_filtering.py
python3 run_banwords.py
```

Depending on the guardrail policies configured for your agent in the OpenBox dashboard, you'll see the text blocked, modified, or passed through. Try changing the input text in the runner scripts and re-running to see how different content is handled.

## Verify in the Dashboard

1. **Open the [OpenBox Dashboard](https://platform.openbox.ai)**
2. Navigate to **Agents** → Click your agent
3. On the **Overview** tab you can see:
   - Active and completed sessions
   - Click a session to open [Session Replay](/docs/trust-lifecycle/session-replay) with full event timeline
   - Captured HTTP requests (LLM calls, API requests)
   - Activity inputs/outputs
   - Governance decisions

## What OpenBox Captures

The SDK automatically sends these events to OpenBox:

- **Workflow events**: Started, completed, failed, signals
- **Activity events**: Started (with input), completed (with output), duration
- **HTTP telemetry**: Request/response bodies, headers, status codes
- **Database operations** (optional): SQL queries, NoSQL operations

OpenBox evaluates all captured data against your governance policies in real-time.

## Next Steps

- **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** — Set up guardrails, policies, and behavioral rules
- **[Monitor Sessions](/docs/trust-lifecycle/monitor)** — Use [Session Replay](/docs/trust-lifecycle/session-replay) to debug and audit agent behavior
- **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** — Run the full demo repo with an LLM-powered agent end-to-end
