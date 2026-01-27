---
title: Approval Workflows
description: Configure approval routing and escalation
sidebar_position: 1
---

# Approval Workflows

Configure how approval requests are routed, who can approve, and what happens when approvals aren't handled.

## Routing

### By Trust Tier

Route approvals based on agent trust:

| Trust Tier | Default Routing |
|------------|-----------------|
| **Tier 1** | Auto-approve most operations |
| **Tier 2** | Team lead approval |
| **Tier 3** | Security team + Team lead |
| **Tier 4** | Security team required |
| **Untrusted** | Admin approval required |

### By Operation Type

Route based on what the agent is attempting:

| Operation Type | Example Routing |
|---------------|-----------------|
| `DATABASE_WRITE` | Data team |
| `EXTERNAL_API_CALL` | Security team |
| `FILE_WRITE` | Team lead |
| Financial operations | Finance + Security |

### By Risk Level

OpenBox calculates a risk level for each request:

| Risk Level | Calculation | Routing |
|------------|-------------|---------|
| **Low** | Low-risk operation + high trust tier | Team member |
| **Medium** | Standard operation + standard tier | Team lead |
| **High** | Sensitive operation or lower tier | Security team |
| **Critical** | High-risk operation + low tier | Admin required |

## Escalation

### Time-Based Escalation

If not handled within threshold, escalate:

```
0-30 min:    Primary approver (Team lead)
30-60 min:   Secondary approver (Security team)
60+ min:     Admin + Alert
```

Configure in **Organization → Settings → Approval Workflows**.

### Automatic Escalation Triggers

- Approval approaches timeout
- Multiple pending approvals from same agent
- Agent trust tier drops while approval pending
- High-risk operation from flagged agent

## Notification Channels

Configure how approvers are notified:

### Email

- Immediate notification on new request
- Reminder at 50% of timeout
- Escalation notification

### Slack

```
#approvals channel:

🔔 Approval Required
Agent: Customer Support Agent (Tier 3)
Operation: EXTERNAL_API_CALL → stripe.com
Risk: Medium
Timeout: 23h remaining

[Approve] [Reject] [View Details]
```

### Webhook

Send events to your systems for custom integrations:

```json
{
  "event": "approval_requested",
  "approval_id": "apr_abc123",
  "agent_id": "agt_xyz789",
  "operation": {
    "type": "EXTERNAL_API_CALL",
    "target": "stripe.com/customers"
  },
  "risk_level": "medium",
  "timeout_at": "2024-01-16T09:14:32Z"
}
```

## Approval Policies

### Auto-Approve Rules

For trusted scenarios, skip the queue:

```yaml
auto_approve:
  - condition:
      trust_tier: 1
      operation_type: DATABASE_READ
    reason: "Tier 1 agents can read databases"

  - condition:
      trust_tier: [1, 2]
      operation_type: LLM_CALL
    reason: "LLM calls allowed for trusted agents"
```

### Auto-Reject Rules

Block without human review:

```yaml
auto_reject:
  - condition:
      trust_tier: 5  # Untrusted
      operation_type: DATABASE_WRITE
    reason: "Untrusted agents cannot write to database"
```

### Require Multiple Approvers

For high-risk operations:

```yaml
multi_approval:
  - condition:
      risk_level: critical
    required_approvers: 2
    must_include: ["security_team"]
```

## Approval Audit Trail

Every approval decision is logged:

```
Approval ID: apr_abc123
Agent: Customer Support Agent
Operation: EXTERNAL_API_CALL
Requested: 2024-01-15 09:14:32 UTC
Decision: APPROVED
Decided by: john@company.com
Decided at: 2024-01-15 09:18:45 UTC
Comment: "Verified customer requested refund"
Trust Impact: None
```

Access in:
- **Organization → Audit Log** (all approvals)
- **Agent Detail → Adapt** (per-agent)
- **Compliance → Attestation** (for auditors)

## Next Steps

1. **[View Audit Log](/docs/organization/audit-log)** - See all approval decisions and other organization activity
2. **[Review Agent Approvals](/docs/agents/trust-lifecycle/adapt)** - See approvals for a specific agent
3. **[Compliance](/docs/compliance)** - Use approval evidence alongside attestation and audit logs
