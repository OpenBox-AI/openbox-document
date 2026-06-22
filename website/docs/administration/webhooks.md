---
title: Webhooks
description: "Send real-time governance events to HTTP endpoints or Slack: verdicts, approvals, trust-score changes, and compliance signals."
llms_description: Real-time event delivery via HTTP and Slack
sidebar_position: 4
tags:
  - integration
  - observability
  - organization
---

# Webhooks

Webhooks deliver real-time governance events to external systems. Configure them under **Organization → Webhooks**.

## Endpoint modes

Each webhook delivers to one of two endpoint modes:

| Mode | Behavior |
|------|----------|
| **HTTP** | POSTs the JSON event payload to an HTTPS endpoint you control. |
| **Slack** | Posts a formatted Block Kit notification to a Slack channel via a Slack incoming-webhook URL. |

Slack is a delivery **mode of a webhook**, not a separate integration.

## Supported events

Each webhook subscribes to one or more event types and can target specific agents or all agents.

| Event | Description |
|-------|-------------|
| `governance.verdict.block` | An operation was blocked by a policy or guardrail. |
| `governance.verdict.halt` | An agent session was halted. |
| `governance.verdict.require_approval` | An operation was paused for human approval. |
| `governance.verdict.constrain` | An operation was allowed with constraints applied. |
| `approval.decided` | An approval request was approved or rejected. |
| `approval.expired` | An approval request reached its 24-hour hard expiry. |
| `trust_score.decreased` | An agent's trust score dropped. |
| `compliance.export.ready` | A requested compliance evidence export finished and is ready to download. |
| `compliance.attestation.expiring` | A cryptographic attestation is approaching its expiry. |

## Sample payload

```json
{
  "version": "1",
  "event_type": "governance.verdict.require_approval",
  "timestamp": "2026-01-29T10:00:00Z",
  "organization_id": "org_8f3a2b10",
  "agent_id": "a1b2c3d4-5e6f-7081-9234-56789abcdef0",
  "agent_name": "order-processor",
  "governance_event_id": "e5f6a7b8-90ab-cdef-1234-567890abcdef",
  "verdict": "require_approval",
  "reason": "PII accessed; requires approval"
}
```

Every delivery shares the same envelope: `version`, `event_type`, `timestamp` (RFC 3339), `organization_id`, `agent_id`, and `agent_name`. Governance and approval events add `governance_event_id`, `verdict`, and `reason`; trust and decision events add optional fields such as `risk_score`, `trust_tier`, `trust_score`, `decided_by`, and `decided_at` when relevant.

## Securing webhooks (HTTP mode)

HTTP-mode deliveries are signed so you can verify they came from OpenBox and weren't tampered with. (Slack mode posts to a Slack incoming-webhook URL and is not separately signed.)

Each HTTP delivery includes these headers:

| Header | Value |
|--------|-------|
| `X-OpenBox-Signature` | `v1=sha256:<hex>` — HMAC-SHA256 signature of the payload |
| `X-OpenBox-Timestamp` | Unix seconds when the delivery was signed |
| `X-OpenBox-Event` | The event type being delivered |
| `X-OpenBox-Delivery` | Unique delivery UUID |

To verify a delivery, compute `HMAC-SHA256(secret, "{X-OpenBox-Timestamp}.{raw_request_body}")`, hex-encode it, prefix it with `v1=sha256:`, and compare the result to `X-OpenBox-Signature` using a constant-time comparison. The signing secret is generated per webhook and shown only once — when you create or regenerate it in the webhook's settings — so copy it at that moment; OpenBox stores only an encrypted copy.

OpenBox does not enforce replay protection on your behalf. After verifying the signature, reject deliveries whose `X-OpenBox-Timestamp` is older than your tolerance (for example, more than 5 minutes) to guard against replay.

**Delivery and retries**: each attempt times out after 10 seconds. Failed deliveries are retried with exponential backoff (roughly 5s, 10s, 20s, then 40s) for up to 5 attempts within a 5-minute window; responses with `4xx` status codes are treated as permanent and are not retried. Every attempt is recorded in the webhook's delivery log, which you can review from the dashboard.

## Related

- **[Organization](/administration/organization)** - Where webhooks are configured
- **[Approvals](/approvals)** - The approval events delivered here
