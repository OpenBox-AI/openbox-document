---
title: Routing Glossary
description: "The vocabulary of gateway routing: allowlists, routing decisions, routing records, and the evidence they produce."
llms_description: Definitions of OpenRouter routing and provenance terms
sidebar_position: 9
tags:
  - reference
  - openrouter
---

# Routing Glossary

Terms that apply to agents on the [OpenRouter](/getting-started/openrouter) framework. Platform-wide
vocabulary lives in the main [Glossary](/glossary).

---

## Proof of Routing

The attested record of which upstream provider served each prompt, in which region, at what cost, and whether that matched what the request asked for. It exists because a gateway chooses the serving provider per request and does not report it in the response.

**OpenBox connection:** The [OpenRouter SDK](/developer-guide/openrouter/sdk-reference) reads the gateway's own generation record for every governed model call and seals it into the session's [Merkle Tree](/glossary#merkle-tree), where a policy can decide on it and an auditor can re-check it.

**Learn more:** [Proof of Routing](/developer-guide/openrouter/proof-of-routing)

---

## Provider Allowlist

The set of upstream providers a request will accept, expressed as OpenRouter's `provider.only`. The one routing constraint that can be enforced before a prompt is sent: the gateway refuses rather than falling back to a provider outside the list.

**OpenBox connection:** A [routing policy](/developer-guide/openrouter/routing-policies) can attach an allowlist to a call, and the SDK writes it into the outgoing request. A directive can only ever narrow what the caller named, never widen it.

**Learn more:** [Routing Policies](/developer-guide/openrouter/routing-policies)

---

## Routing Decision

Where a policy will permit a prompt to go, decided **before** the request is built. An act of governance — something a rule can be written about, and something that can still change where the prompt lands.

**OpenBox connection:** Recorded as a claim on the model call itself, so a [policy](/developer-guide/openrouter/routing-policies) can refuse the call or attach narrower routing to use instead.

**Learn more:** [Routing Policies](/developer-guide/openrouter/routing-policies)

---

## Routing Record

What the gateway actually did, read back **after** the answer. Evidence rather than an action, so it is stored and sealed but never shown as a step the agent took.

Keeping this apart from a [Routing Decision](#routing-decision) matters: they are different acts at different times, and naming them the same made a single call read as though it had happened twice.

**Learn more:** [Routing Attributes](/developer-guide/openrouter/routing-attributes)

---

## Run Receipt

One session's routing evidence gathered into a single page: how many model calls the run made, which providers served them, in which regions, and whether the routing matched what was requested.

**OpenBox connection:** Shareable as a redacted public page, so a developer can send it to their own customer. Each model call keeps the gateway generation ID it was recorded under, so the underlying claims can be re-checked at OpenRouter rather than taken on trust.

**Learn more:** [Run Receipt](/developer-guide/openrouter/run-receipt)
