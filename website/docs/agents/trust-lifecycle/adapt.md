---
title: Adapt
description: Phase 5 - Evolve trust and improve policies over time
sidebar_position: 5
---

# Adapt (Phase 5)

The Adapt phase enables trust evolution over time. Review policy suggestions, handle approvals, and monitor trust recovery.

Access via **Agent Detail → Adapt** tab.

## Sub-tabs

### Approvals

Agent-specific pending approval requests:

| Field | Description |
|-------|-------------|
| **Request ID** | Unique identifier |
| **Operation** | What needs approval |
| **Session** | Originating session |
| **Requested** | Timestamp |
| **Timeout** | Time remaining |
| **Trust Impact** | Score change if approved/rejected |

Actions:
- **Approve** - Allow operation to proceed
- **Reject** - Deny operation
- **View Context** - See full governance decision details

For the organization-wide approval queue, see **[Approvals](/docs/approvals)**.

### Insights

AI-generated insights for improving governance:

#### Policy Suggestions

Based on observed patterns, OpenBox suggests new policies or rules:

```
Suggested Rule: "PII Access + External API"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: DATABASE_READ on PII tables
Condition: EXTERNAL_API_CALL within 60s (without approval)
Action: REQUIRE_APPROVAL

Confidence: 87%
Based on: 12 similar violations in past 30 days
```

For each suggestion:
- **Accept** - Creates the rule in Authorize tab
- **Reject** - Dismisses (with reason)
- **Modify** - Opens in rule editor

#### Violation Patterns

Detected patterns in governance blocks:

| Pattern | Frequency | Severity | Recommendation |
|---------|-----------|----------|----------------|
| External API without approval | 12/month | Medium | Add behavioral rule |
| PII access during off-hours | 5/month | High | Time-based policy |
| Bulk database reads | 8/month | Low | Rate limiting guardrail |

#### Trust Recovery Progress

For agents with degraded trust scores, shows recovery path:

```
Current Trust Score: 62 (Tier 3)
Target: 75 (Tier 2)

Recovery Progress:
━━━━━━━━━━━━━━━━━━━━━━━━━━━ 48%

Recent trend: +1.2 points/day
Estimated recovery: 11 days

Requirements:
✓ No violations for 7 consecutive days
✓ 50+ compliant operations
○ Approval acceptance rate >90%
```

## Trust Score Evolution

The Trust Score evolves based on behavior:

### Positive Factors

| Factor | Impact |
|--------|--------|
| Compliant operations | +0.1 per 10 operations |
| Approved HITL requests | +0.5 per approval |
| High alignment scores | +0.2 per session |
| Recovery rate | +1 pt/day (Tier 1-3), +0.5 pt/day (Tier 4) |

### Negative Factors

| Factor | Impact |
|--------|--------|
| Violations affect Behavioral Compliance component (0-100 scale) | Minor: -5 pts, Major: -15 pts, Critical: -25 pts |
| Violation aging | Violations age out after 30 days with linear decay |

### Tier Transitions

When Trust Score crosses thresholds:

- **Downgrade**: Immediate upon crossing lower bound
- **Upgrade**: Requires sustained score above threshold for 7 days

## Trust Timeline

View historical Trust Score changes:

```
Jan 15  ●━━━ 87 ━━━━━━━━━━━━━━━━━ Tier 2
Jan 14  ●━━━ 85 ━━━━━━━━━━━━━━━━━ Tier 2
Jan 13  ●━━━ 72 ━━━━━━━━━━━━━━ Tier 3  ⚠️ Policy violation
Jan 12  ●━━━ 84 ━━━━━━━━━━━━━━━━━ Tier 2
Jan 11  ●━━━ 86 ━━━━━━━━━━━━━━━━━ Tier 2
```

Each entry shows:
- Score and tier
- Change reason (if applicable)
- Link to relevant session or event

## Continuous Improvement Loop

The Adapt phase feeds back into other phases:

1. **Insights** identify patterns
2. **Suggestions** create new rules in **Authorize**
3. Improved governance leads to better **Monitor** data
4. Better alignment in **Verify**
5. Trust score improves in **Adapt**

This creates a continuous improvement loop for your AI governance.

## Next Steps

The Trust Lifecycle is continuous. From here you can:

1. **[Update Governance (Authorize)](/docs/agents/trust-lifecycle/authorize)** - Accept policy suggestions or create new rules
2. **[Re-assess Risk (Assess)](/docs/agents/trust-lifecycle/assess)** - If your agent's capabilities have changed
3. **[Handle Approvals](/docs/approvals)** - Review organization-wide approval queue
