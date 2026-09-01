---
title: Routing Attributes
description: "Every attribute the OpenRouter SDK seals onto a governed model call: provider, region, cost, failover trail, and the requested-versus-actual comparisons."
llms_description: Reference for sealed routing provenance attributes
sidebar_position: 5
tags:
  - reference
  - openrouter
  - policy-authoring
  - observability
---

# Routing Attributes

Routing evidence travels as **span attributes**, which is what OpenBox Core hashes into the session's Merkle tree. That is not a display choice: attributes are the only channel this record has, and they are what puts it inside the session's attestation rather than beside it.

This page is the reference for those attributes. Policies read them, the [Routing Integrity](/developer-guide/openrouter/routing-integrity) panel aggregates them, and a [run receipt](/developer-guide/openrouter/run-receipt) projects them into readable claims.

## The Two Records

The same vocabulary covers both ends of a call, so one rule can read either.

| Record | `hook_type` | When | What it is |
|--------|-------------|------|------------|
| **Routing decision** | `llm_routing_request` | Before the request is built | Where this prompt may go. A rule can refuse or narrow it. |
| **Routing record** | `llm_provenance` | After the answer | What the gateway did. Evidence, sealed and stored. |

A third type, `llm_routing`, is the routing **step** that appears only when a policy actually redirects a call.

## What the Gateway Reported

Read back from `GET /api/v1/generation?id=<gen-id>` for every governed model call.

| Attribute | Meaning |
|-----------|---------|
| `gen_ai.upstream.provider` | The provider that actually served the call |
| `gen_ai.upstream.data_region` | Where the data was processed |
| `gen_ai.upstream.is_byok` | Whether your own provider key was used |
| `gen_ai.upstream.latency_ms` | Latency of the attempt that served it |
| `gen_ai.usage.total_cost` | What the call cost |
| `gen_ai.usage.upstream_cost` | Upstream inference cost — meaningful for BYOK traffic only |
| `gen_ai.usage.tokens_prompt` · `…tokens_completion` | Token counts |
| `gen_ai.response.model` | The model that actually ran |
| `gen_ai.response.finish_reason` | How the completion ended |
| `gen_ai.generation.id` | OpenRouter's receipt number, so any claim can be re-checked at source |

`upstream_cost` is confined to BYOK on purpose. A non-BYOK call reports `0` alongside a non-zero total, because for that traffic the gateway charge **is** the cost — so a fleet-wide margin figure computed from it would read as though the gateway kept everything.

## The Failover Trail

| Attribute | Meaning |
|-----------|---------|
| `gen_ai.routing.providers_tried` | Every provider on the chain, in order |
| `gen_ai.routing.fallback_attempts` | How many attempts preceded the one that served it |
| `gen_ai.routing.attempts` | Per-attempt detail: provider, status and latency for each |
| `gen_ai.routing.allow_fallbacks` | Whether the request permitted failover |

`gen_ai.routing.attempts` is what makes the [provider reliability](/developer-guide/openrouter/routing-integrity#provider-reliability) scorecard honest. Scoring only the attempt that won would flatter every provider whose failures were quietly absorbed by failover.

## What Was Asked For

| Attribute | Meaning |
|-----------|---------|
| `openbox.routing.declared` | Whether this call named an allowlist at all |
| `openbox.routing.requested_only` | The providers the request will accept |
| `openbox.routing.requested_order` | Preference order — a preference, not a promise |
| `openbox.routing.requested_models` | The model fallback chain |
| `openbox.routing.allow_fallbacks` | Whether the call fails closed |
| `gen_ai.request.model` | The model asked for |

## The Comparisons

These are the attributes that turn a report into a check.

| Attribute | Values | Meaning |
|-----------|--------|---------|
| `openbox.routing.honored` | `true` / `false` / absent | Did an allowed provider serve it? **Absent** when the request named no allowlist — such a call is unconstrained, not a pass. |
| `openbox.model.requested` | model id | The model the request named |
| `openbox.model.honored` | `true` / `false` / absent | Did the model that ran match? **Absent** for `openrouter/auto`, where choosing the model is the point. |
| `openbox.residency.approved_regions` | list | The regions the policy approved |
| `openbox.residency.declared` | `true` / `false` | Whether this call ran under an approved-region list |
| `openbox.residency.region_honored` | `true` / `false` / absent | Did it stay inside them? **Absent** when there is no list, or no region to compare. |
| `openbox.residency.require_own_key` | `true` / `false` | Whether a customer-supplied key was required |
| `openbox.residency.own_key_honored` | `true` / `false` / absent | Whether one was used |

**Absent is not `false`.** Every comparison here is three-valued, and writing a rule against `== false` is what keeps an unconstrained or unchecked call from being reported as a violation. Writing one against `!= true` would sweep them in.

## When a Policy Redirected

Present only on calls a policy re-routed.

| Attribute | Meaning |
|-----------|---------|
| `openbox.routing.redirected_from` | What the call originally asked for |
| `openbox.routing.resolution` | Where it went instead |
| `openbox.routing.retried_from` | The refused attempt this call replaces |
| `openbox.routing.stage` | Which half of the routing step this span is |
| `openbox.routing.attempt` | Which attempt this is |

`retried_from` is what links a refused attempt to the corrected call that replaced it, so a reader can see that one call was re-routed rather than that two calls happened.

## Reading Them in a Policy

```rego
provenance := span if {
	some span in input.spans
	span.hook_type == "llm_provenance"
}

# A dishonored call: an allowlist was named, someone else served it.
dishonored if provenance.attributes["openbox.routing.honored"] == false

# NOT `!= true` — that would also match an unconstrained call, which
# promised nothing and therefore broke nothing.
```

## Identifying a Routing Span in Storage

Routing records are identified by the presence of `gen_ai.generation.id` in the attributes rather than by their span type. Core classifies these spans as `llm_provenance` now, but rows written before that classifier shipped carry whatever it computed at the time, and reclassification is not retroactive. The attribute is the one thing true of every such row, past and future.

## Related Pages

- **[Routing Policies](/developer-guide/openrouter/routing-policies)** - Rules written against these attributes
- **[Routing Integrity](/developer-guide/openrouter/routing-integrity)** - The panel that aggregates them
- **[Run Receipt](/developer-guide/openrouter/run-receipt)** - How they become readable claims in a signed document
- **[Event Types](/developer-guide/event-types)** - The wider event vocabulary
