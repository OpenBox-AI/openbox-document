---
title: Integrations
description: Integrate OpenBox using the SDK
sidebar_position: 7
---

# Integrations

OpenBox is designed to be integrated via the **SDK**. Your workflows and activities stay unchanged - the SDK wraps your worker and streams events to OpenBox for governance, monitoring, and compliance.

## Recommended Integration Paths

1. **[Quick Start](/docs/getting-started/quick-start)** - Wrap an existing Temporal agent
2. **[Temporal (Python)](/docs/getting-started/workflow-engines/temporal)** - End-to-end setup from scratch
3. **[SDK Reference](/docs/sdk)** - SDK overview
4. **[SDK Configuration](/docs/sdk/configuration)** - Timeouts, fail policies, filtering, instrumentation
5. **[SDK Error Handling](/docs/sdk/error-handling)** - Handle governance decisions in code

## Webhooks

To integrate notifications into your systems (Slack, incident response, ticketing, etc.), configure webhooks in **Organization → Settings**.

See:

1. **[Approval Workflows](/docs/approvals/workflows)** - Routing and escalation
2. **[Audit Log](/docs/organization/audit-log)** - Evidence of decisions and actions
