---
title: Run the Demo
description: Clone the demo agent, configure your keys, and see OpenBox governance in action
sidebar_position: 2
---

# Run the Demo

Clone the OpenBox demo agent, plug in your keys, and see governance capture and evaluate every workflow event, activity, and LLM call.

## Prerequisites

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

- **[Python 3.11+](https://www.python.org/downloads/)**
- **[uv](https://docs.astral.sh/uv/)** — Python package manager
- **[Node.js](https://nodejs.org/)** — Required for the demo frontend
- **OpenBox Account** — Sign up at [platform.openbox.ai](https://platform.openbox.ai)
- **LLM API Key** — From any [LiteLLM-supported provider](https://docs.litellm.ai/docs/providers). The demo uses the format `provider/model-name` (e.g. `openai/gpt-4o`, `anthropic/claude-sonnet-4-5-20250929`, `gemini/gemini-2.0-flash`)

You'll also need **`make`** and the **Temporal CLI**. Install both for your platform:

<Tabs>
<TabItem value="mac" label="macOS" default>

```bash
xcode-select --install   # provides make
brew install temporal
```

Or to manually install Temporal, download for your architecture:

- [Intel Macs](https://temporal.download/cli/archive/latest?platform=darwin&arch=amd64)
- [Apple Silicon Macs](https://temporal.download/cli/archive/latest?platform=darwin&arch=arm64)

Extract the archive and add the `temporal` binary to your `PATH`.

</TabItem>
<TabItem value="linux" label="Linux">

```bash
# Debian/Ubuntu
sudo apt install make

# Fedora/RHEL
sudo dnf install make
```

Download the Temporal CLI for your architecture:

- [Linux amd64](https://temporal.download/cli/archive/latest?platform=linux&arch=amd64)
- [Linux arm64](https://temporal.download/cli/archive/latest?platform=linux&arch=arm64)

Extract the archive and add the `temporal` binary to your `PATH`.

</TabItem>
<TabItem value="windows" label="Windows">

```bash
winget install GnuWin32.Make
# or
choco install make

winget install Temporal.TemporalCLI
```

Or download the Temporal CLI for your architecture:

- [Windows amd64](https://temporal.download/cli/archive/latest?platform=windows&arch=amd64)
- [Windows arm64](https://temporal.download/cli/archive/latest?platform=windows&arch=arm64)

Extract the archive and add `temporal.exe` to your `PATH`.

</TabItem>
</Tabs>

## Clone and Configure

```bash
git clone https://github.com/OpenBox-AI/poc-temporal-agent
cd poc-temporal-agent
```

Install dependencies:

```bash
make setup
```

To get your `OPENBOX_API_KEY`, [register an agent](/docs/dashboard/agents/registering-agents) in the dashboard: **Agents** → **Add Agent**, set the workflow engine to **Temporal**, and generate an API key.

Copy `.env.example` to `.env` and set your values:

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

## Run the Demo

Start each process in a separate terminal:

```bash
# Terminal 1 — Temporal dev server
temporal server start-dev

# Terminal 2 — OpenBox worker
make run-worker

# Terminal 3 — API server
make run-api

# Terminal 4 — Frontend
make run-frontend
```

You should see `OpenBox SDK initialized successfully` in the worker output.

## Chat with the Agent

Open [http://localhost:5173](http://localhost:5173) — this is the demo frontend. The default scenario is a travel booking assistant.

Send a message (e.g., "I want to book a trip to Australia") and let the agent run through the full workflow. This generates the workflow events, activity executions, and LLM calls that OpenBox captures and governs.

## What Just Happened?

When you ran the demo, the OpenBox SDK:

- **Intercepted workflow and activity events** — every workflow start, activity execution, and signal was captured and sent to OpenBox for governance evaluation
- **Captured HTTP calls automatically** — OpenTelemetry instrumentation recorded all outbound HTTP requests (LLM calls, external APIs) with full request/response bodies
- **Evaluated governance policies** — each event was checked against your agent's configured policies in real-time
- **Recorded a governance decision for every event** — approved, blocked, or flagged — giving you a complete audit trail

## See It in the Dashboard

Open the **[OpenBox Dashboard](https://platform.openbox.ai)**:

1. Navigate to **Agents** → Click your agent
2. On the **Overview** tab, find the session that corresponds to your workflow run
3. Click **Details** to open the **Event Log Timeline**
4. Scroll through the timeline — you'll see every event the trust layer captured:
   - Workflow start/complete events
   - Each activity with its inputs and outputs
   - HTTP requests to your LLM provider
   - The governance decision OpenBox made for each event
5. Click **Watch Replay** to open [Session Replay](/docs/trust-lifecycle/session-replay) — this plays back the entire session step-by-step

## Next Steps

- **[How the Integration Works](/docs/developer-guide/temporal-integration-guide-python#how-the-integration-works)** — Understand the single code change that connects your agent to OpenBox
- **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** — Set up guardrails, policies, and behavioral rules for LLM interactions
