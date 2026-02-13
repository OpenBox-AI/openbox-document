---
title: Organization
description: Manage teams, members, and settings
sidebar_position: 8
---

# Organization

Manage your organization's teams, members, API keys, and settings. Access from the sidebar by clicking **Organization**.

![Organization](/img/Organization.png)


## Teams

Organize agents and members into teams for access control.

### Creating Teams

1. Go to **Organization → Teams**
2. Click **Create Team**
3. Enter team name and description
4. Add members
5. Assign agents

### Team Permissions

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, can delete team |
| **Admin** | Manage members, configure agents |
| **Member** | View agents, handle approvals |
| **Viewer** | Read-only access |

### Agent Assignment

Agents are assigned to teams:

- Each agent belongs to one team
- Team members can view/manage their agents
- Cross-team access requires Admin or Owner role

## Members

### Inviting Members

1. Go to **Organization → Members**
2. Click **Invite Member**
3. Enter email address
4. Select role and teams
5. Send invitation

### Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| **Organization Owner** | Org-wide | Full access, billing, danger zone |
| **Organization Admin** | Org-wide | Manage all teams, members, settings |
| **Team Admin** | Team | Manage team agents and members |
| **Team Member** | Team | View and operate team agents |
| **Billing Admin** | Org-wide | Billing and invoices only |

### Key Scopes

| Scope | Access |
|-------|--------|
| **Organization** | All agents across all teams |
| **Team** | Agents within specific team only |

## Settings

### General

- Organization name and logo
- Default timezone
- Notification preferences

<!-- ### Integrations

Configure external integrations:

| Integration | Purpose |
|-------------|---------|
| **Slack** | Approval notifications |
| **PagerDuty** | Critical alerts |
| **Datadog** | Metrics export |
| **Splunk** | Log forwarding |
| **Webhooks** | Custom integrations |

### Billing

- Current plan details
- Usage metrics
- Invoice history
- Payment methods
- Upgrade/downgrade -->

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

See [Audit Log](/docs/organization/audit-log) for details.

## Next Steps

1. **[View Audit Log](/docs/organization/audit-log)** - See detailed activity history and export for compliance
2. **[Compliance](/docs/compliance)** - Use audit trails and attestation evidence for auditors
