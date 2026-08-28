---
title: Run Receipt
description: "Hand a customer or auditor one signed document that proves where a run's prompts went — verifiable offline, without trusting OpenBox."
llms_description: Signed, offline-verifiable evidence for one governed session
sidebar_position: 2
tags:
  - cryptography
  - compliance
  - audit
  - session
  - openrouter
---

# Run Receipt

A run receipt is one session's evidence as a signed, self-contained document. Everything else in OpenBox proves something to *you*, inside a dashboard you have to be logged into. A receipt proves it to whoever you hand it to.

It is checkable with `openbox-verify` and no network access — no OpenBox, no gateway, no account. That is the requirement, not an optimisation: a verifier that must reach the issuer at check time can be denied, delayed or lied to at exactly the moment its answer matters, and an auditor cannot accept an answer that depends on the audited party being cooperative.

Access via **Agent Detail → Verify → Run Receipt**, or the same panel in [Session Replay](/trust-lifecycle/session-replay).

## What a Receipt Contains

| Part | What it is |
|------|------------|
| **Attestation** | The signed session root, the signature, the algorithm, and the fingerprint of the key that signed it. |
| **Leaves** | Every sealed record in the session, each with the verbatim bytes its hash was taken over and its proof to the root. |
| **Claims** | The human-readable projection of those bytes — served by, region, cost, allowlist, model, and so on. |
| **Summary** | What the leaves add up to, plus the gateway generation IDs so a reader can re-check every claim at source. |

## The Three Checks

A verifier checks three things independently, and **which one fails is the diagnostic**. A receipt that fails one is reported as failing that one, never as simply "invalid".

| Check | What it establishes | What it catches |
|-------|--------------------|-----------------|
| **Each leaf's bytes hash to its stated hash** | The readable claim is bound to the sealed record | A claim edited in the document while the sealed bytes stayed honest |
| **Each hash walks its proof to the session root** | The record belongs to the tree that root commits to | A call removed to make a session look clean |
| **The root carries a valid signature from a published key** | The root itself is not forged | A receipt re-signed under a key nobody published |

The summary is recomputed from the leaves too, so a summary rewritten over honest leaves does not pass.

## Verifying a Receipt

`openbox-verify` ships with OpenBox Core and is built from it:

```bash
go build -o openbox-verify ./cmd/openbox-verify
```

Download the receipt from the panel, then:

```bash
openbox-verify receipt.json
```

Checked against the key set OpenBox publishes, which is the stronger form:

```bash
openbox-verify --keys openbox-keys.json receipt.json
```

A passing receipt reports what it attests:

```text
VALID

session   fcdc9652-4a87-496c-a284-a4a005a3705e
leaves    21 sealed, 21 rehashed from their own bytes, 21 proved to the root
signature ECDSA_P256_SHA256 under key obx-f6b8fe0d1d26f56d

2 model call(s)
  served by        Azure
  region           global
  allowlist        every constrained call kept it
  model            every checkable call ran what it asked for
  cost             $0.000088

re-check any claim at the gateway, without trusting this document:
  GET https://openrouter.ai/api/v1/generation?id=gen-1787916416-4vIAwExqIhhRsy9HwJMI
```

Exit status is the answer, so it composes in CI:

| Status | Meaning |
|--------|---------|
| `0` | Verified |
| `1` | A check failed |
| `2` | The receipt could not be read at all |

### Why `--keys` matters

A receipt carries the public key it was signed with. That makes it self-consistent, not trustworthy: anyone who can rewrite the root can rewrite the key beside it. Without `--keys` the signature still verifies and the report carries a caveat saying so — it proves the document is internally consistent, not that OpenBox signed it.

The key set is served at `GET /.well-known/openbox-keys.json`. Fetch it once, out of band, and verification is offline forever afterwards:

```bash
curl -o openbox-keys.json https://<your-openbox-host>/.well-known/openbox-keys.json
```

Keys are named by a fingerprint of the key material rather than by the cloud identifier they are stored under, so a receipt and the key set join on the same name without either publishing where the key lives. A verifier holding the public key can recompute that fingerprint, so a key cannot be pointed at a different one by relabelling.

## When a Receipt Cannot Prove Anything

Two cases where the panel and the verifier both refuse to overstate what they have.

| Case | What is reported |
|------|------------------|
| **Signed with a shared secret** | A local development signer uses an HMAC. Its "public key" is a label, so nobody outside OpenBox can check it — reported as *not independently verifiable*, never with a tick. It is not a receipt to hand out, and sharing is disabled for it. |
| **Signed before the algorithm was recorded** | Older attestations did not record which algorithm signed them. Nothing tells a verifier how to check the signature, so it is reported as unverifiable — a gap in what was written down, not a sign the run was signed weakly. |

Sessions sealed before OpenBox began recording the exact bytes behind each hash keep their hash and proof, so they still prove membership of the signed tree, but their claims cannot be tied back to those hashes. Such leaves are reported as **not reconstructible**, and any count over them reads as *not determinable* rather than as zero.

## A Refused Run Has a Receipt Too

The most useful receipt is often the one for a run that never reached a provider. When a policy or the gateway refuses a call, there is no routing provenance — and the receipt attests exactly that: no model call completed, nothing was served. That is the allowlist working, and it is the document you want when someone asks what happened.

## Public Proof Pages

A receipt can also be shared as a page, for a reader who has no OpenBox account and no reason to trust OpenBox.

Use **Copy share link** on the receipt panel. The link is copied straight to your clipboard rather than displayed: it is long, opaque and a credential, so putting it on screen invites mis-selection and leaves it readable to anyone near you.

| Property | Behaviour |
|----------|-----------|
| **Authentication** | None. The token in the link is the only credential, so a session ID alone grants nothing. |
| **Expiry** | Seven days by default. |
| **Revocation** | Individual links cannot be revoked. Rotating the signing secret revokes all outstanding links at once. |
| **Unverifiable receipts** | Cannot be shared at all — a public link to evidence nobody can check looks like proof and is not. |

### What a public page withholds

A proof page is a public URL, so the default is to withhold rather than to publish.

| Withheld | Why |
|----------|-----|
| Cost, upstream cost, token counts, per-attempt latencies | They say nothing about routing integrity and plenty about your business. |
| The sealed bytes of any leaf carrying those claims | A leaf's bytes are the whole attribute document, so publishing them would hand back exactly what was withheld. Those leaves keep their hash and proof and verify as membership only. |
| Session and agent identifiers | Internal handles. The session ID is the handle the receipt is fetched by. |
| The signing key's identifier | Named nowhere on the page: a reader receives the key from whoever sent them the receipt. |

Prompt and completion content is not on that list because it is never in the record at all. Routing provenance carries no message bodies, which is what makes a public page possible in the first place.

### What it keeps

Who served each call, in which region, whether the promise held, which model answered, and the gateway generation IDs — so the reader can re-check every claim at OpenRouter directly. The page states what was withheld, because a reader who is not told cannot tell a redaction from an absence.

## Related Pages

- **[Proof of Routing](/core-concepts/proof-of-routing)** - Where the sealed record comes from
- **[Routing Integrity](/dashboard/routing-integrity)** - The whole-agent view over every attested call
- **[Verify](/trust-lifecycle/verify)** - The lifecycle phase this panel belongs to
- **[Session Replay](/trust-lifecycle/session-replay)** - Inspect one governed session step by step
