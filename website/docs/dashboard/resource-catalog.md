---
title: Resource Catalog
description: "Declare the business resources your AI agents can access (APIs, databases, and queues) and grant agent roles against each one."
llms_description: Org-wide catalog of declared resources and agent role grants for the Agent IAM Gate
sidebar_position: 5
tags:
  - agent-management
  - governance
---

# Resource Catalog

:::tip 🆕 New page in this review
Everything on this page is new.
:::

The Resource Catalog is where you declare the business resources the [Agent IAM Gate](/trust-lifecycle/authorize/agent-iam-gate) checks every governed operation against. It's organization-scoped, not agent-scoped; one catalog serves every agent in your org, since the same database or API is often called by more than one agent.

Access it from **Organization → Resource Catalog**.

## Permissions

Resource Catalog access follows the organization's existing roles:

| Role | Can do |
|------|--------|
| **Admin** | Create, edit, and retire resources; grant or revoke agent roles on any resource |
| **Developer** | View resources; grant or revoke agent roles on resources owned by their team |
| **Viewer** | Read-only |

See [Organization → Permissions](/administration/organization#permissions) for the full role reference.

## Create Resource

Click **Add Resource** to declare a new business resource.

| Field | Required | Description |
|-------|----------|--------------|
| **Name** | Yes | Human-readable label (e.g. `Billing API`, `Customer DB`) |
| **Type** | Yes | **API**, **Database**, **Queue**, or **Custom** |
| **Match Pattern** | Yes | How OpenBox recognizes operations that target this resource: a URL prefix for an API, a table or schema name for a database, a queue name for a queue |
| **Owner** | No | Team accountable for the resource |
| **Description** | No | Free-text context for operators |

Click **Save** to add the resource to the catalog. New resources follow the same [Monitor Then Enforce](/trust-lifecycle/authorize/agent-iam-gate#rollout-monitor-then-enforce) rollout as the agents matched against them: in Monitor mode, operations that would be denied are logged, not blocked; once an agent is switched to Enforce, it's denied on its next operation matching a resource it holds no role on.

## Grant Agent Roles

Open a resource from the catalog list to manage its access grants.

| Role | Grants |
|------|--------|
| **Reader** | Read-only operations against the resource |
| **Operator** | Read and write operations against the resource |
| **Owner** | Full access, plus the ability to grant roles to other agents on this resource |

Click **Grant Access**, select an agent, and choose a role. An agent with no grant on a resource is denied by default (see [Implicit Deny](/trust-lifecycle/authorize/agent-iam-gate#implicit-deny)).

## Resource Status

| Status | Effect |
|--------|--------|
| **Active** | Resource is matched and enforced |
| **Retired** | Resource is no longer matched; operations that would have matched it fall through to implicit deny |

Retire a resource instead of deleting it to preserve its grant history in the audit trail.

## Related

- **[Agent IAM Gate](/trust-lifecycle/authorize/agent-iam-gate)**: How the catalog is enforced in the authorization pipeline
- **[Agent Settings](/dashboard/agents/agent-settings)**: Pause or revoke an individual agent's access entirely
