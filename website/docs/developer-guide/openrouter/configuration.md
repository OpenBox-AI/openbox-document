---
title: Configuration
description: "Configure the OpenBox OpenRouter SDK with environment variables and runtime options, including routing attestation and pre-flight routing."
llms_description: OpenRouter SDK configuration reference
sidebar_position: 2
tags:
  - sdk
  - openrouter
  - configuration
---

# Configuration

The OpenRouter SDK is configured through options passed to `createOpenBoxGovernance()` or through environment variables.

## Configuration Precedence

1. Explicit options passed in code
2. Environment variables
3. SDK defaults for optional fields

`apiKey` and the OpenBox URL are always required from either code or environment.

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENBOX_API_KEY` | Yes | - | OpenBox API key |
| `OPENBOX_API_URL` | No | `https://core.openbox.ai` | OpenBox Core base URL (`OPENBOX_URL` also accepted) |
| `OPENBOX_AGENT_DID` | Yes, unless disabled | - | DID assigned to this OpenBox agent |
| `OPENBOX_AGENT_PRIVATE_KEY` | Yes, unless disabled | - | Signing key for OpenBox requests |
| `OPENROUTER_API_KEY` | For provenance | - | Reads each call's generation record back from the gateway |
| `OPENBOX_ATTEST_ROUTING` | No | `true` | Collect and seal routing provenance |
| `OPENBOX_PREFLIGHT_ROUTING` | No | `true` | State the routing on the call before the request is built |
| `OPENBOX_SPAN_CONCURRENCY` | No | `4` | How many of an activity's spans are in flight at once |
| `OPENBOX_TIMEOUT_MS` | No | `35000` | Timeout for OpenBox calls, in milliseconds |
| `OPENBOX_HITL_POLL_INTERVAL_MS` | No | `5000` | How often to poll for an approval decision |
| `OPENBOX_HITL_TIMEOUT_MS` | No | `3600000` | How long to hold a call open waiting for a human |
| `OPENBOX_INSTRUMENT_DATABASES` | No | `true` | Set to `false` to disable database instrumentation |

## Runtime Options

```ts
createOpenBoxGovernance({
  agentName: 'research-agent',
  sessionId: 'user-42',
  taskQueue: 'openrouter',          // default
  onApiError: 'fail_open',          // or 'fail_closed'
  governanceTimeout: 30,            // seconds
  toolTypeMap: { db_query: 'database' },
  skipToolTypes: new Set(['echo']),
  hitl: { enabled: true, pollIntervalMs: 5000, timeoutMs: 60 * 60 * 1000 },
  instrumentHttp: true,             // default
  instrumentDatabases: true,        // default
  instrumentFileIo: false,          // default
  spanConcurrency: 4,               // default
  preflightRouting: true,           // default
  attestRouting: true,              // default
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  captureRequestObjectBody: false,  // default — see below
  transport: myTransport,           // bring your own HTTP stack
});
```

| Option | Default | Use it to |
|--------|---------|-----------|
| `agentName` | required | Name the agent this run belongs to |
| `sessionId` | unset | Correlate runs under your own session identifier |
| `onApiError` | `fail_open` | Choose availability versus strict enforcement during an OpenBox outage |
| `governanceTimeout` | `30` | Bound evaluate and approval calls, in seconds |
| `hitl` | enabled | Configure approval polling and its timeout |
| `spanConcurrency` | `4` | Bound concurrent span delivery; `1` for strictly serial |
| `preflightRouting` | `true` | State routing on the call so a policy can refuse or narrow it |
| `attestRouting` | `true` | Read the generation record back and seal it |
| `openrouterApiKey` | from env | Authenticate the generation-record lookup |
| `captureRequestObjectBody` | `false` | Capture request bodies — read the caveat below |

## Failure Behaviour

`onApiError: 'fail_open'` — the default — lets a run continue when OpenBox Core is unreachable. `'fail_closed'` aborts it.

Authentication failures (401 and 403) always hard-fail regardless of this setting. A revoked key must never silently degrade to "run ungoverned".

## Routing Attestation

`attestRouting` controls whether the SDK reads each call's generation record back from OpenRouter and seals it into the session.

| Situation | Behaviour |
|-----------|-----------|
| Enabled with a gateway key | Provenance is collected in the background and drained before the session closes |
| Enabled without a gateway key | Inert. The rest of governance is unaffected |
| Disabled | No provenance. The [Routing Integrity](/dashboard/routing-integrity) panel has nothing to show for the agent |

Collection never sits on a turn's critical path. The generation record is written shortly after the response, so an immediate lookup returns nothing; the SDK retries with backoff and drains at session close.

## Pre-flight Routing

`preflightRouting` controls whether the routing a call will use is stated on the call itself, before the request is built. Leave it on if you want a policy to be able to refuse or redirect a prompt while that still changes where it goes — with it off, routing is evidence only.

## captureRequestObjectBody

Off by default, and worth understanding before turning it on. Reading a body off a `Request` requires cloning it, which leaves the caller's object in a state their retry logic cannot reuse. With it enabled, roughly a quarter of real runs failed with `Cannot construct a Request with a Request object that has already been used`.

Response bodies — where token counts live — are unaffected and always captured when HTTP capture is on.

## What Governance Costs

Every evaluation is a round-trip to OpenBox Core, which starts a workflow and awaits it: roughly 1 second idle, 2 seconds under concurrent load.

| A tool that does | Costs about |
|---|---|
| One gated operation | ~1s |
| One Postgres query | ~2s — gated twice by design: before it runs, and on its results |
| Four **concurrent** queries | ~one round — different operations' spans travel concurrently |
| Four **sequential** queries | ~four rounds — the application serialized them |

`spanConcurrency` bounds how many of an activity's spans are in flight at once. Ordering within a single operation is always preserved.

## Related Pages

- **[SDK Reference](/developer-guide/openrouter/sdk-reference)** - The API surface
- **[Routing Policies](/developer-guide/openrouter/routing-policies)** - Constrain where prompts may go
- **[Troubleshooting](/developer-guide/openrouter/troubleshooting)** - Diagnose missing provenance
