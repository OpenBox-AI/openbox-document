---
title: New to Temporal?
description: Set up Temporal and understand why OpenBox uses it
sidebar_position: 1
---

# New to Temporal?

[Temporal](https://temporal.io/) is a workflow engine that provides durable execution for your code. It handles retries, timeouts, and failure recovery automatically — if a process crashes mid-execution, Temporal picks up exactly where it left off. This makes it well-suited for orchestrating AI agents that run multi-step tasks.

## Why OpenBox Uses Temporal

OpenBox hooks into Temporal's execution model to provide governance and observability without changing your agent's logic:

| Temporal Concept | What OpenBox Does |
|---|---|
| **Workflows** | Intercepts start, complete, and fail events to track agent sessions and evaluate governance policies |
| **Activities** | Captures inputs, outputs, and duration for each unit of work — tool calls, LLM requests, database queries |
| **Workers** | Wraps the worker process as a single integration point — one change to your bootstrap code connects everything |

Because Temporal already structures your agent's execution into workflows and activities, OpenBox can observe and govern every step without any instrumentation inside your business logic.

## Set Up Temporal

Follow Temporal's official guide to get a local development environment running:

> **[Set up a local development environment (Python)](https://docs.temporal.io/develop/python/set-up-your-local-python)** — Install the Temporal CLI, start the development server, and run a Hello World workflow.

### Verify You're Ready

Before moving on, confirm these three things:

- **Dev server is running** — `temporal server start-dev` starts without errors
- **Web UI is accessible** — Open [http://localhost:8233](http://localhost:8233) in your browser
- **Hello World works** — You ran the sample workflow from the guide and it completed successfully

## Next Steps

- **[Registering Agents](/docs/getting-started/registering-agents)** — Create your agent in the OpenBox dashboard and get an API key
