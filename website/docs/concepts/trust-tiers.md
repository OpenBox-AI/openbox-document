---
title: Trust Tiers
description: Trust Tier levels and how they affect trust controls
sidebar_position: 2
---

# Trust Tiers

Trust Tiers translate the numeric Trust Score (0-100) into trust levels that determine how strictly an agent is controlled.

## Tier Definitions

| Tier | AIVSS Score | Risk Level | Description |
|------|-------------|------------|-------------|
| **Tier 1** | 0% – 24% | Low | Read-only, public data access |
| **Tier 2** | 25% – 49% | Medium | Internal data, non-critical actions |
| **Tier 3** | 50% – 74% | High | PII, financial data, critical actions |
| **Tier 4** | 75% – 100% | Critical | System admin, destructive actions |

## Trust Controls by Tier

### Tier 1: Highly Trusted

**Characteristics:**
- Long history of compliant behavior
- No recent violations
- High goal alignment

**Trust controls:**
- Most operations auto-approved
- Logging only for standard actions
- HITL only for highest-risk operations
- Minimal latency impact

**Example agents:** Production assistants with 6+ months of clean history.

### Tier 2: Trusted

**Characteristics:**
- Generally compliant
- Minor or infrequent violations
- Good alignment

**Trust controls:**
- Standard policy enforcement
- Normal monitoring
- HITL for medium-risk operations
- Typical trust overhead

**Example agents:** Most production agents after initial period.

### Tier 3: Developing

**Characteristics:**
- New agents (starting tier for most)
- Recent violations being addressed
- Inconsistent alignment

**Trust controls:**
- Enhanced monitoring
- Stricter policy enforcement
- HITL for more operation types
- Trust recovery tracking

**Example agents:** New agents, agents recovering from incidents.

### Tier 4: Low Trust

**Characteristics:**
- Multiple recent violations
- Pattern of non-compliance
- Significant goal drift

**Trust controls:**
- Strict controls on all operations
- Frequent HITL requirements
- Rate limiting
- Elevated logging

**Example agents:** Agents under investigation, after major violations.

## Tier Transitions

### Downgrade (Immediate)

Agents are immediately downgraded when Trust Score crosses lower bound:

```
Trust Score drops from 76 to 74
→ Immediate downgrade: Tier 2 → Tier 3
→ Alert generated
→ Stricter policies applied
```

### Upgrade (Sustained)

Agents are upgraded only after sustained improvement:

```
Trust Score rises from 74 to 76
→ Score must stay ≥75 for 7 days
→ Then upgrade: Tier 3 → Tier 2
→ Notification sent
```

This prevents oscillation at tier boundaries.

## Tier-Based Policy Defaults

Policies can reference Trust Tier:

```rego
# Allow database writes only for Tier 1-2
allow {
    input.operation.type == "DATABASE_WRITE"
    input.agent.trust_tier <= 2
}

# Require approval for Tier 3+ agents
require_approval {
    input.operation.type == "EXTERNAL_API_CALL"
    input.agent.trust_tier >= 3
}
```

## Visual Indicators

| Tier | Badge Color | Icon |
|------|-------------|------|
| Tier 1 | Green | Shield with check |
| Tier 2 | Blue | Shield |
| Tier 3 | Yellow | Shield with warning |
| Tier 4 | Red | Shield with exclamation |

## Related

- **[Trust Scores](/docs/concepts/trust-scores)** - How the 0-100 score is calculated
- **[Governance Decisions](/docs/concepts/governance-decisions)** - What happens at each tier
- **[Dashboard](/docs/dashboard)** - View organization-wide tier distribution
