---
title: Assess
description: Phase 1 - Establish baseline trust through risk assessment
sidebar_position: 1
---

# Assess (Phase 1)

The Assess phase establishes baseline trust by evaluating the agent's inherent risk. This is primarily configured at agent creation and can be updated as capabilities change.

Access via **Agent Detail → Assess** tab.

## AIVSS Configuration

AIVSS (AI Vulnerability Scoring System) evaluates risk across 14 dimensions grouped into categories:

### Access & Connectivity

| Dimension | Description | Low Risk | High Risk |
|-----------|-------------|----------|-----------|
| **Data Sensitivity** | What data can the agent access? | Public data only | PII, financial, health |
| **System Privileges** | What permissions does it have? | Read-only | Admin/root access |
| **External Connectivity** | Can it reach external systems? | Internal only | Public internet, APIs |
| **Network Scope** | Network access breadth | Single service | Cross-network |

### Capability & Autonomy

| Dimension | Description | Low Risk | High Risk |
|-----------|-------------|----------|-----------|
| **Autonomy Level** | How independently does it act? | Human-initiated only | Fully autonomous |
| **Decision Scope** | What can it decide? | Recommendations only | Binding decisions |
| **Action Reversibility** | Can actions be undone? | All reversible | Permanent actions |
| **Execution Speed** | How fast can it act? | Batched/slow | Real-time |

### Impact & Criticality

| Dimension | Description | Low Risk | High Risk |
|-----------|-------------|----------|-----------|
| **Business Criticality** | Importance to operations | Nice-to-have | Mission critical |
| **User Exposure** | Who is affected? | Internal teams | External customers |
| **Financial Impact** | Potential monetary effect | None | Significant |
| **Compliance Requirements** | Regulatory obligations | None | HIPAA, GDPR, SOC2 |
| **Reputation Risk** | Brand impact potential | Minimal | Significant |
| **Cascading Effects** | Downstream dependencies | Isolated | Triggers other systems |

## Risk Profiles

Pre-configured profiles simplify AIVSS setup:

| Profile | Typical AIVSS Score | Use Cases |
|---------|-------------------|-----------|
| **Level 1: Minimal** | 90-100 | Read-only tools, internal dashboards |
| **Level 2: Low** | 75-89 | Standard automation, limited writes |
| **Level 3: Medium** | 50-74 | Customer-facing, data processing |
| **Level 4: High** | 25-49 | Financial, healthcare, critical ops |

## Viewing Current Assessment

The Assess tab shows:

### Risk Profile Summary

- Current profile level
- AIVSS score breakdown by category
- Last assessment date

### Trust Score Impact

```
AIVSS Score: 72
├── Access & Connectivity: 65
├── Capability & Autonomy: 78
└── Impact & Criticality: 73

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
