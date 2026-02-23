---
title: Getting Started
description: Get OpenBox running with your AI agents
sidebar_position: 1
---

# Getting Started

OpenBox integrates with your existing workflow engine by wrapping the worker process. All trust configuration happens in the OpenBox dashboard — your code stays clean.

## Integration Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
├─────────────────────────────────────────────────────────────┤
│  Workflows & Activities  →  OpenBox SDK Wrapper  →  Worker  │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   OpenBox Platform  │
                         │  ┌───────────────┐  │
                         │  │   Dashboard   │  │
                         │  │  (Configure)  │  │
                         │  └───────────────┘  │
                         └─────────────────────┘
```

**The SDK does one thing:** wraps your workflow engine worker to intercept events and apply trust controls. Everything else — policies, guardrails, approvals, monitoring — is configured in the dashboard.

## Choose Your Path

### New to Temporal?

Never used Temporal before? Follow the newcomer path to set up your environment, register an agent, and run a guardrails demo:

1. **[New to Temporal?](/docs/getting-started/new-to-temporal)** — Install Temporal and understand the basics
2. **[Registering Agents](/docs/getting-started/registering-agents)** — Create your agent and get an API key
3. **[Quick Start](/docs/getting-started/guardrails-demo)** — Run a minimal demo to see OpenBox in action

### Already have a Temporal agent?

Register your agent and add the OpenBox trust layer with a single code change:

1. **[Registering Agents](/docs/getting-started/registering-agents)** — Create your agent and get an API key
2. **[Wrap an Existing Agent](/docs/getting-started/wrap-an-existing-agent)** — Replace `Worker` with `create_openbox_worker`

## Additional Resources

- **[Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python)** — Run the full demo repo with an LLM-powered agent end-to-end
- **[SDK Reference](/docs/developer-guide/sdk-reference)** — Full SDK documentation and configuration options
