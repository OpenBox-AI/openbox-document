---
title: Agents
description: Managing AI agents in OpenBox
llms_description: Managing agents in the dashboard
sidebar_position: 4
tags:
  - agent-management
---

# Agents

Agents are the core entity in OpenBox. Each agent represents an AI system (workflow, assistant, or autonomous process) that OpenBox governs.

Access the agent list from the sidebar by clicking **Agents**.

![Agents](/img/Agents.png)

## Stats Cards

The top of the page shows three key metrics:

| Metric | Description |
|--------|-------------|
| **Total Agents** | Total registered agents with monthly change |
| **Guardrail Violation Rate** | Percentage of operations blocked by guardrails |
| **Policy Violation Rate** | Percentage of operations blocked by policies |

## Search and Filters

Filter the agent list using:

- **Search** - Find agents by name or ID
- **Trust Tier** - Filter by Tier 1, 2, 3, or 4
- **Status** - Active, Inactive, or Revoked
- **Team** - Filter by owning team

## Agent Table

The main table displays:

| Column | Description |
|--------|-------------|
| **Agent** | Name, icon, and ID |
| **Status** | Active (green pulse), Inactive, or Revoked |
| **Trust Tier** | TIER 1, TIER 2, TIER 3, or TIER 4 badge |
| **Trust Score** | Current 0-100 score with trend indicator (↑/↓) |
| **Team** | Owning team |
| **Violations 24h** | Number of violations in the last 24 hours |
| **Verification** | Real-time attestation status |
| **Last Active** | Time since last activity |
| **Actions** | Menu for View Details, Settings |

### Status Indicators

| Status | Indicator |
|--------|-----------|
| **Active** | Green badge with pulsing dot |
| **Inactive** | Gray badge |
| **Revoked** | Red badge |

### Trust Tier Badges

| Tier | Color | Description |
|------|-------|-------------|
| **TIER 1** | Green | Tier 1 (0% – 24%): Trusted — Minimal oversight, broad permissions |
| **TIER 2** | Blue | Tier 2 (25% – 49%): Confident — Standard controls, approval for sensitive ops |
| **TIER 3** | Orange | Tier 3 (50% – 74%): Monitor — Strict controls, monitoring required |
| **TIER 4** | Red | Tier 4 (75% – 100%): Restrict — Minimal permissions, approval for most ops |

## Agent Actions

Click the **⋮** menu on any row to:

- **View Details** - Navigate to agent detail page
- **[Settings](/dashboard/agents/agent-settings)** - Go directly to agent settings

Or click anywhere on the row to view the agent detail.

## Adding Agents

Click the **Add Agent** button (top right) to register a new agent. See [Registering Agents](/dashboard/agents/registering-agents) for details.

## Agent Detail Page

Click any agent to view its detail page with these tabs:

- **[Overview](/trust-lifecycle/overview)** - Active sessions, completed, failed, and halted sessions
- **[Assess](/trust-lifecycle/assess)** - Risk profile configuration
- **[Authorize](/trust-lifecycle/authorize)** - Guardrails, policies, and behavioral rules
- **[Monitor](/trust-lifecycle/monitor)** - Operational dashboard and telemetry
- **[Verify](/trust-lifecycle/verify)** - Goal alignment and drift detection
- **[Adapt](/trust-lifecycle/adapt)** - Trust evolution and policy suggestions
- **[Settings](/dashboard/agents/agent-settings)** - Agent configuration, risk profile, API keys, and lifecycle management

## Next Steps

1. **[Register a New Agent](/dashboard/agents/registering-agents)** - Add a new agent to OpenBox
2. **[Trust Overview](/dashboard/trust-overview)** - View trust scores and trends across all agents
