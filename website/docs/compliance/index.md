---
title: Compliance
description: Security, attestation, and compliance frameworks
sidebar_position: 9
---

# Compliance

OpenBox provides built-in support for security and compliance requirements. Generate audit evidence and cryptographic attestations.

## Overview

| Capability | Description |
|------------|-------------|
| **Cryptographic Attestation** | Tamper-proof evidence of agent behavior |
| **Audit Trails** | Complete history of all actions |
| **Evidence Export** | Export evidence for auditors |

## Key Features

### Immutable Audit Trail

Every agent action is logged with:

- Timestamp (RFC 3161 timestamping)
- Actor identification
- Action details
- Governance decision
- Cryptographic signature

### Automated Evidence Collection

OpenBox automatically collects evidence for:

- Access control enforcement
- Policy evaluation records
- Approval workflows
- Trust score changes
- Incident responses

### Evidence Export

Export evidence on-demand:

1. Go to **Audit Log** or **Attestation**
2. Choose date range
3. Export evidence

Export formats:

- CSV
- JSON

## Attestation

Cryptographic proof of agent behavior. See [Attestation](/docs/compliance/attestation) for details.

## Compliance Dashboard

The compliance dashboard shows:

### Control Status

View overall evidence coverage and readiness signals.

### Evidence Gaps

Identifies missing evidence:

- Policies not reviewed in 90+ days
- Agents without risk assessments
- Incomplete audit trails

### Upcoming Audits

Track audit schedule and preparation status.

## Best Practices

1. **Regular reviews** - Review policies quarterly
2. **Document changes** - Add comments to all configuration changes
3. **Test controls** - Validate governance works as expected
4. **Export regularly** - Maintain off-platform backups
5. **Train approvers** - Ensure HITL reviewers understand requirements

## Next Steps

1. **[Set Up Attestation](/docs/compliance/attestation)** - Enable cryptographic proof of agent behavior
2. **[View Audit Log](/docs/organization/audit-log)** - Export organization activity logs for auditors
