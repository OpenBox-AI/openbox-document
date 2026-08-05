---
title: Inventory
description: "Org-wide registry of agents, models, tools, and integrations, including unregistered callers OpenBox has observed but you haven't registered yet."
llms_description: Org-wide discovery registry for agents, models, tools, and integrations, including unregistered ("shadow AI") callers
sidebar_position: 4
tags:
  - agent-management
  - observability
---

# Inventory

:::tip 🆕 New page in this review
Everything on this page is new.
:::

:::info Gated
Inventory is a gated feature. Contact OpenBox to enable it for your organization.
:::

Inventory is the org-wide registry of everything OpenBox has seen: registered agents, but also the models, tools, and integrations they call, whether or not each one is formally registered yet. Where [Agents](/dashboard/agents) lists what you've registered, Inventory also surfaces what's calling your systems that you haven't. The registry supports import and export, so you can bring in resource lists from other systems or hand them off for audits.

Access it from the sidebar by clicking **Inventory**.

## Why It Exists

Guardrails, policies, and behavioral rules only govern traffic that reaches OpenBox through a registered agent. Inventory answers a different question: what AI-adjacent activity is happening in your org that OpenBox doesn't yet govern (commonly called "shadow AI").

## Auto-Matching Observed Traffic

Inventory correlates observed calls (from registered agents' own telemetry, and from other signals available to your organization) against known models, tools, and integrations. A match that resolves to an already-registered agent is shown as normal activity. A match that doesn't resolve to any registered agent becomes an **unregistered caller**.

## Unregistered Callers

Each unregistered caller shows:

| Field | Description |
|-------|--------------|
| **Identifier** | Whatever OpenBox could resolve: a model name, an API endpoint, a tool signature |
| **First Observed** | When this caller was first seen |
| **Volume** | How much traffic has been attributed to it |
| **Suggested Match** | If OpenBox can guess which known model/tool/integration this is |

Click **Register** on an unregistered caller to turn it into a governed agent in one step, pre-filled from what Inventory already knows about it: the fastest path from "we didn't know this was happening" to "this is now governed." Click **Deny** instead if the caller is known and not meant to be running; OpenBox keeps it flagged as denied rather than turning it into a governed agent.

## Related

- **[Agents](/dashboard/agents)**: The registered agents Inventory cross-references against
- **[Registering Agents](/dashboard/agents/registering-agents)**: The full manual registration flow, for when auto-suggestion isn't enough
- **[Resource Catalog](/dashboard/resource-catalog)**: Declare the resources agents are allowed to reach, once they're registered
