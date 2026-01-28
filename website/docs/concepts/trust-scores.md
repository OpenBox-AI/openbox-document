---
title: Trust Scores
description: How Trust Scores are calculated and used
sidebar_position: 1
---

# Trust Scores

The Trust Score is a 0-100 metric representing an agent's trustworthiness based on its configuration and behavior.

## Calculation

```
Trust Score = (AIVSS × 40%) + (Behavioral × 35%) + (Alignment × 25%)
```

| Component | Weight | Source | Range |
|-----------|--------|--------|-------|
| **AIVSS** | 40% | Risk assessment (Assess phase) | 0-100 |
| **Behavioral** | 35% | Policy compliance (Authorize + Monitor) | 0-100 |
| **Alignment** | 25% | Goal consistency (Verify phase) | 0-100 |

## Components

### AIVSS Score (40%)

Based on the agent's inherent risk profile:

- Configured at agent creation
- 14 dimensions across access, capability, impact
- Static unless re-assessed
- Higher score = lower inherent risk

### Behavioral Score (35%)

Based on runtime compliance:

- Starts at 100 for new agents
- Decreases with violations
- Increases with compliant behavior
- Updated continuously

**Factors:**

| Event | Impact |
|-------|--------|
| Compliant operation | +0.01 per 10 operations |
| HITL approval granted | +0.5 |
| Policy violation (DENY) | -2 to -5 |
| TERMINATE triggered | -10 to -15 |
| Approval rejected | -2 |
| Approval timeout | -1 |

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

| Score | Description |
|-------|-------------|
| **90-100** | Excellent - highly trusted |
| **75-89** | Good - standard trust |
| **50-74** | Moderate - developing trust |
| **25-49** | Low - requires attention |
| **0-24** | Untrusted - supervised mode |

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
| Tier 1 (90+) | Green |
| Tier 2 (75-89) | Blue |
| Tier 3 (50-74) | Yellow |
| Tier 4 (25-49) | Orange |
| Untrusted (below 25) | Red |

## Score Evolution

### New Agents

```
Initial Trust Score:
├── AIVSS: (from risk profile) × 40%
├── Behavioral: 100 × 35% = 35
├── Alignment: 100 × 25% = 25
└── Total: varies by risk profile
```

Example for Level 2 (Low Risk) profile:
- AIVSS: 80 × 40% = 32
- Behavioral: 100 × 35% = 35
- Alignment: 100 × 25% = 25
- **Initial Score: 92 (Tier 1)**

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

Recovery rate: typically +0.5 to +1.5 points per day with good behavior.

## Related

- **[Trust Tiers](/docs/concepts/trust-tiers)** - How scores map to trust controls
- **[Assess Phase](/docs/agents/trust-lifecycle/assess)** - Configure the AIVSS component
- **[Adapt Phase](/docs/agents/trust-lifecycle/adapt)** - Watch trust evolve over time
