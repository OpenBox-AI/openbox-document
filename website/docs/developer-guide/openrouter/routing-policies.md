---
title: Routing Policies
description: "Write policies that constrain which providers may serve a prompt, approve data regions, and halt a session when the gateway routes outside them."
llms_description: Rego policies for provider allowlists and data residency
sidebar_position: 3
tags:
  - policy-authoring
  - openrouter
  - governance
  - compliance
---

# Routing Policies

A routing policy decides **where a prompt may go, before it goes**. It is an ordinary [policy](/trust-lifecycle/authorize/policies) that reads the routing claim on a model call and either allows it, refuses it, or attaches the routing to use instead.

There are two constraints, and they are not equally strong. A provider allowlist is enforced before the prompt is sent. An approved-region list can only be observed afterwards. Read [Proof of Routing](/core-concepts/proof-of-routing#what-can-be-enforced-and-what-only-observed) before relying on either.

## The Routing Claim

With `preflightRouting` on, every model call carries a claim describing where it is about to go. A policy reads it from the call's spans:

```rego
routing := span if {
	some span in input.spans
	span.hook_type == "llm_routing_request"
}
```

| Attribute | Says |
|-----------|------|
| `openbox.routing.declared` | Whether this call named an allowlist at all |
| `openbox.routing.requested_only` | The providers it will accept |
| `openbox.routing.requested_order` | Preference order, which is a preference and not a promise |
| `openbox.routing.requested_models` | The model fallback chain |
| `openbox.routing.allow_fallbacks` | Whether it fails closed |
| `gen_ai.request.model` | The model asked for |

## Require That Routing Is Constrained

The simplest useful rule: no prompt leaves this agent without an allowlist. Decidable before it goes.

```rego
result := {
	"decision": "BLOCK",
	"reason": "routing must be constrained",
} if {
	routing
	routing.attributes["openbox.routing.declared"] == false
}
```

## Narrow to Trusted Providers

Rather than refusing, attach the routing to use instead. The refused attempt closes as refused, routing happens as its own step, and the corrected call runs.

```rego
result := {
	"decision": "BLOCK",
	"reason": "this agent may only send prompts to openai",
	"patch": {"new_input": {"provider": {"only": ["openai"], "allow_fallbacks": false}}},
} if {
	routing
	{lower(p) | some p in object.get(routing.attributes, "openbox.routing.requested_only", [])} != {"openai"}
}
```

The SDK writes that allowlist into the outgoing request, so **OpenRouter itself** refuses rather than falling back to a provider you did not approve.

### A directive can only narrow

`only` and `models` intersect with what the caller named, and `allow_fallbacks` is false if either side says so. A policy can never route a prompt somewhere the caller did not allow — only to fewer places. This is the one directive the SDK applies on its own initiative, and that constraint is why.

If the intersection is empty — the policy allows only `openai`, the request named `azure` alone — nothing satisfies both, and the call is refused rather than resolved in either party's favour.

### Why a redirect is spelled as a block

A directive reaches the SDK only on a refusing arm. That is not a quirk of the syntax: the verdict is what Core records against the call, and a call that is about to be re-routed did not run as asked. So the shape is always "BLOCK, plus what to do instead", and the timeline reads:

```text
llm_call     started    BLOCK   "not to that provider"   ← no spans: nothing ran
llm_call     completed  BLOCK                            ← closed on the same verdict
llm_routing  started    ALLOW
  └─ routing to openai (openai/gpt-4o-mini)
llm_routing  completed  ALLOW
llm_call     started    ALLOW
  └─ POST openrouter.ai/api/v1/responses  200
llm_call     completed  ALLOW
```

The refused attempt has no spans, because no request was ever built under it. The routing step appears **only when a policy actually redirects** — an ordinary call is one `llm_call` and one round-trip.

## Approve Data Regions

An approved-region list cannot travel in the request: OpenRouter honours `provider.only` but has no region parameter. So the list lives in policy and arrives the same way a routing directive does.

```json
{
  "decision": "BLOCK",
  "reason": "prompts from this agent may only be processed in the eu",
  "patch": {
    "new_input": {
      "residency": {"regions": ["eu"], "require_own_key": true}
    }
  }
}
```

The SDK binds that list to the run and stamps it on the routing record **before** the prompt goes out — so it is sealed under the signed session root at a point where the outcome is not yet known, and cannot have been chosen to fit it. Afterwards it is compared to the region the gateway reports.

The list accumulates across turns and can only ever narrow, so a later turn cannot quietly re-approve a region an earlier one removed.

### This produces evidence, not prevention

Nothing the SDK writes into a request influences where the call lands. A residency breach lands on the record as `openbox.residency.region_honored = false`, which a policy can refuse the **next** call on:

```rego
result := {
	"decision": "STOP",
	"reason": "a prompt was processed outside the approved regions",
} if {
	some span in input.spans
	span.attributes["openbox.residency.region_honored"] == false
}
```

One call later than you would like, and honest about it.

### `global` is compared literally

A plain `openai/gpt-4o-mini` call reports `data_region: global` while being served by Azure. `global` means no regional endpoint was used — exactly what an operator who approved `["eu"]` needs to see fail. Approving `["global"]` is the honest way to say any zone is acceptable.

## Halt on an Untrusted Provider

The provenance record is a span, so a policy can decide on it directly:

```rego
trusted := {"anthropic"}

untrusted contains provider if {
	some span in input.spans
	provider := lower(span.attributes["gen_ai.upstream.provider"])
	not provider in trusted
}

result := {
	"decision": "STOP",
	"reason": sprintf("prompt was served by an untrusted provider: %v", [concat(", ", untrusted)]),
} if { count(untrusted) > 0 }
```

The session ends `halted`, with the reason recorded against the model call that broke the rule.

## Catch a Substituted Model

```rego
result := {
	"decision": "STOP",
	"reason": "a call ran a model nobody asked for",
} if {
	some span in input.spans
	span.attributes["openbox.model.honored"] == false
}
```

`openbox.model.honored` is absent — not `false` — for `openrouter/auto`, because choosing the model is the point there. Comparing against `false` therefore never fires on an auto-routed call.

## Choosing Between the Two Ends

| You want to | Write the rule against |
|-------------|------------------------|
| Stop a prompt reaching an untrusted provider | The **routing claim**, pre-flight |
| Send a prompt somewhere narrower instead | The **routing claim**, with `patch.new_input.provider` |
| Approve regions for a run | The **routing claim**, with `patch.new_input.residency` |
| Halt after the gateway routed outside your rules | The **provenance record**, post-hoc |
| Halt after a model substitution or a residency breach | The **provenance record**, post-hoc |

## Related Pages

- **[Policies](/trust-lifecycle/authorize/policies)** - How policies are authored and versioned
- **[Routing Attributes](/developer-guide/openrouter/routing-attributes)** - Every field both ends carry
- **[Proof of Routing](/core-concepts/proof-of-routing)** - What can be enforced and what only observed
- **[Routing Integrity](/dashboard/routing-integrity)** - Where the outcomes appear
