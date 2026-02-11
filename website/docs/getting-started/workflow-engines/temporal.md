---
title: Temporal (Python)
description: Integrate OpenBox with a Temporal AI agent using the OpenBox demo repo
sidebar_position: 1
---

# Temporal Integration Guide

Use the OpenBox Temporal demo repo to understand how OpenBox governance and observability wraps a real Temporal AI agent worker. You’ll run the demo locally, then walk through the exact integration point where `create_openbox_worker` is configured.

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

## Part 1: Clone and Set Up the Demo

This guide uses the public demo repo:

```bash
git clone https://github.com/OpenBox-AI/poc-temporal-agent
cd poc-temporal-agent
```

### Install Temporal Server (Local Development)

```bash
# macOS
brew install temporal

# Start Temporal server
temporal server start-dev
```

### Install Dependencies

From the repo root:

```bash
make setup
```

---

## Part 2: Configure Environment

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `LLM_MODEL`
- `LLM_KEY`
- `TEMPORAL_ADDRESS` (defaults to `localhost:7233`)

### Enable OpenBox (recommended)

Add your OpenBox Core URL and API key:

```bash
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=your-openbox-api-key
OPENBOX_GOVERNANCE_ENABLED=true
OPENBOX_GOVERNANCE_TIMEOUT=30.0
OPENBOX_GOVERNANCE_MAX_RETRIES=1
OPENBOX_GOVERNANCE_POLICY=fail_closed
```

---

## Part 3: Register Your Agent in OpenBox

1. **Log in** to the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → Click **Add Agent**
3. Configure the agent:
   - **Workflow Engine**: Temporal
   - **Agent Name**: Temporal AI Agent
   - **Agent ID**: Auto-generated
   - **Description**: Temporal AI agent demo
   - **Teams**: assign the agent to one or more teams
   - **Icon**: select an icon
4. **API Key Generation**:
   - Click **Generate API Key**
   - Copy and store the key (shown only once)
5. Configure platform settings:
   - **Initial Risk Assessment** (**[AIVSS](/docs/agents/trust-lifecycle/assess)**) - select a risk profile (Tier 1-4)
   - **Attestation** (**[Execution Evidence](/docs/compliance/attestation)**) - select **AWS KMS**
6. Click **Add Agent**

See **[Registering Agents](/docs/agents/registering-agents)** for a field-by-field walkthrough of the form.

Add the API key to your `.env`:

```bash
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=your-openbox-api-key
```

## Part 4: Run the Demo

In separate terminals:

```bash
make run-worker
make run-api
make run-frontend
```

Or run everything at once:

```bash
make run-dev
```

Open the UI:

- [http://localhost:5173](http://localhost:5173)

---

## How It Works (Where to Look in the Repo)

The OpenBox integration point is the worker bootstrap script:

- `scripts/run_worker.py`

That script wraps a standard Temporal worker with OpenBox:

```python
from openbox import create_openbox_worker

worker = create_openbox_worker(
    client=client,
    task_queue=TEMPORAL_TASK_QUEUE,
    workflows=[AgentGoalWorkflow],
    activities=[...],

    openbox_url=os.getenv("OPENBOX_URL"),
    openbox_api_key=os.getenv("OPENBOX_API_KEY"),
    governance_timeout=float(os.getenv("OPENBOX_GOVERNANCE_TIMEOUT", "30.0")),
    governance_policy=os.getenv("OPENBOX_GOVERNANCE_POLICY", "fail_open"),

    instrument_databases=True,
    instrument_file_io=True,
)
```

The agent’s Temporal code is organized in:

- `workflows/`
- `activities/`
- `tools/`
- `goals/`

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
| `governance_policy` | `fail_closed` | `fail_open` = continue on API error, `fail_closed` = stop on API error |

### Event Filtering

Skip governance for specific workflows or activities:

```python
worker = create_openbox_worker(
    client=temporal_client,
    task_queue="my-task-queue",
    workflows=[AgentGoalWorkflow, UtilityWorkflow],
    activities=[...],
    
    # Skip these from governance
    skip_workflow_types={"UtilityWorkflow"},
    skip_activity_types={"internal_activity"},
    skip_signals={"heartbeat"},
)
```

### Optional Instrumentation

Enable additional telemetry capture:

```python
worker = create_openbox_worker(
    client=temporal_client,
    task_queue="my-task-queue",
    workflows=[AgentGoalWorkflow],
    activities=[...],
    
    # Optional: Capture database operations
    instrument_databases=True,
    db_libraries={"psycopg2", "redis"},  # Or None for all
    
    # Optional: Capture file I/O
    instrument_file_io=True,
)
```

---

## Error Handling

In this demo, the SDK’s role is to connect your Temporal worker to OpenBox and emit the events OpenBox needs to evaluate policies and record sessions. The recommended way to understand and respond to blocks, approvals, and validation failures is through the OpenBox dashboard UI.

To investigate failures:

1. Open the [OpenBox Dashboard](https://platform.openbox.ai)
2. Go to your agent → **Monitor**
3. Open the session to review:
   - Governance decisions
   - Inputs/outputs for activities and tool calls
   - Approval requests and outcomes

Use the session view in OpenBox to investigate end-to-end execution.

---

## Human-in-the-Loop Approvals

When governance requires approval:

1. OpenBox creates an approval request
2. Approval request appears in the OpenBox dashboard
3. Human approves/rejects
4. Temporal proceeds or fails based on the decision

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
# Should print your OpenBox API key
```

Verify configuration:

1. Confirm `OPENBOX_URL` and `OPENBOX_API_KEY` are set in the worker environment
2. Start the worker and check logs for OpenBox initialization errors
3. Trigger a workflow and confirm a session appears in the OpenBox dashboard

### No Events in Dashboard

1. Ensure worker is running: `make run-worker`
2. Ensure API and UI are running: `make run-api` and `make run-frontend`
3. Verify the workflow completed successfully

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
