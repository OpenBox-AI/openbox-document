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
| **Admin** | Can manage all teams, agents, policies, and organization settings |
| **Developer** | Can create and manage agents within assigned teams. Cannot modify organization settings |
| **Viewer** | Can view agents, logs, and reports. Cannot make any modifications |

## Settings

### General

- Organization name and logo
- Default timezone
- Notification preferences

### Integrations

Send governance events to external systems via [Webhooks](/administration/webhooks), which support two endpoint modes — **HTTP** and **Slack**. Slack notifications are delivered as a webhook mode, not a separate integration.

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
