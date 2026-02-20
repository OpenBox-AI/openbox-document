---
title: SDK Reference
description: Thin wrapper for Temporal workflow integration
sidebar_position: 6
---

# SDK Reference

The OpenBox SDK integrates with Temporal workflows. It handles event capture, telemetry collection, and trust evaluation with a single function call.

:::info What the SDK Does
The SDK's primary job is to **wrap your Temporal worker** and send workflow/activity events to the OpenBox platform. All trust logic, policies, and UI management happens on the platform - not in the SDK.
:::

## Philosophy

The SDK is intentionally minimal:

- **One function call** to wrap your worker (`create_openbox_worker`)
- **Zero code changes** to workflow/activity logic. Worker initialization requires adding OpenBox wrapper (~5 lines).
- **Automatic telemetry** - captures HTTP, database, and file I/O operations

## Supported Engines

| Engine | Language | Status |
|--------|----------|--------|
| Temporal | Python | ✅ Supported |

## Installation and Setup

See:

1. **[Quick Start](/docs/getting-started/quick-start)** - Wrap an existing Temporal worker
2. **[Temporal (Python)](/docs/developer-guide/temporal-integration-guide)** - End-to-end setup from scratch
3. **[Configuration](/docs/developer-guide/configuration)** - All SDK options for `create_openbox_worker`

## What the SDK Captures

The SDK automatically captures and sends to OpenBox:

### Workflow Events
- Workflow started/completed/failed
- Signal received
- Query executed

### Activity Events
- Activity started (with input)
- Activity completed (with output and duration)
- Activity failed (with error)

### HTTP Telemetry
- Request/response bodies (for LLM calls, external requests)
- Headers and status codes
- Request duration and timing

### Database Operations (Optional)
- SQL queries (PostgreSQL, MySQL)
- NoSQL operations (MongoDB, Redis)

### File I/O (Optional)
- File read/write operations
- File paths and sizes

All captured data is evaluated against your trust policies on the OpenBox platform.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Temporal Worker                     │
│                                                              │
│  ┌────────────────────┐      ┌──────────────────────────┐  │
│  │   Your Workflow    │      │    Your Activity         │  │
│  │   (unchanged)      │      │    (unchanged)           │  │
│  └────────────────────┘      └──────────────────────────┘  │
│           │                              │                  │
│           ▼                              ▼                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │         OpenBox SDK (Interceptors)                 │    │
│  │  - Captures events                                 │    │
│  │  - Collects HTTP/DB/File telemetry                │    │
│  │  - Sends events to OpenBox                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │        OpenBox             │
              │       Trust Engine        │
              │                            │
              │   Returns:                 │
              │   - continue/stop          │
              │   - guardrails_result      │
              └────────────────────────────┘
```

## Configuration

See **[Configuration](/docs/developer-guide/configuration)** for all options including:
- Environment variables
- Governance timeout and fail policies
- Event filtering (skip workflows/activities)
- Database and file I/O instrumentation

## Next Steps

1. **[Temporal Integration](/docs/developer-guide/temporal-integration-guide)** - Wrap an existing Temporal agent with the SDK
2. **[Configuration](/docs/developer-guide/configuration)** - Configure timeouts, fail policies, and exclusions
3. **[Error Handling](/docs/developer-guide/error-handling)** - Handle governance decisions in your code
