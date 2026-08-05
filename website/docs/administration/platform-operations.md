---
title: Platform Operations
description: "Developer-facing plumbing for OpenBox itself: subscribe to governance events via webhooks, manage platform API keys, and roll out features with flags."
llms_description: Webhooks subscription API, platform-level API keys, and feature flags, distinct from per-agent credentials and notification integrations
sidebar_position: 6
tags:
  - sdk
  - reference
  - organization
---

# Platform Operations

:::tip 🆕 New page in this review
Everything on this page is new.
:::

Platform Operations covers developer-facing plumbing for automating and extending OpenBox itself, distinct from the per-agent credentials and dashboard notification settings documented elsewhere.

## Webhooks (Event Subscription API)

:::note Not the same as Organization → Integrations
[Organization → Integrations](/administration/organization#settings) sends **notifications** to Slack, PagerDuty, Datadog, or a webhook URL when something happens: a fixed set of alert types, configured once per destination.

The webhooks documented here are a **subscription API**: you register an endpoint, choose which governance event types to receive, and OpenBox POSTs each matching event to it as it happens. Use this when you're building something that reacts to governance events programmatically, not just getting notified about them.
:::

| Field | Description |
|-------|--------------|
| **Endpoint URL** | Your HTTPS endpoint that receives event payloads |
| **Event Types** | Which event types to subscribe to |
| **Signing Secret** | Used to verify payloads came from OpenBox |

OpenBox signs each payload; verify the signature before trusting the body.

## API Keys (Platform Management API)

:::note Not the same as an agent's API key
An agent's `obx_live_*` / `obx_test_*` key (see [Agent Settings → API Access](/dashboard/agents/agent-settings#api-access)) authenticates that **agent's own governance traffic**: the requests the SDK sends when the agent runs.

Platform API keys, documented here, authenticate calls **to OpenBox's own management API**, for example, scripting agent registration or pulling audit-log exports. They belong to your organization, not to any one agent.
:::

| Field | Description |
|-------|--------------|
| **Name** | Label for the key, shown in the audit trail |
| **Scopes** | Which management API resources this key can access |
| **Created / Last Used** | Standard key lifecycle metadata |

Create and manage platform API keys under **Organization → Platform Operations → API Keys**.

## Feature Flags

Feature flags let you opt in to features still rolling out (like some of the ones on this page) at the organization level, without waiting for a default-on release.

| Field | Description |
|-------|--------------|
| **Flag** | The feature being gated |
| **Status** | Off, or On for your organization |

Contact OpenBox to enable a gated flag for your organization.

## Related

- **[Agent Settings → API Access](/dashboard/agents/agent-settings#api-access)**: Per-agent credentials, not platform credentials
- **[Organization](/administration/organization)**: Notification integrations and organization settings
