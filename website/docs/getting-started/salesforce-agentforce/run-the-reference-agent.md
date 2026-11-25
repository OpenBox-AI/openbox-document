---
title: Run the Reference Agent
description: "Deploy the OpenBox reference Agentforce sales agent: governed Opportunity lookups and discount changes, a guarded field, a governed flow and a starting set of OpenBox policies."
llms_description: Deploy the governed Agentforce reference sales agent
sidebar_position: 2
tags:
  - getting-started
  - salesforce
---

# Run the Reference Agent

The SDK repository ships a complete, working example built only on the SDK: an
Agentforce sales agent that looks up Opportunities and changes their discount,
with the discount field guarded. It is deployed as source, not packaged, so you
can read and change every piece.

## What it shows

| Piece | What it shows |
|---|---|
| `OpportunityDiscountWriter` | A record writer: the field it changes and the facts policies decide on |
| `OpportunityDiscountGuard` | The one-line field guard on `Opportunity.Discount__c` |
| `OpenBox_FindOpportunity` | A read-only Apex tool governed through `OpenBoxToolExecutor` |
| `OpenBox_Log_Opportunity_Note` | A flow registered as a governed tool |
| `OpenBox_Sales_Agent` | The Agent Script, with the conversation hooks wired in |

## Starting policies

`provision.mjs` (without `--agent-only`) gives the reference agent's OpenBox
agent a starting set of controls. After that they belong to the OpenBox
dashboard and are never overwritten (`--reset-policy` restores the defaults).
The highest matching priority wins; a request matching no rule is allowed.

| Priority | Rule, on `ActivityStarted` of `OpportunityDiscountUpdate` | Decision |
|---:|---|---|
| 100 | `is_closed = true` | Block |
| 90 | `proposed_discount ≥ 90` | Halt |
| 80 | `proposed_discount > 40` | Block |
| 70 | `proposed_discount > 15` | Require approval |
| – | no rule matches | Allow |

Also provisioned:

- **Guardrails**: personal-data redaction in the justification and the record
  snapshot, and a manipulation-phrase tripwire.
- **Behavior rules**: a locked re-read before the write, and sign-off for
  late-stage deals.
- **Goal alignment.**

The API key needs more permissions for this than for `--agent-only`. See
[The OpenBox API key](/developer-guide/salesforce-agentforce/configuration#the-openbox-api-key).

## Deploy it

You need the same things as the [Quickstart](/getting-started/salesforce-agentforce#quickstart):
an Agentforce org, the Salesforce CLI, Node 20 and an OpenBox organization API
key. From a clone of the repository, with `.env` filled in:

```bash
git clone https://github.com/OpenBox-AI/openbox-agentforce-sdk.git
cd openbox-agentforce-sdk
cp .env.example .env   # set OPENBOX_ORG_API_KEY, OPENBOX_AGENT_NAME, SF_TARGET_ORG

node scripts/salesforce/workload-certificate.mjs --target-org my-org
node scripts/openbox/provision.mjs
node scripts/salesforce/deploy.mjs --target-org my-org          # force-app + reference-agent, with tests
node scripts/salesforce/setup-org.mjs --target-org my-org --skip-deploy
node scripts/salesforce/create-agent-user.mjs --target-org my-org
node scripts/salesforce/publish-agent.mjs --target-org my-org
```

`deploy.mjs` deploys the SDK from source as well. To use the installed package
instead, deploy only the reference agent:

```bash
sf project deploy start --source-dir reference-agent --target-org my-org
```

## Try it

Open the agent with `sf agent preview --api-name OpenBox_Sales_Agent --target-org my-org`,
or in the Agentforce builder, and try the policy table on an open Opportunity
that is not in `Negotiation/Review` (a late-stage deal also needs the sales-ops
sign-off behavior rule):

| Ask the agent | OpenBox decides |
|---|---|
| Set the Opportunity's discount to 10% | Allow: the discount changes |
| Set it to 20% | Require approval: the agent gives a request number. Approve it in the OpenBox dashboard and the change is applied |
| Set it to 50% | Block: nothing changes, and the agent says why |
| Set it to 95% | Halt: nothing changes, and the conversation ends |
| Change the discount on a closed Opportunity | Block |

Each conversation shows up in the OpenBox dashboard under the agent's
**Sessions**, with every lookup, write and verdict in order.

Try to edit `Discount__c` directly as the agent user, or through any path that
is not a governed write: the field guard refuses the change.

## Test it end to end

The end-to-end suite runs the reference agent against the OpenBox environment
in `.env`, including a real Agentforce conversation. Each scenario checks the
Salesforce outcome, the verdicts OpenBox recorded and the pairing of the stored
session:

```bash
node scripts/e2e/run-live.mjs --target-org my-org
```

The report is written to `out/e2e-report.json`.

## Next steps

- [Building a Governed Agent](/developer-guide/salesforce-agentforce/building-a-governed-agent) explains each piece above so you can build your own.
- [Salesforce Agentforce Reference](/developer-guide/salesforce-agentforce) shows how a governed write flows from the agent to OpenBox and back.
