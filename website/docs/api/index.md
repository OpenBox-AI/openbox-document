---
title: Integrations
description: Integrate OpenBox using the SDK
sidebar_position: 7
---

# Integrations

OpenBox is designed to be integrated via the **SDK**. Your workflows and activities stay unchanged - the SDK wraps your worker and streams events to OpenBox for trust, monitoring, and compliance.

## Recommended Integration Paths

1. **[Wrap an Existing Agent](/docs/getting-started/wrap-an-existing-agent)** - Wrap an existing Temporal agent
2. **[Temporal (Python)](/docs/developer-guide/temporal-integration-guide-python)** - End-to-end setup from scratch
3. **[SDK Reference](/docs/developer-guide/sdk-reference)** - SDK overview
4. **[SDK Configuration](/docs/developer-guide/configuration)** - Timeouts, fail policies, filtering, instrumentation
5. **[Monitor Sessions](/docs/trust-lifecycle/monitor)** - Review governance decisions and session timelines in the dashboard

## Webhooks

To integrate notifications into your systems (Slack, incident response, ticketing, etc.), configure webhooks in **Organization → Settings**.

See:

1. **[Approvals](/docs/approvals)** - Review and act on pending requests
2. **[Audit Log](/docs/administration/organization-audit-log)** - Evidence of decisions and actions
