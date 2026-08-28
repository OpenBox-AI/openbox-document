---
title: Run Receipt
description: "Share one run's routing evidence as a page a customer can open — which provider served each prompt, in which region, and whether the routing held."
llms_description: Shareable per-session routing evidence
sidebar_position: 2
tags:
  - compliance
  - audit
  - session
  - openrouter
---

# Run Receipt

A run receipt is one session's routing evidence gathered into a single page. The [Routing Integrity](/dashboard/routing-integrity) panel aggregates across every call an agent has made; a receipt is the opposite view — one run, in full, shareable with someone who has no OpenBox account.

Access via **Agent Detail → Verify → Run Receipt**, or the same panel in [Session Replay](/trust-lifecycle/session-replay).

## What It Reports

| Field | Meaning |
|-------|---------|
| **Model calls** | How many governed model calls the run made |
| **Served by** | The upstream providers that actually served them |
| **Region** | Where the data was processed |
| **Sealed records** | How many entries the session's sealed record covers |
| **Verdicts** | Whether the allowlist held, whether any model was substituted, whether any call ran outside the approved regions |

Each model call keeps the **generation ID** OpenRouter recorded it under. That is the part of a receipt that does not depend on trusting OpenBox: the reader can fetch the same record from the gateway themselves.

## Sharing It

Use **Copy share link**. The link goes straight to your clipboard rather than onto the screen — it is long, opaque and a credential, so displaying it invites mis-selection and leaves it readable to anyone nearby.

| Property | Behaviour |
|----------|-----------|
| **Authentication** | None. The token in the link is the only credential, so a session ID alone grants nothing. |
| **Expiry** | Seven days by default. |
| **Revocation** | Individual links cannot be revoked. Rotating the signing secret revokes all outstanding links at once, so keep the outgoing value as the previous secret to stage a rollover. |

### What a shared page withholds

A proof page is a public URL, so the default is to withhold rather than to publish.

| Withheld | Why |
|----------|-----|
| Cost, upstream cost, token counts, per-attempt latencies | They say nothing about routing integrity and plenty about your business. |
| Session and agent identifiers | Internal handles. The session ID is the handle the receipt is fetched by. |

Prompt and completion content is not on that list because it is never in the record at all. Routing provenance carries no message bodies, which is what makes a public page possible in the first place.

### What it keeps

Who served each call, in which region, whether the promise held, which model answered, and the gateway generation IDs. The page states what was withheld, because a reader who is not told cannot tell a redaction from an absence.

## What a Receipt Does and Does Not Prove

Worth being exact, because the distinction is the whole value of the document.

| | |
|---|---|
| **It reports** | What OpenBox recorded at the time each call happened, sealed with the rest of the run when the session closed. |
| **It does not prove** | That OpenBox recorded it correctly. A reader takes the sealed record on trust. |
| **What needs no trust** | Each individual routing claim. The generation IDs are OpenRouter's own, and re-checking one at the gateway involves us not at all. |

So a receipt is a convenient, attributable summary whose underlying facts are independently checkable at source. It is not a self-proving document, and the page does not present itself as one.

## A Refused Run Has a Receipt Too

Often the most useful one. When a policy or the gateway refuses a call, there is no routing provenance — and the receipt attests exactly that: no model call completed, nothing was served. That is the allowlist working, and it is the document you want when someone asks what happened.

## Related Pages

- **[Proof of Routing](/core-concepts/proof-of-routing)** - Where the sealed record comes from
- **[Routing Integrity](/dashboard/routing-integrity)** - The whole-agent view over every attested call
- **[Verify](/trust-lifecycle/verify)** - The lifecycle phase this panel belongs to
- **[Session Replay](/trust-lifecycle/session-replay)** - Inspect one governed session step by step
