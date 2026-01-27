---
title: Trust Overview
description: Understanding the organization-wide trust health view
sidebar_position: 1
---

# Trust Overview

The Trust Overview is the primary dashboard view, showing aggregate governance health across all agents.

## Trust Score Components

The organization Trust Score is calculated from individual agent scores:

```
Agent Trust Score = (AIVSS × 40%) + (Behavioral × 35%) + (Alignment × 25%)
```

| Component | Weight | Source |
|-----------|--------|--------|
| **AIVSS** | 40% | Initial risk assessment (configured at agent creation) |
| **Behavioral** | 35% | Runtime compliance with policies and rules |
| **Alignment** | 25% | Goal alignment consistency (Verify phase) |

## Trust Tier Distribution

The dashboard shows a distribution chart of agents across tiers:

```
Tier 1 ████████████░░░░░░░░ 45 agents (38%)
Tier 2 ██████████████████░░ 52 agents (44%)
Tier 3 ████░░░░░░░░░░░░░░░░ 15 agents (13%)
Tier 4 ██░░░░░░░░░░░░░░░░░░  5 agents (4%)
Untrust█░░░░░░░░░░░░░░░░░░░  1 agent  (1%)
```

## Trend Indicators

Each metric shows directional trends:

- **↑** Improving - trust scores rising
- **↓** Degrading - trust scores falling
- **→** Stable - no significant change

## Filtering

Filter the dashboard by:

- **Team** - View specific team's agents
- **Trust Tier** - Focus on specific tier
- **Status** - Active, inactive, or blocked agents

## Exporting

Export dashboard data for reporting:

- **PDF Report** - Formatted for stakeholders
- **CSV** - Raw data for analysis
- **Compliance Report** - Formatted for auditors (see [Compliance](/docs/compliance))

## Next Steps

1. **[View Alerts](/docs/dashboard/alerts)** - See agents that need attention
2. **[Drill into Agents](/docs/agents)** - Click any agent to view details and configure governance
