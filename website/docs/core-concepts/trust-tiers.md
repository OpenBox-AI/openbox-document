---
title: Trust Tiers
description: "What are trust tiers? Learn the 4-level system from restricted to autonomous and how tier changes affect agent permissions."
llms_description: Tiered classification of agent trust levels
sidebar_position: 2
tags:
  - trust-scoring
  - risk-assessment
  - governance
---

# Trust Tiers

Trust Tiers translate the numeric Trust Score (0-100) into trust levels that determine how strictly an agent is controlled. Higher Trust Score = higher tier (lower number) = more autonomy.

## Tier Definitions

| Tier | Trust Score | Label | Description |
|------|-------------|-------|-------------|
| **Tier 1** | 90 – 100 | Trusted | Long history of compliance, minimal constraints |
| **Tier 2** | 75 – 89 | Confident | Generally compliant, standard policies |
| **Tier 3** | 50 – 74 | Monitor | New agents or recovering, enhanced controls |
| **Tier 4** | 25 – 49 | Restrict | Pattern of non-compliance, strict governance + HITL |
| **Untrusted** | 0 – 24 | Decommission | Agent suspended, cannot operate |

## Trust Controls by Tier

### Tier 1: Trusted

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

### Tier 2: Confident

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

### Tier 3: Monitor

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

### Tier 4: Restrict

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

### Upgrade (Immediate)

Agents are immediately upgraded when Trust Score crosses upper bound. Tier 1 upgrades additionally require admin approval.

```
Trust Score rises from 74 to 76
→ Immediate upgrade: Tier 3 → Tier 2
→ Notification sent
```

Both directions are symmetric — no stabilization periods or cooldowns. Trust recovery is earned through clean sessions pushing penalties out of the rolling window, not granted by idle time.

## Tier-Based Policy Defaults

Policies can reference Trust Tier:

```rego
# Allow database writes only for Tier 1-2
allow {
    input.spans[_].semantic_type == "database_insert"
    input.trust_tier <= 2
}

# Require approval for external calls by Tier 3+ agents
require_approval {
    input.spans[_].semantic_type == "http_post"
    input.trust_tier >= 3
}
```

## Visual Indicators

| Tier | Badge Color | Icon |
|------|-------------|------|
| Tier 1 | Green | Shield with check |
| Tier 2 | Blue | Shield |
| Tier 3 | Orange | Shield with warning |
| Tier 4 | Red | Shield with exclamation |
| Untrusted | Dark Red | Shield with cross |

## Related

- **[Trust Scores](/core-concepts/trust-scores)** - How the 0-100 score is calculated
- **[Governance Decisions](/core-concepts/governance-decisions)** - What happens at each tier
- **[Dashboard](/dashboard)** - View organization-wide tier distribution
