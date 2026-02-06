---
title: Assess
description: Phase 1 - Establish baseline trust through risk assessment
sidebar_position: 1
---

# Assess (Phase 1)

The Assess phase establishes baseline trust by evaluating the agent's inherent risk. This is primarily configured at agent creation and can be updated as capabilities change.

Access via **Agent Detail → Assess** tab.

## AIVSS Configuration

AIVSS (AI Vulnerability Scoring System) evaluates risk across three categories:

### Categories

- **Base Security** (5 params, 25%)
- **AI-Specific** (5 params, 45%)
- **Impact** (4 params, 30%)

### Parameters

- Base Security: `attack_vector`, `attack_complexity`, `privileges_required`, `user_interaction`, `scope`
- AI-Specific: `model_robustness`, `data_sensitivity`, `ethical_impact`, `decision_criticality`, `adaptability`
- Impact: `confidentiality_impact`, `integrity_impact`, `availability_impact`, `safety_impact`

## Risk Profiles

Pre-configured profiles simplify AIVSS setup:

| Profile | Typical AIVSS Score | Use Cases |
|---------|-------------------|-----------|
| **Tier 1 (90-100): Trusted** | 90-100 | Read-only tools, internal dashboards |
| **Tier 2 (75-89): Confident** | 75-89 | Standard automation, limited writes |
| **Tier 3 (50-74): Monitor** | 50-74 | Customer-facing, data processing |
| **Tier 4 (25-49): Restrict** | 25-49 | Financial, healthcare, critical ops |

## Viewing Current Assessment

The Assess tab shows:

### Risk Profile Summary

- Current profile level
- AIVSS score breakdown by category
- Last assessment date

### Trust Score Impact

```
AIVSS Score: 72
├── Base Security: 70
├── AI-Specific: 75
└── Impact: 68

AIVSS Contribution: 72 × 40% = 28.8 points
```

### Assessment History

Timeline of AIVSS changes with:
- Change date
- Previous vs. new values
- Change reason
- User who made the change

## Re-Assessment

Trigger a re-assessment when:

- Agent capabilities change (new data sources, APIs)
- Business context shifts (more critical role)
- Compliance requirements change
- After significant incidents

Click **Re-assess Risk** to update AIVSS parameters.

## Next Phase

Once you've assessed your agent's risk profile:

→ **[Authorize](/docs/agents/trust-lifecycle/authorize)** - Configure guardrails, policies, and behavioral rules to control what your agent can do
