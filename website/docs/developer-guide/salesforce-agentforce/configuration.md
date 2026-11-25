---
title: Configuration
description: "Configure OpenBox for Salesforce Agentforce: the OpenBox_Settings__mdt record, permission sets and custom permissions, API key scopes, other OpenBox environments and several orgs."
llms_description: Agentforce SDK settings, permissions and environments
sidebar_position: 3
tags:
  - salesforce
  - configuration
---

# Configuration

## Settings

The custom metadata record `OpenBox_Settings__mdt.Default`:

| Field | Default | Purpose |
|---|---|---|
| `Named_Credential__c` | `OpenBox_Core` | The Named Credential for OpenBox Core |
| `Agent_Name__c` | `Agentforce Sales Agent` | The workflow name your sessions show in OpenBox |
| `Workflow_Type__c` | `AgentforceGovernedAction` | Workflow type reported to OpenBox |
| `Task_Queue__c` | `salesforce-agentforce` | Task queue reported to OpenBox |
| `Callout_Timeout_Ms__c` | `10000` | How long Apex waits for OpenBox before failing closed |
| `Approval_Poll_Interval_Minutes__c` | `1` | How often the poller checks waiting requests |
| `Max_Requests_Per_Transaction__c` | `5` | Governed calls allowed in one transaction |
| `Outbox_Max_Attempts__c` | `5` | Delivery attempts for post-write events |
| `Identity_Issuer__c` | `https://identity.openbox.ai/realms/openbox` | The one identity issuer Apex trusts |
| `Workload_Certificate__c` | `OpenBox_Workload` | The certificate that signs workload assertions |

## Permission sets and custom permissions

| Name | Give it to |
|---|---|
| `OpenBox_Governed_Agent` | The agent user: it may invoke the governed actions |
| `OpenBox_Governance_Admin` | Administrators: governed requests, audit and settings |
| `OpenBox_Governed_Record_Write` (custom permission) | Users on whose behalf the agent may request a governed write |
| `OpenBox_Guarded_Field_Direct_Edit` (custom permission) | People allowed to edit a guarded field directly |

Installing the package grants its custom permissions to the System
Administrator profile, so administrators can edit a guarded field directly. To
hold them to governed writes too, remove `OpenBox_Guarded_Field_Direct_Edit`
from that profile and grant it only through a permission set.

The agent user also needs access to your own Apex classes, and read access to
the fields they use, through a permission set of yours. Give it read access,
not edit access, to every guarded field.

## The OpenBox API key

The setup scripts authenticate with your organization API key (**Organization
> API Keys** in the OpenBox dashboard). Keys are created with an explicit set of
permissions:

| Script | Needs |
|---|---|
| `provision.mjs --agent-only` | `create:agent`, `read:agent`, `update:agent` |
| `provision.mjs` (the reference agent, with its controls) | The above, plus `read:` and `update:` on `agent_policy`, `agent_guardrail` and `agent_behavior_rule`, and `manage:governance_control` to create shipped controls missing from your library |
| `approvals.mjs` | `manage:agent_session` |
| `inspect-session.mjs` | `read:agent_session`, `read:agent_log` |

The organization key stays on your machine. What reaches Salesforce is the
agent's runtime key, which `set-credential.mjs` stores in the External
Credential `OpenBox_Core_Auth`.

## The `.env` file

The scripts read `.env` in the SDK repository (start from `.env.example`):

| Variable | Set by | Purpose |
|---|---|---|
| `OPENBOX_ORG_API_KEY` | You | Your organization API key. Required |
| `OPENBOX_AGENT_NAME` | You | The agent's name in OpenBox. `provision.mjs` finds or creates the agent by this name |
| `SF_TARGET_ORG` | You | Default org alias for the scripts (otherwise pass `--target-org`) |
| `OPENBOX_PLATFORM_API_URL` | You, for another environment | The OpenBox platform API. Defaults to production |
| `OPENBOX_CORE_URL` | You, for another environment | OpenBox Core. Leave unset for production |
| `OPENBOX_WORKLOAD_PUBLIC_JWK` | `workload-certificate.mjs` | The public half of the Salesforce signing certificate |
| `OPENBOX_AGENT_ID`, `OPENBOX_AGENT_API_KEY` | `provision.mjs` | The registered agent and its runtime key. Do not edit by hand |
| `SF_AGENT_USERNAME` | `create-agent-user.mjs` | The agent user |

## Another OpenBox environment

The package points at OpenBox production. To use another environment, set
`OPENBOX_PLATFORM_API_URL` and `OPENBOX_CORE_URL` in `.env`, and after
`provision.mjs` run:

```bash
node scripts/salesforce/configure-endpoints.mjs
```

It asks that Core for its identity issuer, and repoints the `OpenBox_Core`
Named Credential, the `OpenBox_Identity` Remote Site and `Identity_Issuer__c`,
in the org only.

## Several orgs

Keep each org's agent and key in its own env file, and use the same
`OPENBOX_ENV_FILE` for every script:

```bash
OPENBOX_ENV_FILE=.env.sandbox node scripts/openbox/provision.mjs --agent-only
OPENBOX_ENV_FILE=.env.sandbox node scripts/salesforce/set-credential.mjs --target-org my-sandbox
```

Set `OPENBOX_AGENT_NAME` for `provision.mjs` as well, so each org gets its own
agent in OpenBox and your main `.env` is never touched.
