---
title: Agent Settings
description: Configure agent details, risk profile, API keys, and lifecycle status
sidebar_position: 3
---

# Agent Settings

The **Settings** tab on an agent's detail page lets you manage every aspect of the agent after it has been registered. Open it by navigating to **Agents → select an agent → Settings**, or by choosing **Settings** from the **⋮** actions menu in the agent table.

Settings is divided into four sections: [General](#general-settings), [Risk Configuration](#risk-configuration), [API Access](#api-access), and [Danger Zone](#danger-zone).

## General Settings

![General Settings](/img/agents/settings-general.png)

Use this section to update the core identity and organizational assignment of the agent.

| Field | Description |
|-------|-------------|
| **Agent Icon** | Change the icon from the built-in library or upload a custom image |
| **Agent Name** | Editable display name shown throughout the dashboard |
| **Description** | Free-text summary of what the agent does |
| **Teams** | Multi-select dropdown to assign the agent to one or more teams |
| **Agent DID** | Read-only decentralized identifier (`did:openbox:agent:...`). Click to copy |
| **Tags** | Add freeform tags for filtering and organization |

Click **Save Changes** to persist any edits.

:::tip
You can reassign an agent to different teams at any time from this section — you are not limited to the team chosen during [registration](/docs/dashboard/agents/registering-agents).
:::

## Risk Configuration

![Risk Configuration](/img/agents/settings-risk-configuration.png)

This section displays the agent's current risk posture as determined by the [AIVSS (AI Vulnerability Severity Scoring System)](/docs/trust-lifecycle/assess) parameters.

At a glance you can see:

- **Trust Tier badge** — the agent's current tier (e.g. TIER 2)
- **Risk Level label** — human-readable level (e.g. Medium)
- **Trust Score** — the calculated 0–100 score

Expand **View All Parameters** to inspect the full set of Base Security, AI-Specific, and Impact parameter values that produced the current score.

### Recalculate Trust Score

Click **Recalculate Trust Score** to trigger a fresh calculation based on the current parameter values. The panel shows a **Last calculated** timestamp so you can see when the score was last updated.

### Adjust Risk Level

Click **Adjust Risk Level** to modify the underlying risk profile parameters. See the [Assess](/docs/trust-lifecycle/assess) documentation for a full description of each parameter and how it influences the trust score.

## API Access

![API Access](/img/agents/settings-api-access.png)

Manage the API key that the agent uses to authenticate with the OpenBox SDK.

The panel shows:

| Detail | Description |
|--------|-------------|
| **Primary API Key** | Masked key value with an **Active** status badge |
| **Created** | Date the key was generated |
| **Last used** | Timestamp of the most recent API call made with this key |

### Rotate Key

Click **Rotate Key** to generate a new API key. The previous key is immediately invalidated. Copy the new key when prompted — it is only displayed once.

:::warning
Rotating a key invalidates the old key immediately. Any running agent instances using the old key will fail to authenticate until they are updated with the new key.
:::

### Revoke Key

Click **Revoke Key** to permanently revoke the API key. This is a destructive action — the agent will no longer be able to authenticate and a new key must be generated before it can resume operations.

## Danger Zone

![Danger Zone](/img/agents/settings-danger-zone.png)

Actions in this section have significant impact on the agent's operational status and cannot always be easily undone.

The current agent status is displayed at the top of the section (e.g. **Active**, **Paused**, or **Revoked**).

### Pause Agent

Temporarily stops the agent from processing requests. While paused:

- The agent cannot start new sessions
- Existing in-flight sessions will complete but no new work is accepted
- The agent can be **resumed** at any time to restore normal operation

### Revoke Agent Access

Immediately revokes all API keys and disconnects any active integrations. This is a permanent action:

- All API keys are invalidated
- Active integrations are disconnected
- The agent's data and history are preserved for audit purposes
- The agent cannot be reactivated — a new agent must be registered to replace it

:::danger
Revoking an agent is irreversible. Use **Pause** if you only need to temporarily disable the agent.
:::

### Recent Administrative Actions

An audit trail at the bottom of the Danger Zone shows a chronological log of key changes made to the agent, including:

- API key rotations and revocations
- Rate limit updates
- Status changes (paused, resumed, revoked)
- Agent creation event

Each entry shows the action, timestamp, and the user who performed it.

## Next Steps

- **[Wrap an Existing Agent](/docs/getting-started/wrap-an-existing-agent)** — Already have a Temporal agent? Add the OpenBox trust layer
- **[Run the Demo](/docs/getting-started/run-the-demo)** — Clone the demo repo and see governance in action
- **[Agents](/docs/dashboard/agents)** — View and manage all registered agents
