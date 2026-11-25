---
title: Operations and Troubleshooting
description: "Operate OpenBox for Salesforce Agentforce: governed request records, audit trail, approvals from the CLI, undelivered events, common failures and fixes, tests and package builds."
llms_description: Agentforce SDK operations, troubleshooting and testing
sidebar_position: 5
tags:
  - salesforce
  - reference
---

# Operations and Troubleshooting

## Where to look

| Task | How |
|---|---|
| See every governed call | List view or report on `OpenBox_Governed_Request__c` |
| Audit trail | `OpenBox_Governance_Audit__c`, linked to each request |
| Conversations | `OpenBox_Agent_Session__c`, one per conversation |
| Approve or reject | OpenBox dashboard ([Approvals](/approvals)), or `node scripts/openbox/approvals.mjs approve <request-id>` |
| See what OpenBox stored | OpenBox dashboard > the agent > Sessions, or `node scripts/openbox/inspect-session.mjs <request-id>` |
| Undelivered events | `OpenBox_Event_Outbox__c` with `Status__c` `Queued` or `Failed` |
| Change policy | OpenBox dashboard > the agent; the next call follows it |

The scripts run from a clone of the
[SDK repository](https://github.com/OpenBox-AI/openbox-agentforce-sdk) with
your `.env`. See [The OpenBox API key](/developer-guide/salesforce-agentforce/configuration#the-openbox-api-key)
for the permissions each one needs.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Every call ends `Failed` with *OpenBox governance unavailable: OpenBox unreachable: Read timed out* | OpenBox did not answer within `Callout_Timeout_Ms__c`, so the SDK failed closed and wrote nothing. Check OpenBox's status, and that the guardrails attached to your agent are reachable. |
| *OpenBox workload bootstrap names issuer …, but only … is trusted* | The org trusts a different OpenBox environment from the one your agent belongs to. Run `configure-endpoints.mjs` with that environment in `.env`. See [Another OpenBox environment](/developer-guide/salesforce-agentforce/configuration#another-openbox-environment). |
| `provision.mjs` fails with *Required permissions: …* (HTTP 403) | Your API key lacks that permission. See [The OpenBox API key](/developer-guide/salesforce-agentforce/configuration#the-openbox-api-key). |
| Publishing the agent fails on an `Id` or `Integer` input or output | Declare its type: `complex_data_type_name: "lightning__recordIdType"` or `"lightning__integerType"`. |
| Agentforce settings fail to deploy on a new org (*Legal Terms acceptance…*) | Turn on Einstein and Agentforce once in Setup, and accept the terms. |
| An approved request is not applied | Check that the poller schedule is installed (`OpenBoxApprovalPollerSchedule.install()`). The agent can also apply it with `Check Approval`. |
| An administrator can edit a guarded field directly | By design. See [Permission sets and custom permissions](/developer-guide/salesforce-agentforce/configuration#permission-sets-and-custom-permissions). |
| Your action fails for the agent with an access error | Grant the agent user your Apex classes, and read access to the fields they use, through a permission set of yours. |

## Testing

| Suite | Command | Covers |
|---|---|---|
| Apex | Run by `deploy.mjs` and by every package version build | Against a scripted OpenBox: workload identity, event and span pairing, the trust boundary, failing closed, approvals, replay, staleness, the field guard |
| End to end | `node scripts/e2e/run-live.mjs --target-org my-org` | The reference agent against the OpenBox environment in `.env`, including a real Agentforce conversation. Each scenario checks the Salesforce outcome, the verdicts OpenBox recorded and the pairing of the stored session. The report is written to `out/e2e-report.json` |

## Building the package

`force-app` in the SDK repository is the unlocked package `OpenBoxGovernance`.
A version build runs the Apex tests and the code-coverage check:

```bash
sf package version create --package OpenBoxGovernance --installation-key-bypass --code-coverage \
  --wait 60 --target-dev-hub <dev hub>
```

## Repository layout

```
.
├── force-app/                     # the package (OpenBoxGovernance, unlocked)
│   └── main/default/
│       ├── classes/               # the Apex SDK, its actions and tests
│       ├── objects/               # Governed Request, Agent Session, Audit, Event Outbox, Settings (mdt)
│       ├── namedCredentials/      # OpenBox_Core
│       ├── externalCredentials/   # OpenBox_Core_Auth (API key)
│       ├── remoteSiteSettings/    # OpenBox_Identity
│       ├── permissionsets/        # OpenBox_Governed_Agent, OpenBox_Governance_Admin
│       └── customPermissions/     # Governed_Record_Write, Guarded_Field_Direct_Edit
├── reference-agent/               # the worked example; deployed, not packaged
├── config/                        # scratch org definition for a package test org
├── scripts/
│   ├── openbox/                   # register the agent and its controls, inspect sessions, approvals
│   ├── salesforce/                # certificate, credential, endpoints, agent user, deploy, publish
│   └── e2e/run-live.mjs           # end-to-end suite against a real org and OpenBox
└── LICENSE                        # MIT
```
