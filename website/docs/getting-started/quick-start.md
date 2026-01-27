---
title: Quick Start
description: Add OpenBox governance to your existing Temporal agent in 5 minutes
sidebar_position: 1
---

# Quick Start

Add governance to your existing Temporal agent with OpenBox. This guide assumes you already have a working Temporal agent and shows you how to wrap it with OpenBox for governance, monitoring, and compliance.

:::tip Building from Scratch?
If you don't have a Temporal agent yet, see **[Temporal Integration Guide](/docs/getting-started/workflow-engines/temporal)** for a complete end-to-end setup.
:::

---

## Prerequisites

- **Existing Temporal agent** with workflows and activities
- **Python 3.10+** installed
- **OpenBox Account** - Sign up at [app.openbox.ai](https://app.openbox.ai)

---

## Step 1: Register Your Agent in OpenBox

Before wrapping your worker, create an agent in the OpenBox platform:

1. **Log in** to the [OpenBox Dashboard](https://app.openbox.ai)
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
   - **Initial Risk Assessment** (**[AIVSS](/docs/agents/trust-lifecycle/assess)**) - select a risk profile (Level 1-4)
   - **Attestation** (**[Execution Evidence](/docs/compliance/attestation)**) - select **AWS KMS**
   - **Goal Alignment** (**[drift detection](/docs/agents/trust-lifecycle/verify)**) - set an alignment threshold and drift action
6. Click **Add Agent**

See **[Registering Agents](/docs/agents/registering-agents)** for a field-by-field walkthrough of the form.

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

Add OpenBox credentials to your environment:

```bash
# .env or export these
OPENBOX_URL=https://api.openbox.ai
OPENBOX_API_KEY=obx_live_your_api_key_here
```

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

Start your worker as usual:

```bash
python worker.py
```

Your agent now runs with OpenBox governance enabled.

---

## Step 6: Verify in OpenBox Dashboard

Trigger a workflow and view it in the dashboard:

1. **Run a workflow** (using your existing trigger/client code)
2. **Open the [OpenBox Dashboard](https://app.openbox.ai)**
3. Navigate to **Agents** → Click your agent
4. Go to **Monitor** tab to see:
   - Active and completed sessions
   - Session replay with full event timeline
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

All captured data is evaluated against your governance policies in real-time.

---

## Next Steps

Now that your agent is running with OpenBox:

1. **[Configure Governance](/docs/agents/trust-lifecycle/authorize)** - Set up guardrails, policies, and behavioral rules
2. **[Monitor Sessions](/docs/agents/trust-lifecycle/monitor)** - Use Session Replay to debug and audit agent behavior
3. **[Set Up Approvals](/docs/approvals/workflows)** - Add human-in-the-loop for sensitive operations
4. **[Advanced Configuration](/docs/sdk/configuration)** - Fine-tune timeouts, fail policies, and event filtering

---

## Need More Details?

- **[Temporal Integration Guide](/docs/getting-started/workflow-engines/temporal)** - Complete end-to-end setup from scratch
- **[SDK Reference](/docs/sdk)** - Full SDK documentation and configuration options
- **[Error Handling](/docs/sdk/error-handling)** - Handle governance decisions in your code
