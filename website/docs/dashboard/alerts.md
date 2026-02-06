---
title: Alerts
description: Agents requiring attention
sidebar_position: 2
---

# Alerts

The Alerts section highlights agents that need review. Access it from the dashboard's "Agents Requiring Attention" panel.

## Alert Types

### Trust Tier Changes

Triggered when an agent's Trust Score crosses a tier boundary:

- **Downgrade** (e.g., Tier 2 → Tier 3): May indicate policy violations or goal drift
- **Upgrade** (e.g., Tier 3 → Tier 2): Agent demonstrating improved compliance

### Goal Drift Detected

Triggered when the Verify phase detects misalignment:

- Alignment score dropped below threshold (default: 70%)
- Agent actions diverging from stated goals
- Requires investigation in **Agent Detail → Verify** tab

### Policy Violations

Triggered when governance blocks an operation:

- **BLOCK** - Action rejected, agent continues
- **HALT** - Terminates entire agent session
- Review details in **Agent Detail → Adapt → Insights**

### Approval Timeouts

Triggered when HITL requests expire without action:

- Default timeout: 24 hours
- Expired approvals result in operation denial
- Review queue in **[Approvals](/docs/approvals)**

### Behavioral Rule Matches

Triggered when multi-step patterns are detected:

- Sensitive data access followed by external API call
- Repeated failed authentication attempts
- Custom patterns defined in behavioral rules

## Alert Actions

For each alert, you can:

| Action | Description |
|--------|-------------|
| **View Agent** | Navigate to agent detail page |
| **Acknowledge** | Mark as reviewed (stays in history) |
| **Create Rule** | Pre-fill a behavioral rule to prevent recurrence |
| **Dismiss** | Remove from active alerts |

## Alert Configuration

Configure alert thresholds in **Organization → Settings**:

- Trust tier change notifications
- Goal drift threshold (default: 70%)
- Approval timeout duration
- Notification channels (email, Slack, webhook)

## Next Steps

When you see an alert:

1. **[View Agent Details](/docs/agents)** - Click the agent to investigate
2. **[Check Goal Alignment (Verify)](/docs/agents/trust-lifecycle/verify)** - If drift is detected
3. **[Review Approvals](/docs/approvals)** - If approvals have timed out
