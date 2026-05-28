---
title: Configuration
description: "Configure the OpenBox Mastra SDK with environment variables and runtime options for production governance."
llms_description: Mastra SDK configuration reference
sidebar_position: 3
tags:
  - sdk
  - mastra
  - configuration
---

# Configuration

The Mastra SDK can be configured through environment variables or explicit options passed to `withOpenBox()` and `parseOpenBoxConfig()`.

## Configuration Precedence

Configuration is resolved in this order:

1. Explicit options passed in code
2. Environment variables
3. SDK defaults for optional fields

`apiUrl` and `apiKey` are always required from either code or environment.

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENBOX_URL` | Yes | - | OpenBox Core base URL |
| `OPENBOX_API_KEY` | Yes | - | OpenBox API key |
| `OPENBOX_AGENT_DID` | Yes, unless disabled | - | DID assigned to this OpenBox agent |
| `OPENBOX_AGENT_PRIVATE_KEY` | Yes, unless disabled | - | Base64 raw Ed25519 seed returned during identity provision or rotation |
| `OPENBOX_VALIDATE` | No | `true` | Validate the API key at startup |
| `OPENBOX_GOVERNANCE_POLICY` | No | `fail_open` | Behavior when OpenBox is unavailable |
| `OPENBOX_GOVERNANCE_TIMEOUT` | No | `30` | Timeout in seconds for evaluate and approval calls |
| `OPENBOX_HITL_ENABLED` | No | `true` | Enable approval suspension or polling |
| `OPENBOX_HTTP_CAPTURE` | No | `true` | Capture text HTTP bodies and headers |
| `OPENBOX_INSTRUMENT_DATABASES` | No | `true` | Enable supported database instrumentation |
| `OPENBOX_INSTRUMENT_FILE_IO` | No | `false` | Enable file operation capture |
| `OPENBOX_SEND_START_EVENT` | No | `true` | Emit `WorkflowStarted` |
| `OPENBOX_SEND_ACTIVITY_START_EVENT` | No | `true` | Emit `ActivityStarted` |
| `OPENBOX_SKIP_ACTIVITY_TYPES` | No | `send_governance_event` | Skip matching activity types |
| `OPENBOX_SKIP_SIGNALS` | No | empty | Skip matching signal names |
| `OPENBOX_SKIP_WORKFLOW_TYPES` | No | empty | Skip matching workflow or agent workflow types |
| `OPENBOX_DEBUG` | No | `false` | Enable summarized debug logging |

## Core Runtime Options

| Option | Default | Use it to |
| --- | --- | --- |
| `apiUrl` | required | Point the SDK at OpenBox Core |
| `apiKey` | required | Authenticate evaluate and approval calls |
| `agentDid` | unset | Identify the agent for DID-signed OpenBox requests |
| `agentPrivateKey` | unset | Sign OpenBox requests when the registered agent requires signing |
| `validate` | `true` | Fail fast on invalid credentials or insecure URLs |
| `onApiError` | `"fail_open"` | Choose availability versus strict enforcement during outages |
| `governanceTimeout` | `30` | Set the API timeout in seconds |
| `hitlEnabled` | `true` | Enable approval handling |
| `httpCapture` | `true` | Capture text HTTP payloads and headers |
| `instrumentDatabases` | `true` | Enable supported DB instrumentation |
| `instrumentFileIo` | `false` | Enable file operation telemetry |
| `sendStartEvent` | `true` | Emit `WorkflowStarted` |
| `sendActivityStartEvent` | `true` | Emit `ActivityStarted` |

## Recommended Production Baseline

| Setting | Recommended value | Why |
| --- | --- | --- |
| `validate` | `true` | Catch bad credentials or insecure URLs during startup |
| `onApiError` | explicit per environment | Avoid accidental fail-open or fail-closed behavior |
| `httpCapture` | `true` unless payload sensitivity blocks it | Preserve request context for policy and troubleshooting |
| `instrumentDatabases` | `true` | Low-friction visibility into data access |
| `instrumentFileIo` | `false` until needed | Reduce noise and sensitive-path exposure |
| `skipSignals` | Do not skip `agent_output` by default | That signal carries agent output and model telemetry |
| `OPENBOX_AGENT_PRIVATE_KEY` | Secret manager only when signing is required | Prevents agent identity material from being shared or committed |

## Example

```ts
import { withOpenBox } from "@openbox-ai/openbox-mastra-sdk";

await withOpenBox(mastra, {
  apiKey: process.env.OPENBOX_API_KEY,
  apiUrl: process.env.OPENBOX_URL,
  agentDid: process.env.OPENBOX_AGENT_DID,
  agentPrivateKey: process.env.OPENBOX_AGENT_PRIVATE_KEY,
  validate: true,
  onApiError: "fail_open",
  governanceTimeout: 30,
  hitlEnabled: true,
  httpCapture: true,
  instrumentDatabases: true,
  instrumentFileIo: false,
  sendStartEvent: true,
  sendActivityStartEvent: true,
  skipActivityTypes: ["send_governance_event"],
  skipSignals: [],
  skipWorkflowTypes: []
});
```

## Important Behavioral Notes

### Agent DID Identity

Newly created OpenBox agents require cryptographic DID signing by default. When **Require signing** is enabled for the registered agent, the Mastra SDK signs validation, governance evaluation, and approval requests with the agent's DID identity.

Set both values together:

```bash title=".env"
OPENBOX_AGENT_DID=did:aip:550e8400-e29b-41d4-a716-446655440000
OPENBOX_AGENT_PRIVATE_KEY=base64_raw_ed25519_seed
```

Rules:

- `OPENBOX_AGENT_DID` must use the `did:aip:<uuid>` format.
- `OPENBOX_AGENT_PRIVATE_KEY` must be the base64 raw 32-byte Ed25519 seed returned by OpenBox.
- Setting only one of the two values fails SDK configuration parsing.
- The SDK never logs the private key.

The private key is returned only when the agent identity is provisioned or rotated. Store it as a per-agent secret and rotate it from OpenBox if it is exposed.

If **Require signing** is disabled for the agent, omit both DID values and authenticate with `OPENBOX_API_KEY` only.

### Validation

Startup validation checks:

- API key format
- OpenBox URL format
- DID identity pair consistency when DID signing values are present
- live API key validation unless `validate: false`

Use `validate: false` only for tests, local mocks, or fixture servers.

### Failure Policy

`fail_open` keeps the application running if OpenBox is unreachable. `fail_closed` stops governed execution when OpenBox cannot be reached after retries. Choose this intentionally before deployment.

### Skip Lists

Skip lists suppress emission of matching workflow, activity, or signal events. This is useful for reducing noise, but it can also hide telemetry you later expect in the UI.

## Next Steps

- [Event Model](/developer-guide/mastra/event-model)
- [Approvals and Guardrails](/developer-guide/mastra/approvals-and-guardrails)
- [Troubleshooting](/developer-guide/mastra/troubleshooting)
