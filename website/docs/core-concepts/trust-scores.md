---
title: Trust Scores
description: How Trust Scores are calculated and used
sidebar_position: 1
---

# Trust Scores

The Trust Score is a 0-100 metric representing an agent's trustworthiness based on its configuration and behavior.

:::info How the key terms relate
- **Risk Profile Score** — initial assessment score (0-100) based on your agent's risk questionnaire. Set during the [Assess phase](/docs/trust-lifecycle/assess).
- **Trust Score** — ongoing score (0-100) combining Risk Profile (40%) + Behavioral (35%) + Alignment (25%)
- **Trust Tier** — tier label (1-4) derived from the Risk Profile Score ranges
:::

## Calculation

```
Trust Score = (Risk Profile Score × 40%) + (Behavioral × 35%) + (Alignment × 25%)
```

| Component | Weight | Source | Range |
|-----------|--------|--------|-------|
| **Risk Profile Score** | 40% | Risk scoring (Assess phase) | 0-100 |
| **Behavioral** | 35% | Policy compliance (Authorize + Monitor) | 0-100 |
| **Alignment** | 25% | Goal consistency (Verify phase) | 0-100 |

## Components

### Risk Profile Score (40%)

Based on the agent's inherent risk profile:

- Configured at agent creation
- 14 parameters across three weighted categories: Base Security (25%), AI-Specific (45%), Impact (30%)
- Produces an **Risk Profile Score (0–100)** and a **Risk Tier (1–4)**
- Static unless re-assessed
- Higher score = lower inherent risk

### Behavioral Score (35%)

Based on runtime compliance:

- Behavioral Compliance component starts at 100 for new agents
- Violations affect the Behavioral Compliance component (35% weight), not Trust Score directly
- Increases with compliant behavior
- Updated continuously

**Factors:**

Penalty to Behavioral Compliance component:

- Minor violation: -5 pts (→ -1.75 pts Trust Score)
- Major violation: -15 pts (→ -5.25 pts Trust Score)
- Critical violation: -25 pts (→ -8.75 pts Trust Score)

### Alignment Score (25%)

Based on goal consistency:

- Starts at 100 for new agents
- Updated per session based on goal alignment checks
- Uses LLM evaluation (configurable)

**Calculation per session:**

```
Session Alignment = avg(operation_alignment_scores)
Overall Alignment = weighted_avg(recent_sessions, decay=0.95)
```

## Score Ranges

| Risk Profile Score| Risk Tier | Risk Level | Description |
|-------------|-----------|------------|-------------|
| **0% – 24%** | Tier 1 | Low | Read-only, public data access |
| **25% – 49%** | Tier 2 | Medium | Internal data, non-critical actions |
| **50% – 74%** | Tier 3 | High | PII, financial data, critical actions |
| **75% – 100%** | Tier 4 | Critical | System admin, destructive actions |

## Score Display

Throughout the UI, Trust Score appears with:

```
┌─────────────────┐
│      87         │  ← Large number
│   ━━━━━━━━━     │  ← Color bar
│    TIER 2       │  ← Tier badge
│    ↑ +3         │  ← Trend indicator
└─────────────────┘
```

**Color coding:**

| Tier | Color |
|------|-------|
| Tier 1 (0% – 24%) | Green |
| Tier 2 (25% – 49%) | Blue |
| Tier 3 (50% – 74%) | Yellow |
| Tier 4 (75% – 100%) | Red |

## Score Evolution

### New Agents

```
Initial Trust Score:
├── Risk Profile: (from risk profile) × 40%
├── Behavioral: 100 × 35% = 35
├── Alignment: 100 × 25% = 25
└── Total: varies by risk profile
```

Behavioral and Alignment components start at 100 for new agents. Overall Trust Score depends on the Risk Profile score.

Example: Risk Profile Score = 98, Behavioral = 100, Alignment = 100
→ Trust Score = (98 × 0.40) + (100 × 0.35) + (100 × 0.25) = 99.2 → TIER 1

### Over Time

```
Day 1:  92 ━━━━━━━━━━━━━━━━━━ Tier 1
Day 7:  88 ━━━━━━━━━━━━━━━━━━ Tier 2 (minor violations)
Day 14: 84 ━━━━━━━━━━━━━━━━━━ Tier 2 (stable)
Day 21: 86 ━━━━━━━━━━━━━━━━━━ Tier 2 (recovering)
Day 30: 89 ━━━━━━━━━━━━━━━━━━ Tier 2 (approaching Tier 1)
```

### Recovery

To improve a degraded score:

1. **Consecutive compliance** - No violations for 7+ days
2. **High operation volume** - More compliant operations
3. **HITL success** - Approved requests
4. **Goal alignment** - Consistent alignment scores

Recovery rate:
- Tier 1-3: +1 pt/day
- Tier 4: +0.5 pt/day

## Related

- **[Trust Tiers](/docs/core-concepts/trust-tiers)** - How scores map to trust controls
- **[Assess Phase](/docs/trust-lifecycle/assess)** - Configure the Risk Profile component
- **[Adapt Phase](/docs/trust-lifecycle/adapt)** - Watch trust evolve over time
