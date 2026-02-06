---
title: Temporal (Python)
description: Build a governed AI agent with Temporal and OpenBox from scratch
sidebar_position: 1
---

# Temporal Integration Guide

Build a complete AI agent with Temporal workflows and OpenBox governance from the ground up. This guide walks you through creating a customer support agent with LLM integration, then adding OpenBox for governance, monitoring, and compliance.

:::tip Already Have a Temporal Agent?
If you already have a working Temporal agent, see the **[Quick Start](/docs/getting-started/quick-start)** for a faster integration path.
:::

---

## Prerequisites

- **Python 3.11+** installed
- **Temporal Server** running locally or access to Temporal Cloud
- **OpenBox Account** - Sign up at [platform.openbox.ai](https://platform.openbox.ai)
- **LLM API Key** - OpenAI, Anthropic, or Google AI

---

## Part 1: Set Up Temporal

### Install Temporal Server (Local Development)

```bash
# macOS
brew install temporal

# Start Temporal server
temporal server start-dev
```

Temporal UI will be available at [http://localhost:8080](http://localhost:8080)

### Create Your Project

```bash
mkdir my-ai-agent
cd my-ai-agent
```

### Install Dependencies

```bash
# Install uv (fast Python package manager)
pip install uv

# Initialize project and install dependencies
uv init
uv add temporalio litellm python-dotenv openbox-temporal-sdk-python
```

---

## Part 2: Build Your Temporal Agent

### Create Workflows

Create `workflows.py`:

```python
from temporalio import workflow
from temporalio.common import RetryPolicy
from datetime import timedelta

@workflow.defn
class CustomerSupportWorkflow:
    """AI agent workflow for customer support"""
    
    def __init__(self):
        self.messages = []
        self.status = "active"
    
    @workflow.run
    async def run(self, customer_query: str) -> dict:
        """Process customer query using AI agent"""
        
        # Call LLM activity to process the query
        result = await workflow.execute_activity(
            "process_customer_query",
            customer_query,
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        
        self.messages.append({
            "role": "user",
            "content": customer_query
        })
        self.messages.append({
            "role": "assistant", 
            "content": result["response"]
        })
        
        return result
    
    @workflow.query
    def get_messages(self) -> list:
        """Query to retrieve conversation history"""
        return self.messages
    
    @workflow.signal
    async def add_message(self, message: str):
        """Signal to add a new message to the conversation"""
        result = await workflow.execute_activity(
            "process_customer_query",
            message,
            start_to_close_timeout=timedelta(seconds=30),
        )
        self.messages.append({"role": "user", "content": message})
        self.messages.append({"role": "assistant", "content": result["response"]})
```

### Create Activities

Create `activities.py`:

```python
import os
from temporalio import activity
from litellm import completion

@activity.defn
async def process_customer_query(query: str) -> dict:
    """Process customer query using LLM"""
    
    model = os.getenv("LLM_MODEL", "openai/gpt-4o")
    api_key = os.getenv("LLM_KEY")
    
    # Call LLM
    response = await completion(
        model=model,
        api_key=api_key,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful customer support agent. Provide clear, concise answers."
            },
            {
                "role": "user",
                "content": query
            }
        ],
        temperature=0.7,
    )
    
    return {
        "response": response.choices[0].message.content,
        "model": model,
        "tokens": response.usage.total_tokens
    }
```

### Configure Environment

Create `.env`:

```bash
# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# LLM Configuration (choose one)
LLM_MODEL=openai/gpt-4o
LLM_KEY=sk-your-openai-key

# Or use Anthropic
# LLM_MODEL=anthropic/claude-3-5-sonnet-20240620
# LLM_KEY=sk-ant-your-anthropic-key

# Or use Google AI
# LLM_MODEL=gemini/gemini-2.0-flash-exp
# LLM_KEY=your-google-api-key

# OpenBox Configuration (add after Part 3)
# OPENBOX_URL=https://api.openbox.ai
# OPENBOX_API_KEY=obx_live_your_api_key_here
```

---

## Part 3: Add OpenBox Governance

### Register Your Agent in OpenBox

1. **Log in** to the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → Click **Add Agent**
3. Configure the agent:
   - **Workflow Engine**: Temporal
   - **Agent Name**: Customer Support Agent
   - **Agent ID**: Auto-generated
   - **Description**: AI agent that handles customer inquiries
   - **Teams**: assign the agent to one or more teams
   - **Icon**: select an icon
4. **API Key Generation**:
   - Click **Generate API Key**
   - Copy and store the key (shown only once)
5. Configure platform settings:
   - **Initial Risk Assessment** (**[AIVSS](/docs/agents/trust-lifecycle/assess)**) - select a risk profile (Tier 1-4)
   - **Attestation** (**[Execution Evidence](/docs/compliance/attestation)**) - select **AWS KMS**
   - **Goal Alignment** (**[drift detection](/docs/agents/trust-lifecycle/verify)**) - set an alignment threshold and drift action
6. Click **Add Agent**

See **[Registering Agents](/docs/agents/registering-agents)** for a field-by-field walkthrough of the form.

Add the API key to your `.env`:

```bash
OPENBOX_URL=https://api.openbox.ai
OPENBOX_API_KEY=obx_live_your_api_key_here
```

### Create Worker with OpenBox

Create `worker.py`:

```python
import os
import asyncio
from temporalio.client import Client
from openbox import create_openbox_worker
from dotenv import load_dotenv

from workflows import CustomerSupportWorkflow
from activities import process_customer_query

async def main():
    # Load environment variables
    load_dotenv()
    
    # Connect to Temporal
    temporal_client = await Client.connect(
        os.getenv("TEMPORAL_ADDRESS", "localhost:7233"),
        namespace=os.getenv("TEMPORAL_NAMESPACE", "default"),
    )
    
    # Create OpenBox-wrapped worker
    worker = create_openbox_worker(
        client=temporal_client,
        task_queue="customer-support-queue",
        workflows=[CustomerSupportWorkflow],
        activities=[process_customer_query],
        
        # OpenBox configuration
        openbox_url=os.getenv("OPENBOX_URL"),
        openbox_api_key=os.getenv("OPENBOX_API_KEY"),
        
        # Governance settings
        governance_timeout=30.0,
        governance_policy="fail_open",  # Continue if governance API fails
    )
    
    print("🚀 Worker started! Listening on task queue: customer-support-queue")
    print("📊 OpenBox trust layer enabled")
    print("🔗 Temporal UI: http://localhost:8080")
    
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Part 4: Run and Test

### Start the Worker

```bash
uv run worker.py
```

You should see:
```
🚀 Worker started! Listening on task queue: customer-support-queue
📊 OpenBox trust layer enabled
🔗 Temporal UI: http://localhost:8080
```

### Trigger a Workflow

Create `trigger.py`:

```python
import asyncio
from temporalio.client import Client
from workflows import CustomerSupportWorkflow

async def main():
    client = await Client.connect("localhost:7233")
    
    # Start workflow
    handle = await client.start_workflow(
        CustomerSupportWorkflow.run,
        "How do I reset my password?",
        id="customer-support-001",
        task_queue="customer-support-queue",
    )
    
    print(f"Started workflow: {handle.id}")
    
    # Wait for result
    result = await handle.result()
    print(f"Response: {result['response']}")
    print(f"Tokens used: {result['tokens']}")

if __name__ == "__main__":
    asyncio.run(main())
```

Run it:

```bash
uv run trigger.py
```

### View in OpenBox Dashboard

1. Open the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → Click **Customer Support Agent**
3. Go to **Monitor** tab
4. Click on your workflow session to see:
   - Complete event timeline
   - LLM request/response capture
   - Activity inputs/outputs
   - Governance decisions

---

## Configuration Options

### Governance Settings

| Option | Default | Description |
|--------|---------|-------------|
| `governance_timeout` | `30.0` | Max seconds to wait for governance evaluation |
| `governance_policy` | `fail_open` | `fail_open` = continue on API error, `fail_closed` = stop on API error |

### Event Filtering

Skip governance for specific workflows or activities:

```python
worker = create_openbox_worker(
    client=temporal_client,
    task_queue="my-task-queue",
    workflows=[CustomerSupportWorkflow, UtilityWorkflow],
    activities=[process_customer_query, internal_activity],
    
    # Skip these from governance
    skip_workflow_types=["UtilityWorkflow"],
    skip_activity_types=["internal_activity"],
    skip_signals=["heartbeat"],
)
```

### Optional Instrumentation

Enable additional telemetry capture:

```python
worker = create_openbox_worker(
    client=temporal_client,
    task_queue="my-task-queue",
    workflows=[CustomerSupportWorkflow],
    activities=[process_customer_query],
    
    # Optional: Capture database operations
    instrument_databases=True,
    db_libraries={"psycopg2", "redis"},  # Or None for all
    
    # Optional: Capture file I/O
    instrument_file_io=True,
)
```

---

## Error Handling

OpenBox governance decisions surface as exceptions:

```python
from openbox.errors import (
    GovernanceStop,
    ApprovalPending,
    ApprovalRejected,
    GuardrailsValidationFailed,
)

@activity.defn
async def sensitive_operation(data: dict) -> str:
    try:
        result = await perform_action(data)
        return result
    except ApprovalPending:
        # Waiting for human approval - will retry
        raise
    except GovernanceStop as e:
        # Policy blocked this operation
        logger.error(f"Blocked: {e.reason}")
        raise
    except GuardrailsValidationFailed as e:
        # Input/output validation failed
        logger.error(f"Validation failed: {e.violations}")
        raise
```

See **[Error Handling Guide](/docs/sdk/error-handling)** for complete details.

---

## Human-in-the-Loop Approvals

When governance requires approval:

1. Activity raises `ApprovalPending`
2. Temporal retries the activity (with backoff)
3. Approval request appears in OpenBox dashboard
4. Human approves/rejects
5. Next retry proceeds or fails

Configure retry behavior in your activity options:

```python
result = await workflow.execute_activity(
    sensitive_operation,
    data,
    start_to_close_timeout=timedelta(minutes=10),
    retry_policy=RetryPolicy(
        initial_interval=timedelta(seconds=10),
        maximum_interval=timedelta(minutes=5),
        maximum_attempts=20,  # Allow time for approval
    ),
)
```

---

## What OpenBox Captures

The SDK automatically captures and sends to OpenBox:

### Workflow Events
- Workflow started/completed/failed
- Signals received
- Queries executed

### Activity Events
- Activity started (with input)
- Activity completed (with output and duration)
- Activity failed (with error)

### HTTP Telemetry
- Request/response bodies (LLM calls, API requests)
- Headers and status codes
- Request duration and timing

### Database Operations (Optional)
- SQL queries (PostgreSQL, MySQL)
- NoSQL operations (MongoDB, Redis)

### File I/O (Optional)
- File read/write operations
- File paths and sizes

---

## Next Steps

1. **[Configure Trust Controls](/docs/agents/trust-lifecycle/authorize)** - Set up guardrails, policies, and behavioral rules
2. **[Monitor Sessions](/docs/agents/trust-lifecycle/monitor)** - Use Session Replay to debug and audit
3. **[Set Up Approvals](/docs/approvals/workflows)** - Add human-in-the-loop for sensitive operations
4. **[SDK Configuration](/docs/sdk/configuration)** - Fine-tune timeouts, fail policies, and filtering

---

## Troubleshooting

### Worker Not Connecting to OpenBox

Check your API key:
```bash
echo $OPENBOX_API_KEY
# Should print: obx_live_...
```

Verify configuration:

1. Confirm `OPENBOX_URL` and `OPENBOX_API_KEY` are set in the worker environment
2. Start the worker and check logs for OpenBox initialization errors
3. Trigger a workflow and confirm a session appears in the OpenBox dashboard

### No Events in Dashboard

1. Ensure worker is running: `uv run worker.py`
2. Trigger a workflow: `uv run trigger.py`
3. Check Temporal UI: [http://localhost:8080](http://localhost:8080)
4. Verify workflow completed successfully

### LLM API Errors

Test your LLM configuration:
```python
from litellm import completion
response = completion(
    model="openai/gpt-4o",
    api_key="your-key",
    messages=[{"role": "user", "content": "test"}]
)
```
