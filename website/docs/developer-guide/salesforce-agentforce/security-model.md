---
title: Security Model
description: "The OpenBox for Salesforce Agentforce security model: governed writes as the only path, fail-closed callouts, certificate-based workload identity, secrets handling, replay safety and the event outbox."
llms_description: Agentforce SDK trust boundary and workload identity
sidebar_position: 4
tags:
  - salesforce
  - compliance
---

# Security Model

- **The governed write is the only path.** The agent user holds a guarded field
  read-only, and a trigger calling `OpenBoxFieldGuard` rejects any change that
  a governed write has not authorized for that record and field. Agent
  instructions are not relied on.
- **Both systems must agree.** An OpenBox `allow` is followed by Salesforce
  checks for the requesting user: entitlement, object edit, field read and
  record edit access.
- **Fails closed.** Unreachable OpenBox, timeouts, non-2xx answers, malformed
  bodies, unknown verdicts and identity failures all mean no write. Gateway
  errors are retried once with the same idempotency key.
- **Secrets.** The API key lives in the External Credential, encrypted and
  injected at callout time. The signing key never leaves the Salesforce
  certificate store. Neither is logged or kept in source.
- **Workload identity.** Salesforce proves who it is with a
  certificate-signed assertion, exchanged for a short-lived workload token.
  Apex trusts only the issuer pinned in `Identity_Issuer__c`.
- **Replay safety.** A request executes only from `Pending_Approval`, under
  `FOR UPDATE`, and leaves that status in the same transaction: at most one
  committed change per request.
- **Staleness.** If the record changed while the request waited, it is refused
  as `Stale`.

## Workload identity

Salesforce proves who it is without a shared secret leaving the org.
`workload-certificate.mjs` generates the certificate `OpenBox_Workload` inside
Salesforce, and only its public key is registered with OpenBox.

```mermaid
sequenceDiagram
  autonumber
  participant Apex as OpenBoxWorkloadIdentity
  participant Cert as Certificate OpenBox_Workload
  participant Core as OpenBox Core
  participant IdP as OpenBox Identity

  Apex->>Core: GET /api/v3/auth/bootstrap (API key via Named Credential)
  Core-->>Apex: client_id, issuer, token_endpoint, kid
  Apex->>Apex: Refuse unless the issuer matches the pinned issuer
  Apex->>Cert: Sign an RS256 assertion (iss = sub = client_id, 60 s)
  Cert-->>Apex: Signature (the private key never leaves Salesforce)
  Apex->>IdP: POST token_endpoint (client_credentials, jwt-bearer)
  IdP-->>Apex: Workload token (5 min)
  Apex->>Core: evaluate, with the API key and X-OpenBox-Workload-Token
```

## Events after the write

Apex cannot make a callout after DML in the same transaction, so events that
report a completed write wait in an outbox (`OpenBox_Event_Outbox__c`) and are
delivered in order.

```mermaid
sequenceDiagram
  autonumber
  participant Apex as Commit phase
  participant DB as Salesforce database
  participant Disp as OpenBoxOutboxDispatcher
  participant Core as OpenBox Core

  Apex->>DB: Update the record and insert outbox rows (one transaction)
  Disp->>DB: Read queued rows in sequence order
  Disp->>Core: UPDATE span completed, ActivityCompleted, WorkflowCompleted
  alt delivered
    Disp->>DB: Mark sent
  else OpenBox unavailable
    Disp->>DB: Keep queued, retry later
  end
```

- **Commit together.** The write and its outbox rows are one transaction, so
  every committed write has its events queued. The decision that allowed the
  write was made before any DML.
- **In order.** Events of one request (or, for conversation events, of one
  conversation) are sent strictly in sequence. A failing event holds back the
  ones after it.
- **Bounded retries.** An event that fails `Outbox_Max_Attempts__c` times is
  marked `Failed`, so the events after it can still close the run in OpenBox.
- **After a halt.** OpenBox answers events for a session it already closed with
  a halt; those rows are marked `Rejected`.
- **Never undone.** An output guardrail failure reported on a completed write
  goes to the audit trail. The write it describes has already happened and is
  not rolled back.
