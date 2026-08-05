---
title: Organization
description: "Configure your organization settings: Manage billing, teams, SSO, and governance policies in one place for all your AI agents."
llms_description: Managing your OpenBox organization
sidebar_position: 8
tags:
  - agent-management
  - audit
---

# Organization

Manage your organization's teams, members, and settings. Access from the sidebar by clicking **Organization**.

![Organization](/img/Organization.webp)


## Teams

Organize agents and members into teams for access control. See [Teams](./teams) for the full reference.

## <mark className="diff-mark">Resource Catalog</mark>

<mark className="diff-mark">Declare the business resources (APIs, databases, queues) that the [Agent IAM Gate](/trust-lifecycle/authorize/agent-iam-gate) checks operations against, and grant agent roles on each one. See [Resource Catalog](/dashboard/resource-catalog) for the full reference.</mark>

## Members

### Adding Members

1. Go to **Organization → Members**
2. Click **Create User**
3. Enter user details and select a role
4. To assign a team, edit the user after creation and select a team

:::note
Team assignment is only available for non-administrator roles (e.g., Developer, Viewer). Organization-level admins have access across all teams.
:::

## Permissions

Configure what each role can access and modify within the organization. Go to **Organization → Permissions**.

| Role | Permissions |
|------|-------------|
| **Admin** | Can manage all teams, agents, policies, organization settings, <mark className="diff-mark">and resource catalog grants across every team</mark> |
| **Developer** | Can create and manage agents within assigned teams, <mark className="diff-mark">and grant agent roles on resources their team owns.</mark> Cannot modify organization settings |
| **Viewer** | Can view agents, logs, reports, <mark className="diff-mark">and the resource catalog.</mark> Cannot make any modifications |

## <mark className="diff-mark">Platform Operations</mark>

<mark className="diff-mark">Manage the developer-facing webhooks subscription API, platform management API keys, and feature flags. See [Platform Operations](/administration/platform-operations) for the full reference, including how these differ from an agent's own API key and from the notification integrations below.</mark>

## <mark className="diff-mark">Identity Bridge</mark>

<mark className="diff-mark">Optionally connect an identity provider so trust incidents are emitted as CAEP signals over the Shared Signals Framework. Off by default for every organization; new connections start in **Monitor Mode** and send nothing live until you opt in. See [Identity Bridge](/administration/identity-bridge) for the full reference.</mark>

## Settings

### General

- Organization name and logo
- Default timezone
- Notification preferences

### <mark className="diff-mark">Integrations</mark>

:::info 🆕 Coming soon
Organization-level notification integrations are in development. This section will be updated with setup steps once available.
:::

<mark className="diff-mark">Planned outbound notification integrations:</mark>

| Integration | Purpose |
|-------------|---------|
| **Slack** | Approval notifications |
| **PagerDuty** | Critical alerts |
| **Datadog** | Metrics export |
| **Splunk** | Log forwarding |
| <mark className="diff-mark">**Webhooks**</mark> | <mark className="diff-mark">Custom notification destinations</mark> |

:::note 🆕
This "Webhooks" integration sends notifications to a URL you provide; it isn't the same as the developer-facing event-subscription API. See [Platform Operations → Webhooks](/administration/platform-operations#webhooks-event-subscription-api) for that.
:::

### <mark className="diff-mark">Billing</mark>

:::info 🆕 Coming soon
Billing & entitlements is staged for release. This section will be updated with real plan and invoice data once it ships.
:::

Planned:

- Current plan details
- Usage metrics
- Invoice history
- Payment methods
- Upgrade/downgrade

## Audit Log

View all organization activity:

| Event Type | Examples |
|------------|----------|
| **Authentication** | Login, logout, failed attempts |
| **Members** | Invites, role changes, removals |
| **Agents** | Created, updated, deleted |
| **Policies** | Created, updated, deleted |
| **Approvals** | Approved, rejected, expired |
| **Settings** | Configuration changes |

### Filtering

Filter audit log by:

- Date range
- Event type
- User
- Agent
- Team

See [Audit Log](/administration/organization-audit-log) for details.

## Next Steps

1. **[View Audit Log](/administration/organization-audit-log)** - See detailed activity history and export for compliance
2. **[Compliance](/administration/compliance-and-audit)** - Use audit trails and attestation evidence for auditors
