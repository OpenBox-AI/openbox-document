---
title: Run the Demo
description: Clone the demo agent, configure your keys, and see OpenBox governance in action
sidebar_position: 2
---

# Run the Demo

Clone the OpenBox demo agent, plug in your keys, and see governance capture and evaluate every workflow event, activity, and LLM call — in under 10 minutes.

## Register Your Agent

Before running the demo, you need an agent registered in OpenBox:

1. **Log in** to the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → Click **Add Agent**
3. Set **Workflow Engine** to **Temporal** and give it a name (e.g., "Temporal AI Agent")
4. Click **Generate API Key** — copy and store it securely (shown only once)
5. Configure **Initial Risk Assessment** and **Attestation** (defaults are fine to start)
6. Click **Add Agent**

See **[Registering Agents](/docs/dashboard/agents/registering-agents)** for a field-by-field walkthrough.

## Install Prerequisites

Make sure you have all the required tools installed before continuing. The **[Prerequisites](/docs/getting-started#prerequisites)** section lists everything you need — Python 3.11+, Node.js, `make`, the Temporal CLI, and `uv`.

## Clone and Configure

```bash
git clone https://github.com/OpenBox-AI/poc-temporal-agent
cd poc-temporal-agent
```

Install dependencies:

```bash
make setup
```

Copy `.env.example` to a new file called `.env` and set your values:

```bash title=".env"
# LLM — use the format provider/model-name
LLM_MODEL=openai/gpt-4o
LLM_KEY=your-llm-api-key

# Temporal
TEMPORAL_ADDRESS=localhost:7233

# OpenBox
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=your-openbox-api-key
```

:::tip LLM Provider
The demo uses [LiteLLM](https://docs.litellm.ai/docs/providers) for model routing. Set `LLM_MODEL` using the format `provider/model-name`:
- `openai/gpt-4o`
- `anthropic/claude-sonnet-4-5-20250929`
- `gemini/gemini-2.0-flash`
:::

## Run

Start each process in a separate terminal:

**Terminal 1** — Temporal dev server:

```bash
temporal server start-dev
```

**Terminal 2** — OpenBox worker:

```bash
make run-worker
```

You should see `OpenBox SDK initialized successfully` in the output.

**Terminal 3** — API server:

```bash
make run-api
```

**Terminal 4** — Frontend:

```bash
make run-frontend
```

## Chat with the Agent

Open [http://localhost:5173](http://localhost:5173) — this is the demo frontend. The default scenario is a travel booking assistant.

Send a message (e.g., "I want to book a trip to Australia") and let the agent run through the full workflow. This generates the workflow events, activity executions, and LLM calls that OpenBox captures and governs.

## See It in Action

Once the workflow completes, open the **[OpenBox Dashboard](https://platform.openbox.ai)**:

1. Navigate to **Agents** → Click your agent
2. On the **Overview** tab, find the session that corresponds to your workflow run
3. Click **Details** to open the **Event Log Timeline**
4. Scroll through the timeline — you'll see every event the trust layer captured:
   - Workflow start/complete events
   - Each activity with its inputs and outputs
   - HTTP requests to your LLM provider
   - The governance decision OpenBox made for each event
5. Click **Watch Replay** to open [Session Replay](/docs/trust-lifecycle/session-replay) — this plays back the entire session step-by-step

## What Just Happened?

When you ran the demo, the OpenBox SDK:

- **Intercepted workflow and activity events** — every workflow start, activity execution, and signal was captured and sent to OpenBox for governance evaluation
- **Captured HTTP calls automatically** — OpenTelemetry instrumentation recorded all outbound HTTP requests (LLM calls, external APIs) with full request/response bodies
- **Evaluated governance policies** — each event was checked against your agent's configured policies in real-time
- **Recorded a governance decision for every event** — approved, blocked, or flagged — giving you a complete audit trail

All of this happened through the single integration point: `create_openbox_worker` wrapping the Temporal worker. The agent code itself was unchanged.

## Next Steps

- **[How the Integration Works](/docs/developer-guide/temporal-integration-guide-python#how-the-integration-works)** — Understand the single code change that connects your agent to OpenBox
- **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** — Set up guardrails, policies, and behavioral rules for LLM interactions
- **[Monitor Sessions](/docs/trust-lifecycle/monitor)** — Use [Session Replay](/docs/trust-lifecycle/session-replay) to debug and audit agent behavior
