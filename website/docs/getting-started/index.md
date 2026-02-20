---
title: Getting Started
description: Get OpenBox running with your AI agents
sidebar_position: 1
---

# Getting Started

OpenBox integrates with your existing workflow engine by wrapping the worker process. All trust configuration happens in the OpenBox dashboard - your code stays clean.

## Prerequisites

- A workflow engine (currently Temporal Python is supported)
- An OpenBox account with API key
- Python 3.11+

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

**The SDK does one thing:** wraps your workflow engine worker to intercept events and apply trust controls. Everything else - policies, guardrails, approvals, monitoring - is configured in the dashboard.

## Next Steps

1. **[Quick Start](/docs/getting-started/quick-start)** - Register your first agent and see it in the dashboard
2. **[Temporal Integration](/docs/developer-guide/temporal-integration-guide-python)** - Detailed SDK configuration options
