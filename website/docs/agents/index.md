---
title: Agents
description: Managing AI agents in OpenBox
sidebar_position: 4
---

# Agents

Agents are the core entity in OpenBox. Each agent represents an AI system (workflow, assistant, or autonomous process) that OpenBox governs.

Access the agent list from the sidebar by clicking **Agents**.

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
- **Trust Tier** - Filter by Tier 1, 2, 3, 4, or Untrusted
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
| **TIER 1** | Green | Low risk, minimal constraints |
| **TIER 2** | Blue | Medium risk, standard policies |
| **TIER 3** | Orange | High risk, enhanced controls |
| **TIER 4** | Red | Critical, strict governance |

## Agent Actions

Click the **⋮** menu on any row to:

- **View Details** - Navigate to agent detail page
- **Settings** - Go directly to agent settings

Or click anywhere on the row to view the agent detail.

## Adding Agents

Click the **Add Agent** button (top right) to register a new agent. See [Registering Agents](/docs/agents/registering-agents) for details.

## Agent Detail Page

Click any agent to view its detail page with Trust Lifecycle tabs:

- **Overview** - Active sessions, recent sessions, trust score widget
- **[Assess](/docs/agents/trust-lifecycle/assess)** - Risk profile and AIVSS configuration
- **[Authorize](/docs/agents/trust-lifecycle/authorize)** - Guardrails, policies, and behavioral rules
- **[Monitor](/docs/agents/trust-lifecycle/monitor)** - Sessions, session replay, telemetry
- **[Verify](/docs/agents/trust-lifecycle/verify)** - Goal alignment and drift detection
- **[Adapt](/docs/agents/trust-lifecycle/adapt)** - Trust evolution and policy suggestions
- **Settings** - Agent configuration and danger zone

### Overview Tab

The default tab shows:

- **Trust Score widget** - Current score with tier badge and trend
- **Active sessions** - Live workflow executions with real-time status
- **Recent sessions** - Completed sessions with duration, events, status
- **Quick stats** - Operations count, approval rate, violations

### Session Replay

Click any session (active or completed) to open **Session Replay**:

- **Timeline control** - Play/pause, seek, speed control (0.5x, 1x, 2x)
- **Event stream** - Chronological list of all events
- **Event detail** - Click any event to see full context
- **Goal alignment score** - Session-level alignment percentage
- **Governance decisions** - See ALLOWED, CONSTRAINED, HALTED verdicts inline

## Next Steps

1. **[Register a New Agent](/docs/agents/registering-agents)** - Add another agent to govern
2. **[Understand the Trust Lifecycle](/docs/agents/trust-lifecycle)** - Learn how the 5 governance phases work together
3. **[Configure Governance (Authorize)](/docs/agents/trust-lifecycle/authorize)** - Set up guardrails and policies for an agent
