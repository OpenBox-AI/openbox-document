---
title: Adapt
description: Phase 5 - Evolve trust and improve policies over time
sidebar_position: 5
tags:
  - trust-scoring
  - hitl
  - policy-authoring
  - observability
---

# Adapt (Phase 5)

The Adapt phase enables trust evolution over time. Review agent-specific approvals and insights to improve governance over time.

Access via **Agent Detail → Adapt** tab.

## Sub-tabs

### Approvals

The **Approvals** sub-tab shows agent-specific approval status for the last 7 days.

**Summary Cards**:

- Pending approvals
- Approved (7d)
- Rejected (7d)
- Approval rate

#### Pending Approvals

Pending approval cards show:

- Risk tier
- Semantic action type (for example: `database_delete`, `external_api_call`)
- Requested operation description
- Triggering rule/reason

Actions:
- **Approve** - Allow operation to proceed
- **Reject** - Deny operation
- **Escalate** - Forward for higher-level review

If there are no approvals waiting, the page shows an empty state ("No pending approvals found").

#### Approval History

Collapsible history of recent decisions for this agent:

| Field | Description |
|-------|-------------|
| **Request** | The operation/request that required approval |
| **Trust Tier** | Trust tier at the time of the request |
| **Decision** | Approved or rejected |
| **Decided By** | User who made the decision |
| **Time** | When the decision was made |

For the organization-wide approval queue, see **[Approvals](/docs/approvals)**.

### Insights

The **Insights** sub-tab summarizes governance learning signals.

**Summary Cards**:

- Violation patterns
- Policy suggestions
- Trust recovery plans
- Tier changes (last 30 days)

#### Violation Patterns for This Agent

Aggregated patterns derived from this agent's violations, including:

| Field | Description |
|-------|-------------|
| **Pattern Name** | Name and type (behavior pattern or guardrail pattern) |
| **Frequency** | How often it occurred |
| **Severity** | Relative severity |
| **Sessions** | Number of sessions involved |
| **Action** | View Details |

#### Agent Trust Timeline

Chronological history of trust tier changes for this agent, including:

- Promotions
- Demotions
- Recovery completions
- Initial provisioning events with reasons

#### Recent Violations

Shows the most recent violations for this agent, including the event type (for example, `ActivityStarted`), the rule type (for example, `GUARDRAIL`), and the resulting governance decision.

Use **View All Rules** to jump back to Authorize and review the rules that are currently enforcing governance.

#### Trust Recovery Status

Shows whether the agent is currently under a recovery plan after a demotion.

Typical indicators include:

- Compliance rate
- Days since last violation
- Promotion eligibility progress/checklist

#### Policy Suggestions

Based on observed patterns, OpenBox can suggest new policies or rules.

For each suggestion:
- **Accept** - Creates the rule in Authorize tab
- **Reject** - Dismisses (with reason)
- **Modify** - Opens in rule editor

Other Insights cards:

- **Trust Recovery** summarizes recovery signals and recommendations when available.
- **Tier Changes (7d)** shows recent trust tier transitions for the agent.

## Next Steps

The Trust Lifecycle is continuous. From here you can:

1. **[Update Governance (Authorize)](/docs/trust-lifecycle/authorize)** - Accept policy suggestions or create new rules
2. **[Re-assess Risk (Assess)](/docs/trust-lifecycle/assess)** - If your agent's capabilities have changed
3. **[Handle Approvals](/docs/approvals)** - Review organization-wide approval queue
