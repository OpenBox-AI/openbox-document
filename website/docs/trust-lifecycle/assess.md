---
title: Assess
description: Phase 1 - Establish baseline trust through risk assessment
llms_description: Evaluating agent behavior and risk posture
sidebar_position: 1
tags:
  - risk-assessment
  - trust-scoring
  - agent-management
---

# Assess (Phase 1)

The Assess phase establishes baseline trust by evaluating the agent's inherent risk. This is primarily configured at agent creation and can be updated as capabilities change.

Access via **Agent Detail → Assess** tab.

## Risk Profile Configuration

The Risk Profile evaluates risk across three categories:

### Categories

- **Base Security** (5 params, 25%)
- **AI-Specific** (5 params, 45%)
- **Impact** (4 params, 30%)

### Parameters

- Base Security: `attack_vector`, `attack_complexity`, `privileges_required`, `user_interaction`, `scope`
- AI-Specific: `model_robustness`, `data_sensitivity`, `ethical_impact`, `decision_criticality`, `adaptability`
- Impact: `confidentiality_impact`, `integrity_impact`, `availability_impact`, `safety_impact`

## Risk Profiles

Pre-configured profiles simplify Risk Profile setup:

| Risk Tier | Risk Level | Risk Profile Score | Use Cases |
|-----------|------------|-------------|-----------|
| **Tier 1** | Low | 0% – 24% | Read-only, public data access |
| **Tier 2** | Medium | 25% – 49% | Internal data, non-critical actions |
| **Tier 3** | High | 50% – 74% | PII, financial data, critical actions |
| **Tier 4** | Critical | 75% – 100% | System admin, destructive actions |

## Viewing Current Assessment

The Assess tab shows:

### Predicted Trust Tier

The Assess tab displays the **Predicted Trust Tier** card with:

- **Sub-scores** for each Risk Profile category (shown as weighted contributions):
  - Base Security (out of 0.25)
  - AI-Specific (out of 0.45)
  - Impact (out of 0.30)
- **Risk Profile Score** — the combined score out of 100
- **Trust Score Calculation** — shows how the Risk Profile score feeds into the overall Trust Score:
  - Risk Profile × 40%
  - Behavioral (Initial) × 35%
  - Alignment (Initial) × 25%
- **Trust Score** and **Trust Tier** classification

### Risk Profile Category Breakdown

A detailed breakdown of how the trust score is calculated across weighted categories:

- **Base Security** (25%): attack surface and classic security factors
- **AI-Specific Risk** (45%): model behavior, sensitivity, and criticality
- **Impact Assessment** (30%): confidentiality, integrity, availability, and safety impact

### Trust Score Impact

Example from the UI (low-risk agent):

```
Base Security:    0.00 / 0.25
AI-Specific:      0.05 / 0.45
Impact:           0.00 / 0.30
Risk Profile Score: 98 / 100

Trust Score Calculation:
  Risk Profile:   98 × 40% = 39.2
  Behavioral (Initial):  100 × 35% = 35.0
  Alignment (Initial):   100 × 25% = 25.0
  ─────────────────────────────────
  Trust Score:            99.2 → TIER 1
```

New agents start with 100% behavioral and alignment scores. Trust tier may decrease based on runtime violations and goal drift.

### Assessment History

Timeline of Risk Profile changes with:
- Change date
- Previous vs. new values
- Change reason
- User who made the change

### Trust Score History

A line chart of trust score over time with selectable ranges (for example 7d, 30d, 90d, 1y).

Tier threshold overlays help show when an agent moves between tiers.

### Events Affecting Trust Score

A table of score-impacting events, such as:

- Clean-week milestones
- Policy violations
- Tier promotions or demotions

Each row includes timestamp, event type, impact direction, and score delta.

## Re-Assessment

Trigger a re-assessment when:

- Agent capabilities change (new data sources, APIs)
- Business context shifts (more critical role)
- Compliance requirements change
- After significant incidents

Click **Re-assess Risk** to update Risk Profile parameters.

## Next Phase

Once you've assessed your agent's risk profile:

→ **[Authorize](/trust-lifecycle/authorize)** - Configure guardrails, policies, and behavioral rules to control what your agent can do
