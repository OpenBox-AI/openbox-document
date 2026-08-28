---
title: Routing Integrity
description: "See which provider served every model call, whether the allowlist held, where the data was processed, and what the broken promises cost."
llms_description: Dashboard view over attested routing records
tags:
  - observability
  - compliance
  - audit
  - openrouter
---

# Routing Integrity

Routing Integrity is the dashboard view over [Proof of Routing](/core-concepts/proof-of-routing). It reads the attested record of every governed model call and reports who served it, whether the routing matched what was asked for, where the data was processed, and what it cost.

Access via **Agent Detail → Provenance** for the whole-agent view. Per-session detail appears on the **Verify** tab and in [Session Replay](/trust-lifecycle/session-replay).

The tab is shown only for agents registered on the OpenRouter framework. Routing provenance is an OpenRouter-specific record — it exists because that gateway picks the provider per request and publishes the answer afterwards — so an agent on another framework has nothing to display here. An agent that really does route through OpenRouter but was registered as something else will show nothing until its framework is corrected on [Agent Settings](/dashboard/agents/agent-settings).

## Reading the Panel

Read **coverage before any rate**. A perfect honored rate over traffic that named no allowlist is a statement about nothing, so the panel puts the size of the denominator next to every score.

| Block | Answers |
|-------|---------|
| **Summary cards** | How many calls were attested, how many made a checkable promise, and whether any promise broke. |
| **Provider routing** | Which providers served the traffic, and which calls went outside a stated allowlist. |
| **Model integrity** | Whether the model that answered is the model that was asked for. |
| **Provider reliability** | How often each provider failed, and how slow each attempt was. |
| **Residency** | Which regions were approved, and which calls ran outside them. |
| **What it cost** | Spend per call and per session, and the spend attributable to each broken promise. |
| **Attested model calls** | The drill-down: one row per call, filterable, each carrying its generation ID. |

## Three Outcomes, Not Two

Every check in this panel has a third state, and it is the one that keeps the numbers honest.

| Outcome | Meaning |
|---------|---------|
| **Honored** | The request named a provider allowlist, and an allowed provider served the call. |
| **Dishonored** | The request named an allowlist, and someone else served it. |
| **Unconstrained** | The request named no allowlist. Nothing was promised, so nothing was broken — and the call is excluded from the honored rate rather than counted as a pass. |

`honored_rate` is `null` rather than 100% when nothing was constrained. `coverage_rate` sits beside it saying how much of the traffic the rate speaks for.

## Provider Routing

The per-provider breakdown shows, for each upstream provider that served traffic: the number of calls, how many of those went outside a stated allowlist, the total cost, and the average latency.

Providers are de-duplicated case-insensitively. OpenRouter reports `OpenAI` on one call and `openai` on another, and a breakdown listing both would read as two providers serving the session; the first spelling seen wins as the display label.

## Model Integrity

The same record answers a second question: *did I get the model I paid for?*

| Outcome | Meaning |
|---------|---------|
| **Matched** | The model that ran is the model the request asked for. A model the caller listed in their own fallback chain counts as matched — they asked for it. |
| **Substituted** | A different model answered. The caller paid for one thing and got another. |
| **Unchecked** | The request named `openrouter/auto`, so choosing the model was the point. Reported as unchecked, never as a pass. |

Unlike the provider check, nearly every request names a concrete model — so this check speaks for almost all traffic, and its coverage is usually near-total.

## Provider Reliability

A reliability scorecard built from your own traffic rather than a global status page: how often each provider failed you, and how slow each attempt was.

| Column | Meaning |
|--------|---------|
| **Attempts** | Every attempt on the failover chain, not just the ones that won. |
| **Failures** | Attempts that did not serve the call. |
| **Failure rate** | Failures over attempts. |
| **Mean / worst latency** | The average and the slowest attempt, coloured apart — an acceptable mean can hide a provider that occasionally takes ten seconds. |

Counting attempts rather than winners is the point. Scoring only the calls a provider served would flatter every provider whose failures were quietly absorbed by failover.

## Residency

Where the data was processed, measured against the regions a policy approved.

| Field | Meaning |
|-------|---------|
| **Declared calls** | Calls that ran under an approved-region list at all. |
| **Approved / unapproved** | Calls inside, and outside, that list. |
| **Unchecked** | Calls with no approved list, or none the gateway reported a region for. Never counted as approved. |
| **Approved regions** | The regions the policy approved, with call counts. |
| **Own key** | Whether a customer-supplied provider key was required, and whether it was used. |

Two things this panel states on the screen rather than in a footnote:

- **This check is weaker than the provider check, on purpose.** Nothing in a request steers where a call lands, so a residency breach is evidence caught one call later — not prevention. A policy can refuse the next call and halt the session.
- **`global` is compared literally.** A plain `openai/gpt-4o-mini` call reports `data_region: global` while being served by Azure. `global` means no regional endpoint was used, which is exactly what an operator who approved `["eu"]` needs to see fail. Approving `["global"]` is the honest way to say any zone is acceptable.

## What It Cost

The gateway's own dashboard reports spend per key and per model. What it cannot report is what a **violation** cost, because nothing else holds the comparison and the price on the same record.

| Figure | Meaning |
|--------|---------|
| **Total cost** | Summed over calls that carried a price. |
| **Per call / per session** | Averages, `null` when nothing was priced. |
| **Dishonored spend** | Spend on calls served outside a stated allowlist. |
| **Substituted spend** | Spend on calls that ran a model nobody asked for. |
| **Unapproved spend** | Spend on calls processed outside the approved regions. |
| **Unpriced calls** | Calls whose record carried no cost. Reported as a hole in the evidence, excluded from the averages rather than averaged as free. |
| **Upstream cost** | Shown only where a BYOK call exists, and scoped to those calls. |

Every violation line is drillable to a generation ID through the matching filter on the call list, which is the whole claim: a number anyone can re-check at source rather than an invoice they are asked to accept.

Upstream cost is deliberately confined to BYOK traffic. A non-BYOK call reports an upstream inference cost of `0` alongside a non-zero total, because for that traffic the gateway charge **is** the cost — so a fleet-wide "margin" figure would read as though the gateway kept everything.

## Attested Model Calls

One row per call, newest first. Each row carries the provider that served it, the model that ran, the model requested, the region, the cost, the latency, the failover trail, and the outcome of each check.

Filters:

| Filter | Use it to find |
|--------|----------------|
| `outcome=dishonored` | Calls served outside a stated allowlist |
| `modelOutcome=substituted` | Calls that ran a model nobody asked for |
| `residencyOutcome=unapproved` | Calls processed outside the approved regions |
| `provider` / `region` | Everything served by one provider, or from one region |
| `byok` | Only calls served on a customer-supplied key |

Every row shows OpenRouter's **generation ID**. Click it to copy, then re-check the claim at the source:

```bash
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  "https://openrouter.ai/api/v1/generation?id=gen-1787824433-ldSfnr06xRDRoVVJmDzQ"
```

That is the point of keeping the ID. Nothing in this panel asks to be believed.

## Empty States

An empty panel is a statement, so it says which one it is:

| Situation | What you see |
|-----------|--------------|
| Agent on another framework | The tab is not shown at all. |
| No attested calls yet | The panel explains that provenance is written after the response, so a very recent run may still be collecting. |
| A filter matched nothing | A message naming what it found nothing **of** — "no call in this window was served outside a stated allowlist" — rather than a bare "no results". |
| A session that failed before reaching a provider | No provenance, because no call reached a provider. Its [Run Receipt](/trust-lifecycle/run-receipt) still attests that nothing ran. |

## API

Every figure on this page is available through the API, org-scoped to the caller and filtered by the caller's teams.

| Endpoint | Returns |
|----------|---------|
| `GET /routing-integrity/summary` | Every block above, for a time window |
| `GET /routing-integrity/calls` | The call list, filterable and paginated |
| `GET /routing-integrity/sessions/:sessionId` | One session's calls and its banner |
| `GET /routing-integrity/sessions/:sessionId/receipt` | The session's [run receipt](/trust-lifecycle/run-receipt) |

`fromTime` and `toTime` bound the window and default to the last 7 days. `agentId` narrows to one agent; omit it for the fleet-wide view.

## Related Pages

- **[Proof of Routing](/core-concepts/proof-of-routing)** - The concept behind the panel
- **[Run Receipt](/trust-lifecycle/run-receipt)** - Hand one session's evidence to someone else
- **[Routing Policies](/developer-guide/openrouter/routing-policies)** - Constrain providers, approve regions
- **[Routing Attributes](/developer-guide/openrouter/routing-attributes)** - The fields behind every figure here
- **[Session Replay](/trust-lifecycle/session-replay)** - Inspect a single governed session
