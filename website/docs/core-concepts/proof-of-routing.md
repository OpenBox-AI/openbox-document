---
title: Proof of Routing
description: "Record which provider served each prompt, in which region, at what cost — sealed with the session and re-checkable at the gateway."
llms_description: Attested routing evidence for gateway-routed model calls
tags:
  - governance
  - cryptography
  - compliance
  - observability
  - openrouter
---

# Proof of Routing

Proof of Routing answers a question that gateway-routed agents cannot normally answer: **where did this prompt actually go?** It records the provider that served every model call, the region it ran in, what it cost, and whether the routing matched what was asked for — sealed into the session's attestation as it happens, and keyed to the gateway's own receipt number so any claim can be re-checked at source.

It is a platform concept scoped to agents on the [OpenRouter](/getting-started/openrouter) framework. It does not replace policy enforcement, guardrails, or session telemetry. It adds a provenance layer over the one decision those cannot see: which upstream provider a gateway picked, after the request left your process.

## The Problem It Solves

OpenRouter makes its users two promises that pull against each other:

| Promise | What it means |
|---------|---------------|
| **Trust** | Prompts only go to the models and providers you choose. |
| **Reliability** | 80+ providers, with automatic failover when one is down. |

The second is why the first cannot be checked. The provider serving any single call is chosen at request time, per call, and **never appears in the response**. So if you have told your own customers that their data stays with one provider, or stays in one region, you have no way to show it happened.

The same blind spot covers the model. You ask for one model, a different one can answer — because you listed a fallback, or because the router chose for you — and the call still looks perfectly successful.

## What Proof of Routing Answers

- Which upstream provider served this prompt?
- In which region was the data processed, and was that region approved?
- Did the call stay inside the provider allowlist the request named?
- Did the model that answered match the model that was asked for?
- What did each call cost, and what did the calls that broke a promise cost?
- Which providers failed, and how slow was each attempt?
- Can I hand a customer proof of all of the above without them trusting OpenBox?

## Concept Model

| Concept | Description |
|---------|-------------|
| **Routing decision** | Where a policy will permit this prompt to go, decided **before** the request is built. An act of governance — something a rule can be written about. |
| **Routing record** | What the gateway then did, read back **after** the answer. Evidence, not an action, so it is stored and sealed but never shown as a step the agent took. |
| **Provider allowlist** | The providers a request will accept, expressed as OpenRouter's `provider.only`. Enforceable: the gateway refuses rather than falling back outside it. |
| **Approved regions** | The regions a prompt may be processed in, stated by [policy](/developer-guide/openrouter/routing-policies). Observable but not enforceable — no request field steers where a call lands. |
| **Generation ID** | OpenRouter's own receipt number for a call, kept so any claim can be re-checked at the gateway. |
| **Run receipt** | One session's routing evidence gathered into a shareable page. See [Run Receipt](/trust-lifecycle/run-receipt). |

Keeping *decision* and *record* apart matters in practice. They are different acts at different times, and naming them the same made one call read as though it had happened twice.

## How OpenBox Builds the Record

OpenRouter publishes the answer per call at `GET /api/v1/generation?id=<gen-id>`: the provider that served it, the region, the cost, whether your own key was used, and the failover attempts that preceded it. Almost nobody reads it.

The [OpenRouter SDK](/developer-guide/openrouter/sdk-reference) reads it for every governed model call and records it as span attributes. Attributes are what OpenBox Core hashes into the session's Merkle tree, so the record lands **inside the session's attestation** rather than beside it.

| Stage | What happens |
|-------|--------------|
| **Before the call** | The routing the request will use is stated on the call itself, so a policy can refuse or narrow it while that still changes the outcome. |
| **The call** | The SDK writes the policy's allowlist into the outgoing request, so the gateway fails closed instead of falling back to a provider you did not approve. |
| **After the answer** | The generation record is fetched in the background, compared against what was asked for, and sealed under the session root before the session closes. |

Collection never delays an answer. The generation record is written shortly after the response, so a lookup at the moment of completion returns nothing; the SDK retries with backoff and drains before the session closes. A run whose last turn finishes instantly may take a few extra seconds to close.

## Three Things It Adds

A gateway alone can report what it did. Reading that report at the time, and sealing it with the run, is what makes the next three possible.

| | What it means |
|---|---|
| **Enforce** | A policy names the providers you trust, and the SDK writes that list into the request. If none of them can serve the call, it fails closed — which is the point — and says why in plain words rather than leaking a gateway error. |
| **Attest** | The record goes into the session's Merkle tree and under its signed root, so it cannot be quietly edited after the fact — the figures a panel shows are the ones sealed when the call ran, not a summary recomputed later. |
| **Check** | What was requested travels alongside what the gateway did, so anyone can put the two side by side — and every call keeps the gateway's generation ID, so the underlying facts can be confirmed at OpenRouter rather than taken from us. |

## What Can Be Enforced, and What Only Observed

The two constraints are not equally strong, and the difference is worth stating plainly before you rely on either.

| Constraint | Strength | Why |
|------------|----------|-----|
| **Provider allowlist** | Enforced, pre-flight | `provider.only` travels in the request. A disjoint policy fails the call closed before the prompt is sent. |
| **Model** | Checked, near-total coverage | Nearly every request names a concrete model, so the comparison can be made on almost all traffic. |
| **Approved regions** | Observed, one call late | Nothing in a request steers where a call lands. A breach lands on the record afterwards, which a policy refuses the *next* call on and halts the session. |

A prompt already sent cannot be unsent. Halting a session on the call after a breach is the right behaviour when a router silently fails over, but it is not a gate, and the dashboard says so on the screen rather than in a footnote.

## How Coverage Is Counted

Every figure in Proof of Routing distinguishes *kept* from *nothing to keep*. A rate over traffic that promised nothing means nothing at all, so:

| Rule | Consequence |
|------|-------------|
| An unconstrained call is not a pass | Calls that named no allowlist are excluded from the honored rate, not counted as successes. |
| A rate is `null` over an empty denominator | Never 100%. |
| An unreported region is `unchecked` | Never approved. |
| An unpriced call is a hole in the evidence | Never $0. |
| `openrouter/auto` is `unchecked` | Never a passing model check — choosing the model is the point there. |

Coverage is therefore read **before** any rate: it says how much of the traffic the rate speaks for.

## What Proof of Routing Is Not

| It Is | It Is Not |
|-------|-----------|
| A record of which provider served each prompt, sealed under the session root | A replacement for OpenRouter's own dashboard or billing |
| Pre-flight enforcement of a provider allowlist | A guarantee about where a call is geographically processed |
| Evidence a customer can re-check at the gateway | A claim that OpenBox is the source of truth — the gateway is |
| Scoped to agents registered on the OpenRouter framework | A general-purpose LLM cost or latency monitor |
| A comparison of requested versus actual routing | A replacement for [Policies](/trust-lifecycle/authorize/policies) or [Guardrails](/trust-lifecycle/authorize/guardrails) |

## Related Pages

- **[Getting Started with OpenRouter](/getting-started/openrouter)** - Add governance to an OpenRouter agent
- **[Routing Integrity](/dashboard/routing-integrity)** - The dashboard view over every attested call
- **[Run Receipt](/trust-lifecycle/run-receipt)** - Hand one session's evidence to a customer or auditor
- **[Routing Policies](/developer-guide/openrouter/routing-policies)** - Constrain providers and approve regions
- **[Routing Attributes](/developer-guide/openrouter/routing-attributes)** - Every field the record carries
