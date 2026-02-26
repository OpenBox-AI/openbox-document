---
title: Getting Started
description: Get OpenBox running with your AI agents
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Getting Started

OpenBox integrates with your existing workflow engine by wrapping the worker process. All trust configuration happens in the OpenBox dashboard — your agent code stays unchanged.

## Why OpenBox Uses Temporal

[Temporal](https://temporal.io/) is a workflow engine that provides durable execution — retries, timeouts, and failure recovery — making it well-suited for orchestrating AI agents. OpenBox hooks into Temporal's execution model to provide governance and observability:

| Temporal Concept | What OpenBox Does |
|---|---|
| **Workflows** | Intercepts start, complete, and fail events to track agent sessions and evaluate governance policies |
| **Activities** | Captures inputs, outputs, and duration for each unit of work — tool calls, LLM requests, database queries |
| **Workers** | Wraps the worker process as a single integration point — one change to your bootstrap code connects everything |

:::tip New to Temporal?
If you haven't worked with Temporal before, read **[Temporal 101](/docs/getting-started/temporal-101)** for a quick primer on Workflows, Activities, Workers, and how OpenBox uses them.
:::

## How OpenBox Maps to Temporal

This table shows exactly when governance happens during a Temporal execution:

| What happens in Temporal | What OpenBox does | When |
|---|---|---|
| Workflow starts | Creates a governance session, evaluates startup policies | `WorkflowStarted` event |
| Activity executes | Captures inputs/outputs, evaluates policies per activity | `ActivityStarted` / `ActivityCompleted` |
| HTTP call inside an activity | Automatically captured via OpenTelemetry | During activity execution |
| Signal received | Captures signal data, evaluates governance | `SignalReceived` event |
| Workflow completes/fails | Closes session, triggers attestation | `WorkflowCompleted` / `WorkflowFailed` |

## Prerequisites

### All Paths

These are required regardless of which getting started path you choose:

- **[Python 3.11+](https://www.python.org/downloads/)**
- **[uv](https://docs.astral.sh/uv/)** — Python package manager
- **`make`** — Required to run setup and dev scripts:

<Tabs>
<TabItem value="mac" label="macOS" default>

```bash
xcode-select --install
```

</TabItem>
<TabItem value="linux" label="Linux">

```bash
# Debian/Ubuntu
sudo apt install make

# Fedora/RHEL
sudo dnf install make
```

</TabItem>
<TabItem value="windows" label="Windows">

```bash
winget install GnuWin32.Make
# or
choco install make
```

</TabItem>
</Tabs>

<details>
<summary><strong>Running the Demo?</strong> You'll also need these</summary>

- **[Node.js](https://nodejs.org/)** — Required for the demo frontend
- **Temporal CLI** — Local development server for Temporal

<Tabs>
<TabItem value="mac" label="macOS" default>

Install with [Homebrew](https://brew.sh/):

```bash
brew install temporal
```

To manually install, download the version for your architecture:

- [Download for Intel Macs](https://temporal.download/cli/archive/latest?platform=darwin&arch=amd64)
- [Download for Apple Silicon Macs](https://temporal.download/cli/archive/latest?platform=darwin&arch=arm64)

Extract the archive and add the `temporal` binary to your `PATH` by copying it to `/usr/local/bin`.

</TabItem>
<TabItem value="linux" label="Linux">

Download the version for your architecture:

- [Download for Linux amd64](https://temporal.download/cli/archive/latest?platform=linux&arch=amd64)
- [Download for Linux arm64](https://temporal.download/cli/archive/latest?platform=linux&arch=arm64)

Extract the archive and add the `temporal` binary to your `PATH` by copying it to `/usr/local/bin`.

</TabItem>
<TabItem value="windows" label="Windows">

Install with [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/):

```bash
winget install Temporal.TemporalCLI
```

Alternatively, download the version for your architecture:

- [Download for Windows amd64](https://temporal.download/cli/archive/latest?platform=windows&arch=amd64)
- [Download for Windows arm64](https://temporal.download/cli/archive/latest?platform=windows&arch=arm64)

Extract the archive and add `temporal.exe` to your `PATH`.

</TabItem>
</Tabs>

</details>

<details>
<summary><strong>Wrapping an existing agent?</strong> You'll also need these</summary>

- **Existing Temporal agent** — A working Temporal agent with Workflows and Activities
- **Running Temporal server** — Either [Temporal Cloud](https://temporal.io/cloud) or a self-hosted Temporal server

</details>

### Accounts & Keys

- **OpenBox Account** — Sign up at [platform.openbox.ai](https://platform.openbox.ai)
- **OpenBox API Key** — Generated when you [register an agent](/docs/dashboard/agents/registering-agents)
- **LLM API Key** — From any [LiteLLM-supported provider](https://docs.litellm.ai/docs/providers) (OpenAI, Anthropic, Google, etc.)

## Choose Your Path

<div className="row">
<div className="col col--6">

### [Run the Demo](/docs/getting-started/run-the-demo)

Clone the demo agent, configure your keys, and see OpenBox governance capture and evaluate every workflow event, activity, and LLM call.

**Best for:** First-time users who want to see OpenBox in action before integrating.

</div>
<div className="col col--6">

### [Wrap an Existing Agent](/docs/getting-started/wrap-an-existing-agent)

Already have a Temporal agent? Replace `Worker` with `create_openbox_worker` — one code change to add the trust layer.

**Best for:** Teams with an existing Temporal agent ready to govern.

</div>
</div>

## Want to Go Deeper?

- **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** — Full demo walkthrough with configuration options, HITL approvals, and multiple scenarios
- **[SDK Reference](/docs/developer-guide/sdk-reference)** — Full SDK documentation and configuration options
