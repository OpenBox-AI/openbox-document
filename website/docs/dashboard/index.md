---
title: Dashboard
description: Trust Overview and organization-wide monitoring
sidebar_position: 3
---

# Dashboard

The Dashboard provides a real-time overview of your organization's AI governance health. Access it from the sidebar by clicking **Dashboard**.

![Dashboard](/img/Dashboard.png)

## Navigation

The sidebar navigation includes:

- **Dashboard** - Organization overview (this page)
- **Agents** - Manage and monitor agents
- **Approvals** - Human-in-the-loop queue (shows pending count badge)
- **Organisation** - Teams, members, API keys, settings

## Hero Stats

The top of the dashboard displays four key performance indicators:

| Metric | Description |
|--------|-------------|
| **Total Agents** | Number of registered agents with weekly change |
| **Active Sessions** | Currently running workflow sessions |
| **Violations** | Policy violations in the selected time period |
| **Daily Cost** | Estimated daily token/API usage costs |

## Agents by Trust Tier

A donut chart showing the distribution of agents across Trust Tiers:

| Tier | Risk Level | Description |
|------|------------|-------------|
| **Tier 1 (0% – 24%): Trusted - Green** | Low | Highly trusted, minimal constraints |
| **Tier 2 (25% – 49%): Confident - Blue** | Medium | Standard policies, normal monitoring |
| **Tier 3 (50% – 74%): Monitor - Orange** | High | Enhanced controls, some HITL required |
| **Tier 4 (75% – 100%): Restrict - Red** | Critical | Strict governance, frequent HITL |

Click any tier in the legend to filter the agents list.

## High-Risk Agent Activity

A timeline of recent governance events from Tier 3 and Tier 4 agents:

Each activity shows:
- **Agent name and icon**
- **Trust Tier badge** (TIER 3, TIER 4)
- **Verdict badge** (ALLOWED, CONSTRAINED, HALTED, APPROVED)
- **Description** of what triggered the governance event
- **Timestamp**
- **Link to approvals** (if pending)

Example events:
- "Attempted database_delete without prior backup_create" → HALTED
- "Bulk email operation rate-limited to 10/hour" → CONSTRAINED
- "Large transaction ($5,000+) approved by admin" → APPROVED

## Trust Tier Trends

A 30-day line chart showing how your trust tier distribution has changed over time. Use this to identify:

- Improving governance (more agents moving to Tier 1/2)
- Emerging risks (agents moving to Tier 3/4)
- Seasonal patterns in agent behavior

### Export Reports

Click **Export Report** to download:

- **CSV** - Raw data for analysis
- **PDF** - Formatted report for stakeholders

## Adding Agents

Click the **Add Agent** button (top right) to register a new agent.

The agent creation form includes:

- **Teams** and **Icon** selection
- **API Key Generation** (copy once)
- **Initial Risk Assessment** (**[AIVSS](/docs/agents/trust-lifecycle/assess)**)
- **Attestation** (**[Execution Evidence](/docs/compliance/attestation)**)

See **[Registering Agents](/docs/agents/registering-agents)** for a field-by-field walkthrough.

## Next Steps

From the Dashboard, you'll typically:

1. **[View Agents](/docs/agents)** - Click an agent to see its details and configure trust controls
2. **[Handle Approvals](/docs/approvals)** - Review pending HITL requests when the badge shows pending items
3. **[Add a New Agent](/docs/agents/registering-agents)** - Register another agent to bring under the trust layer
