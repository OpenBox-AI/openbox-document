---
title: Agent Compliance
description: "Track per-agent regulatory compliance: control coverage across the EU AI Act, ISO/IEC 42001, and NIST AI RMF, with evidence exports and findings."
llms_description: Per-agent regulatory compliance posture
sidebar_position: 4
tags:
  - compliance
  - agent-management
  - audit
---

# Agent Compliance

The **Compliance** tab on an agent's detail page shows that agent's regulatory posture and the evidence behind it. For organization-wide compliance, see [Compliance & Audit](/administration/compliance-and-audit).

The tab has four sub-tabs: **Overview**, **Evidence exports**, **Findings**, and **History**.

## Framework coverage

Each agent's controls are mapped to three frameworks:

| Framework | Requirement unit |
|-----------|------------------|
| **EU AI Act** | obligations |
| **ISO/IEC 42001** | controls |
| **NIST AI RMF** | outcomes |

For each framework the Overview reports a **posture score**, **Covered / Partial / Failing** counts, and the number of **mapped requirements**. Aggregated across frameworks it shows an overall **agent posture %** and a **posture trend** over **7d / 30d / 90d / 1y**.

## Findings

Open findings are grouped by severity — **Critical / High / Medium / Low**. A **Top remediation** list ranks actions by their score impact (e.g. "remediate failing resources for EU AI Act Art. 10"). A **requirement status grid** shows **Covered / Partial / Failing / N/A** per framework.

## Actions

| Action | Description |
|--------|-------------|
| **Export evidence pack** | Generate a downloadable evidence bundle for the agent's mapped requirements. |
| **Re-evaluate** | Re-run the compliance evaluator. The evaluator version is shown (e.g. `2026.05.01-v1`). |

Recent activity logs attestations, exports, and signal changes.

## Related

- **[Compliance & Audit](/administration/compliance-and-audit)** - Organization-wide compliance and audit evidence
- **[Attestation & Cryptographic Proof](/administration/attestation-and-cryptographic-proof)** - The cryptographic basis for evidence
