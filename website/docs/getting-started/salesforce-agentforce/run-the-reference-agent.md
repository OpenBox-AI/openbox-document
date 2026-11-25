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

What each step does:

| Script | Does |
|---|---|
| `workload-certificate.mjs` | Generates the signing certificate inside Salesforce and writes its public key to `.env` |
| `provision.mjs` | Registers the agent in OpenBox with its starting controls, and writes its runtime key to `.env` |
| `deploy.mjs` | Deploys the SDK and the reference agent from source, runs the Apex tests, installs the approval poller schedule |
| `setup-org.mjs --skip-deploy` | Assigns `OpenBox_Governance_Admin` and `OpenBox_Sales_Admin` to you, stores the runtime key in the External Credential, and seeds four demo Opportunities |
| `create-agent-user.mjs` | Creates the agent user and saves its username to `.env` |
| `publish-agent.mjs` | Publishes and activates `OpenBox_Sales_Agent` |

`deploy.mjs` deploys the SDK from source as well. To use the installed package
instead, deploy only the reference agent:

```bash
sf project deploy start --source-dir reference-agent --target-org my-org
```

## Try it

Open the agent with `sf agent preview --api-name OpenBox_Sales_Agent --target-org my-org`,
or in the Agentforce builder. `setup-org.mjs` seeded four Opportunities, each
at a 5% discount, to exercise the policies:

| Ask the agent | OpenBox decides |
|---|---|
| Set the discount on *OBX Demo - Routine Renewal* to 10%. They committed to a three-year renewal. | Allow: the discount changes to 10% |
| Set the discount on *OBX Demo - Approval Track* to 25%. | Require approval: the agent gives you a request number. Approve it in the OpenBox dashboard and the discount changes to 25% |
| Set the discount on *OBX Demo - Late Stage Expansion* to 10%. | Require approval: the late-stage sign-off behavior rule holds the write until it is approved |
| Set the discount on *OBX Demo - Routine Renewal* to 55%. | Block: nothing changes, and the agent says why |
| Set the discount on *OBX Demo - Closed Deal* to 8%. | Block: closed deals cannot be discounted |
| Set the discount on *OBX Demo - Routine Renewal* to 95%. | Halt: nothing changes, and the conversation ends. Try this one last, or start a new conversation afterwards |

Each conversation shows up in the OpenBox dashboard under the agent's
**Sessions**, with every lookup, write and verdict in order.

Then try to change `Discount__c` any other way, as a user without the
`OpenBox_Guarded_Field_Direct_Edit` custom permission: from the record page, a
flow, Apex or the API. The field guard refuses the change. (System
Administrators hold that permission by default; see
[Permission sets and custom permissions](/developer-guide/salesforce-agentforce/configuration#permission-sets-and-custom-permissions).)

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
