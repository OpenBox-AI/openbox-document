---
title: Audit Log
description: Organization activity audit trail
sidebar_position: 1
tags:
  - audit
  - compliance
---

# Organization Audit Log

Complete activity history across all agents and users.

Access via **Organization Management → Audit Log** tab.

---

## Table Columns

Each audit log entry is displayed with the following columns:

| Column | Description |
|--------|-------------|
| **Timestamp** | Date and time of the event (e.g., "Feb 13, 10:28:22 AM") |
| **Event Type** | Category badge (e.g., Guardrail Change, Policy Change) |
| **Actor** | Email of the user or system that performed the action |
| **Action** | Description of what happened (e.g., "Created guardrail for agent") |
| **Result** | Outcome badge — **Success**, **Failed**, **Denied**, **Warning**, **Approved**, or **Allowed** |
| **Details** | Eye icon to view the full event detail |

---

## Event Type Categories

Use the **All Event Types** dropdown to filter by category:

| Category | What It Covers |
|----------|---------------|
| **Agent Operations** | Agent created, updated, deleted, blocked, trust tier changed |
| **Policy Changes** | OPA policy created, updated, deleted, enabled, or disabled |
| **User Actions** | Member invited, role changed, approval decisions, settings changes |
| **Security Events** | Login attempts, API key usage, suspicious activity |
| **System Events** | Automated trust score changes, scheduled jobs, system-level operations |

---

## Filtering & Search

### Search

Use the **Search audit events…** bar to perform free-text search across event descriptions, actor emails, and action text.

### Event Type Filter

Click the **All Event Types** dropdown and select a category to narrow results to a specific event type.

### Time Range Filter

Click the time range dropdown to select a window:

- **Last 24 Hours** (default)
- **Last 7 Days**
- **Last 30 Days**
- **This Month**
- **Custom date range**

---

## Event Detail Modal

Clicking the eye icon on any row opens the **Audit Event Details** modal with full event information and metadata.

### Event Overview

| Field | Description |
|-------|-------------|
| **Timestamp** | Date and time of the event |
| **Result** | Outcome of the action (e.g., success, failed, denied) |
| **Actor** | Email of the user who performed the action |
| **Action** | Human-readable description of what happened |
| **Resource Type** | Type of resource affected (e.g., guardrail, policy, agent) |

### Request Details

Shows the HTTP request that triggered the event:

- **Method and path** — e.g., `PUT /agent/{agent_id}/guardrails/{guardrail_id}`
- **Request Body** — Full JSON payload sent in the request
- **Response** — Full JSON response returned by the server

### Technical Information

| Field | Description |
|-------|-------------|
| **Event ID** | Unique identifier for this audit event |
| **Organization ID** | Organization where the event occurred |
| **Actor ID** | Unique identifier of the user who performed the action |

---

## Export

Click the **Export Log** button in the top-right corner to export audit log data.

1. Click **Export Log**
2. Enter an export name
3. Select time range (presets: 24h, 7d, 30d, this month, or custom)
4. Select event types to include
5. Click **Queue Export**

Exports are processed in the background and made available for download once complete.

### Supported Formats

| Format | Description |
|--------|-------------|
| **CSV** | Comma-separated values for spreadsheet tools |
| **Excel** | Native Excel workbook format |

---

## Related

- **[Compliance & Audit](/docs/administration/compliance-and-audit)** — Overview of audit trails and evidence collection
- **[Attestation & Cryptographic Proof](/docs/administration/attestation-and-cryptographic-proof)** — How session events are cryptographically signed
