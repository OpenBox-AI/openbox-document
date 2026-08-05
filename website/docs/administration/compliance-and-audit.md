---
title: "Compliance & Audit"
description: "Map governance activity to EU AI Act, ISO/IEC 42001, and NIST AI RMF compliance postures, backed by cryptographic proof and an immutable audit trail."
llms_description: Compliance tooling and audit support
sidebar_position: 9
tags:
  - compliance
  - audit
  - governance
---

# Compliance & Audit

## Overview

OpenBox records all AI agent governance decisions in an immutable audit trail. The platform collects evidence from governance workflows, maps it to the posture and evidence requirements of major AI compliance frameworks (see [Compliance Framework Mapping](#compliance-framework-mapping)), and supports on-demand audit log export.

---

## Immutable Audit Trail

OpenBox records every governance decision with full context. Records cannot be modified after creation.

### Governance Events

Each time OpenBox evaluates an agent session, it records a governance event containing:

| Data Point | Description |
|------------|-------------|
| **Timestamp** | UTC timestamp of the event |
| **Agent** | The agent that triggered the governance evaluation |
| **Event Type** | The type of governance event |
| **Verdict** | Decision issued: ALLOW, <mark className="diff-mark">CONSTRAIN,</mark> BLOCK, HALT, or REQUIRE_APPROVAL |
| **Reason** | Explanation for the verdict |
| **Workflow/Run ID** | Identifiers for tracing the governance workflow execution |
| **Approval Metadata** | Who approved/denied, when, and expiration (for approval workflows) |

### Trust Score History

OpenBox records every change to an agent's trust score:

| Data Point | Description |
|------------|-------------|
| **Trust Score** | Score after the change |
| **Previous Score** | Score before the change |
| **Trust Tier / Previous Tier** | Tier before and after the change |
| **Change Type** | What triggered the change (e.g., tier promotion, violation) |
| **Change Reason** | Explanation for the change |
| **Evaluated By** | System or user that triggered the evaluation |

### Cryptographic Attestation

Each session's governance events are cryptographically signed, producing a tamper-proof proof certificate. See [Attestation & Cryptographic Proof](./attestation-and-cryptographic-proof.md) for details.

<mark className="diff-mark">For designated operations, the [Proof Engine](/trust-lifecycle/proof-engine) adds a second, independently signed record of the actual Executor request/response alongside the governance decision. Evidence packs for those operations can cite both records, not just the decision.</mark>

---

## Compliance Framework Mapping

:::info Gated
Framework-specific compliance mapping is a gated feature. Contact OpenBox to enable it for your organization.
:::

Every evidence pack below rests on the same Merkle-sealed sessions produced during [Verify](/trust-lifecycle/verify): auditors check the proof, not your word, backed by the [organization-wide audit log](#organization-audit-log). OpenBox maps that underlying governance activity to the posture and evidence expectations of three frameworks:

### EU AI Act

Governance activity (guardrail enforcement, policy decisions, approval workflows, trust-tier changes) is continuously mapped to EU AI Act regulatory posture, so you can see where your agents stand against the Act's requirements as governance evolves, rather than reconstructing posture by hand at audit time.

### ISO/IEC 42001

For AI management-system audits, OpenBox turns the same governance events, trust score history, and cryptographic attestations already recorded in your audit trail into repeatable evidence collection aligned to ISO/IEC 42001's management-system requirements.

### NIST AI RMF

OpenBox exports signed evidence packs and attestations aligned to the NIST AI RMF risk framework. Each pack is built from Merkle-sealed session proof and the organization audit log, and is exportable for any internal or external review.

---

## Organization Audit Log

The organization audit log tracks administrative and operational events across your organization.

### Event Types

| Event Type | Description |
|------------|-------------|
| Policy Change | OPA policy created, updated, or deleted |
| Guardrail Change | Guardrail configuration modified |
| Agent Session | Agent session lifecycle events |
| Risk Configuration Change | Risk profile updated |
| Goal Alignment Change | Goal alignment settings changed |
| Role Change | User role assignments modified |
| Security Event | Security-related actions |
| Settings Update | Organization settings modified |
| Team Management | Team created, updated, or deleted |
| Member Management | Member invited, removed, or role changed |
| Invitation | Invitation sent or accepted |

### Result Types

Each audit log entry includes a result indicating the outcome:

**success** | **failed** | **denied** | **warning** | **approved** | **allowed**

### Filtering

You can filter audit log entries by:

- **Date range**: start and end date
- **Event type**: filter by specific event type
- **Actor**: filter by user
- **Result**: filter by result type
- **Search**: free text search

### Accessing the Audit Log

Navigate to **Organization Settings** > **Audit Log** to view, search, and export events.

---

## Audit Log Export

Export is **on-demand** via the export modal in the Audit Log UI.

### How to Export

1. Open **Organization Settings** > **Audit Log**
2. Click **Export**
3. Enter an export name
4. Select time range (presets: 24h, 7d, 30d, this month, or custom date range)
5. Select event types to include
6. Click **Queue Export**

OpenBox processes exports in the background and makes them available for download once complete.

### Supported Formats

| Format | Description |
|--------|-------------|
| **CSV** | Comma-separated values for spreadsheet tools |
| **Excel** | Native Excel workbook format |

---

## Best Practices

Guidance for maintaining compliance readiness:

1. **Quarterly Reviews**: Review governance policies and behavioral rules quarterly to ensure they reflect current risk posture
2. **Change Documentation**: Document the rationale when modifying policies, behavioral rules, or guardrail configurations
3. **Control Validation**: Periodically test that governance controls produce expected verdicts for known-good and known-bad inputs
4. **Evidence Backups**: Export audit logs regularly and store them in your organization's document management system
5. **Team Training**: Ensure team members understand how trust scores, verdicts, and approval workflows function before operating in production

## Next Steps

1. **[Attestation & Cryptographic Proof](/administration/attestation-and-cryptographic-proof)** - Learn how session events are cryptographically signed
2. **[Audit Log](/administration/organization-audit-log)** - View and export the organization audit log

