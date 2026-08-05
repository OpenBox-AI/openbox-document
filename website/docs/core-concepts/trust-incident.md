---
title: Trust Incident
description: "What counts as a trust incident in OpenBox: HALT decisions, critical behavioral violations, trust-tier demotions, and drift crossing into a critical band."
llms_description: The unit of significant negative governance events used by Adapt and the Identity Bridge
sidebar_position: 6
tags:
  - trust-scoring
  - governance
  - observability
---

# Trust Incident

:::tip 🆕 New page in this review
Everything on this page is new.
:::

A trust incident is a governance event significant enough to affect an agent's standing, not just its Trust Score. It's the unit [Adapt](/trust-lifecycle/adapt) uses to build violation patterns and recovery plans, and the unit the [Identity Bridge](/administration/identity-bridge) emits externally when it's connected.

## What Qualifies

| Event | Why it qualifies |
|-------|-------------------|
| **HALT decision** | The entire agent session was terminated |
| **Critical-severity behavioral violation** | A behavioral rule fired at critical severity, not minor or major |
| **Trust-tier demotion** | The agent's [Trust Tier](/core-concepts/trust-tiers) dropped a level |
| **Drift crossing into CRITICAL** | A goal-alignment drift score crossing a critical threshold (e.g., entering the CRITICAL band) commits an incident by itself; no HALT or tier change has to happen alongside it |

Ordinary ALLOW, CONSTRAIN, or single BLOCK decisions are not trust incidents on their own; a trust incident marks a governance outcome serious enough to change how the agent is treated going forward, not routine enforcement.

## Where It Shows Up

| Surface | Role |
|---------|------|
| **[Monitor](/trust-lifecycle/monitor)** | Recent Issues and drift events surface the underlying session; the session becomes a trust incident once it meets one of the criteria above |
| **[Adapt → Insights](/trust-lifecycle/adapt#insights)** | Violation Patterns and the Agent Trust Timeline are built from trust incidents |
| **[Identity Bridge](/administration/identity-bridge)** | When connected, every trust incident is emitted as a CAEP signal to your identity provider; this is the only thing the Identity Bridge acts on |

## Related

- **[Governance Decisions](/core-concepts/governance-decisions)**: The verdicts a trust incident is built from
- **[Trust Tiers](/core-concepts/trust-tiers)**: How a trust incident can move an agent between tiers
- **[Adapt](/trust-lifecycle/adapt)**: Where trust incidents become patterns and recovery plans
