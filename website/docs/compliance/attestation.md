---
title: Attestation
description: Cryptographic proof of agent behavior
sidebar_position: 1
---

# Attestation

Attestation provides cryptographic, tamper-proof evidence of agent behavior. Use it for audits, legal evidence, and compliance verification.

## How It Works

Every session generates cryptographic proofs:

```
Session Events
     │
     ▼
┌─────────────────┐
│ Event Hashing   │  SHA-256 hash of each event
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Merkle Tree     │  Build tree of event hashes
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Root Signing    │  ECDSA signature on Merkle root
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Timestamping    │  RFC 3161 timestamp authority
└─────────────────┘
     │
     ▼
  Proof Certificate
```

## Proof Certificate

Each session's proof certificate contains:

```json
{
  "session_id": "ses_a1b2c3d4e5f6",
  "agent_id": "did:openbox:agent:xyz123",
  "organization_id": "org_abc789",

  "timeline": {
    "started_at": "2024-01-15T09:14:32.001Z",
    "completed_at": "2024-01-15T09:14:47.892Z",
    "event_count": 24
  },

  "integrity": {
    "merkle_root": "sha256:8a7b9c3d2e1f...",
    "algorithm": "SHA-256",
    "signature": "ecdsa:MIGkAgEBBDC...",
    "signer": "did:openbox:signer:prod-001"
  },

  "timestamp": {
    "authority": "timestamp.openbox.ai",
    "timestamp": "2024-01-15T09:14:48.000Z",
    "token": "MIIRvDADAgEA..."
  },

  "verification_url": "https://verify.openbox.ai/ses_a1b2c3d4e5f6"
}
```

## Viewing Attestations

### In Agent Detail

1. Go to **Agent Detail → Verify → Execution Evidence**
2. Select a session
3. Click **View Proof**

### In Session Replay

1. Open Session Replay
2. Click **Attestation** tab
3. View or download proof

## Verification

### Online Verification

Visit the verification URL:

```
https://verify.openbox.ai/ses_a1b2c3d4e5f6
```

Shows:
- Session details
- Integrity status
- Timestamp verification
- Event hash tree

### Offline Verification

Download the proof certificate and verify locally using the OpenBox CLI.

## Components

### Event Hashes

Each event is hashed independently:

```
Event → Canonical JSON → SHA-256 → Hash
```

Events include:
- Timestamp
- Event type
- Operation details
- Governance decision
- Actor information

### Merkle Tree

Events are organized into a Merkle tree:

```
                    Root Hash
                   /          \
            Hash(1,2)        Hash(3,4)
           /      \          /      \
      Hash(1)  Hash(2)  Hash(3)  Hash(4)
         │        │        │        │
      Event 1  Event 2  Event 3  Event 4
```

This allows:
- Efficient verification
- Inclusion proofs for specific events
- Tamper detection

### Signature

The Merkle root is signed with:
- Algorithm: ECDSA P-256
- Key: Hardware Security Module (HSM)
- Certificate: Public key certificate chain

### Timestamp

Timestamping provides:
- Proof of existence at specific time
- Third-party trust anchor
- Legal admissibility

## Use Cases

### Audit Evidence

Provide auditors with verifiable proof:

1. Export proof certificates for audit period
2. Auditor verifies signatures and timestamps
3. Tamper-free evidence of agent behavior

### Legal Disputes

For legal proceedings:

1. Export session proof
2. Third-party can verify authenticity
3. Timestamp proves when actions occurred

### Incident Investigation

Post-incident:

1. Retrieve session attestation
2. Verify integrity wasn't compromised
3. Trust event timeline accuracy

### Audit Evidence

Include attestation references in audit evidence:

- Link to verification URLs
- Attach proof certificates
- Reference Merkle roots

## Retention

| Plan | Attestation Retention |
|------|----------------------|
| Free | 30 days |
| Team | 1 year |
| Enterprise | Configurable (up to 7 years) |

## Export

### Single Session

1. Open session
2. Click **Export Proof**
3. Download JSON or PDF

### Bulk Export

1. Go to **Compliance → Attestation**
2. Select date range
3. Click **Export All**
4. Download ZIP archive

### Scheduled Export

Enterprise feature:

1. Configure export destination (S3, GCS)
2. Set schedule
3. Proofs automatically exported

## Next Steps

1. **[View Audit Log](/docs/organization/audit-log)** - See all organization activity alongside attestations
