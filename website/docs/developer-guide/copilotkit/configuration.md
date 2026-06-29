---
title: Configuration
description: "Configure the standalone OpenBox CopilotKit SDK for CopilotKit Runtime v2."
llms_description: CopilotKit SDK configuration reference
sidebar_position: 2
tags:
  - sdk
  - copilotkit
  - configuration
---

# Configuration

[`@openbox-ai/openbox-copilotkit`](https://www.npmjs.com/package/@openbox-ai/openbox-copilotkit) can be configured through `OPENBOX_*` environment variables or explicit options passed to `withOpenBoxRuntime()`, `createOpenBoxMiddleware()`, `OpenBoxClient`, and `parseOpenBoxConfig()`.

Most applications should use `withOpenBoxRuntime(options, config)`.

## Configuration Precedence

Configuration is resolved in this order:

1. Explicit options passed in code
2. Environment variables
3. SDK defaults for optional fields

Runtime governance requires an OpenBox Core URL and an agent runtime key.

## Required Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENBOX_URL` | Yes | - | OpenBox Core base URL |
| `OPENBOX_API_KEY` | Yes | - | Agent runtime key, `obx_live_*` or `obx_test_*` |
| `OPENBOX_AGENT_DID` | When signing is enabled | - | DID assigned to this OpenBox agent |
| `OPENBOX_AGENT_PRIVATE_KEY` | When signing is enabled | - | Base64 raw Ed25519 private key |

Newly created OpenBox agents require DID signing by default. If **Require signing** is disabled for the registered agent, omit both DID values.

```bash title=".env.local"
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=obx_live_or_obx_test_agent_runtime_key
OPENBOX_AGENT_DID=did:aip:550e8400-e29b-41d4-a716-446655440000
OPENBOX_AGENT_PRIVATE_KEY=base64_raw_ed25519_private_key
```

## Optional Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENBOX_GOVERNANCE_POLICY` | `fail_open` | maps to `onApiError`; use `fail_closed` to throw when OpenBox is unavailable |
| `OPENBOX_GOVERNANCE_TIMEOUT` | `30` | OpenBox request timeout in seconds |
| `OPENBOX_EVALUATE_MAX_RETRIES` | `2` | retry count for governance evaluation |
| `OPENBOX_EVALUATE_RETRY_BASE_DELAY_MS` | `150` | base backoff delay for evaluate retries |
| `OPENBOX_MAX_EVALUATE_PAYLOAD_BYTES` | `256000` | maximum governance payload size before validation rejects |
| `OPENBOX_VALIDATE` | `true` | validate OpenBox credentials at initialization when using config validation |
| `OPENBOX_DEBUG` | off | enables SDK debug logging in the OpenBox client |
| `OPENBOX_SPAN_BUFFER_MAX_PER_WORKFLOW` | `1000` | per-workflow cap for optional synthesized tool spans |
| `OPENBOX_SPAN_BUFFER_TTL_MS` | `300000` | retention TTL for optional synthesized tool spans |
| `OPENBOX_DISABLE_SPAN_BUFFER` | off | set to `1` to skip optional span synthesis |

The config parser also accepts compatibility fields such as `OPENBOX_SKIP_ACTIVITY_TYPES`, `OPENBOX_SKIP_SIGNALS`, and `OPENBOX_SKIP_WORKFLOW_TYPES`, but the CopilotKit Runtime v2 integration usually does not need them.

## `withOpenBoxRuntime()`

```ts
import { withOpenBoxRuntime } from "@openbox-ai/openbox-copilotkit";

const { runtime, shutdown } = await withOpenBoxRuntime(
  copilotRuntimeOptions,
  {
    apiKey: process.env.OPENBOX_API_KEY,
    apiUrl: process.env.OPENBOX_URL,
    agentDid: process.env.OPENBOX_AGENT_DID,
    agentPrivateKey: process.env.OPENBOX_AGENT_PRIVATE_KEY,
    onApiError: "fail_open",
    middlewareOptions: {
      frontendToolNames: ["setThemeColor"],
      enforceApprovals: false,
    },
  },
);
```

The first argument is `CopilotRuntimeOptions`, not a constructed `CopilotRuntime`.

### Wrapper Config Fields

| Field | Default | Purpose |
| --- | --- | --- |
| `apiKey` | `OPENBOX_API_KEY` | OpenBox agent runtime key |
| `apiUrl` | `OPENBOX_URL` | OpenBox Core base URL |
| `agentDid` | `OPENBOX_AGENT_DID` | DID used for signed OpenBox requests |
| `agentPrivateKey` | `OPENBOX_AGENT_PRIVATE_KEY` | Ed25519 private key used with the DID |
| `onApiError` | `OPENBOX_GOVERNANCE_POLICY` or `fail_open` | `fail_open` returns `null` on API failure; `fail_closed` throws |
| `governanceTimeout` | `30` | OpenBox request timeout in seconds |
| `evaluateMaxRetries` | `2` through parsed config | retry count for governance evaluation |
| `evaluateRetryBaseDelayMs` | `150` | base retry delay |
| `defaults` | `{}` | fallback `agentId`, `tenantId`, and `workflowType` when request context is absent |
| `logger` | `console` | console-style sink for SDK warnings and debug logs |
| `middlewareOptions` | `{}` | options passed to each OpenBox AG-UI middleware instance |

## Middleware Options

`middlewareOptions` controls the AG-UI stream observer.

| Option | Default | Purpose |
| --- | --- | --- |
| `enforceApprovals` | `false` | when `true`, block or halt verdicts stop the AG-UI stream after tool-call input is known |
| `frontendToolNames` | unset | explicit allowlist for React/frontend tool names that should record `frontend: true` |
| `isFrontendTool` | unset | callback alternative to `frontendToolNames`; wins when both are set |
| `onEvent` | unset | observer callback for every OpenBox emission |
| `multiAgent` | disabled | enables `multi_agent_session_id` stamping and mapped handoff emission |
| `spanBuffer` | unset | optional `SpanBuffer` for synthesized `function_call` spans |
| `redactPaths` | unset | JSONPath-like paths to redact from optional span previews |

## Frontend Tool Labelling

The SDK does not infer which tools originated in React. Add an explicit allowlist:

```ts
const { runtime } = await withOpenBoxRuntime(options, {
  middlewareOptions: {
    frontendToolNames: ["setThemeColor", "showSnackbar"],
  },
});
```

For dynamic registries:

```ts
const frontendTools = new Set(["setThemeColor", "showSnackbar"]);

const { runtime } = await withOpenBoxRuntime(options, {
  middlewareOptions: {
    isFrontendTool: ({ name }) => frontendTools.has(name),
  },
});
```

Unlisted tools record `frontend: false` and `tool_origin: "copilotkit-observed"`.

## Enforcement Policy

Default behavior is telemetry-only:

```ts
middlewareOptions: {
  enforceApprovals: false,
}
```

When `enforceApprovals: true`, the SDK awaits the OpenBox verdict after complete tool-call args are available. Block or halt verdicts stop the stream with this redacted AG-UI error frame:

```json
{
  "type": "RUN_ERROR",
  "code": "governance_blocked",
  "correlationId": "<governanceEventId or approvalId>"
}
```

The client does not receive the tool name, tenant id, agent id, or verdict reason.

## Multi-Agent Options

Enable multi-agent mode only when a CopilotKit tool delegates to a distinct child agent and you want one grouped OpenBox timeline.

```ts
const { runtime } = await withOpenBoxRuntime(options, {
  agentDid: process.env.OPENBOX_COPILOTKIT_AGENT_DID,
  agentPrivateKey: process.env.OPENBOX_COPILOTKIT_AGENT_PRIVATE_KEY,
  middlewareOptions: {
    multiAgent: {
      enabled: true,
      parentAgentDid: process.env.OPENBOX_COPILOTKIT_AGENT_DID,
      multiAgentSessionId: (ctx) => `mas:${ctx.runId}`,
      handoffTools: {
        weatherTool: {
          childAgentName: "mastra-weather-agent",
          childWorkflowType: "weather-agent",
          childTaskQueue: "mastra",
          childApiKey: process.env.OPENBOX_MASTRA_API_KEY,
          childAgentDid: process.env.OPENBOX_MASTRA_AGENT_DID,
          childAgentPrivateKey:
            process.env.OPENBOX_MASTRA_AGENT_PRIVATE_KEY,
        },
      },
      forwardContext: (ctx) => {
        pendingChildContext.set(ctx.parentActivityId, ctx);
        return { correlation_id: ctx.parentActivityId };
      },
    },
  },
});
```

| Field | Purpose |
| --- | --- |
| `enabled` | opt into multi-agent behavior |
| `parentAgentDid` | DID used as `from_agent_did`; falls back to runtime `agentDid` |
| `multiAgentSessionId` | string or resolver; defaults to `mas:${runId}` |
| `handoffTools` | static delegate tool to child agent map |
| `resolveHandoff` | dynamic delegate resolver |
| `forwardContext` | app-owned bridge for passing `OpenBoxMultiAgentContext` to the child runtime |

If child credentials are present, the SDK sends the `Handoff` request authenticated as the child. If they are absent, it surfaces the prepared handoff payload through `onEvent` so a remote child runtime can emit the handoff itself.

The child runtime still needs the same `multi_agent_session_id` and `parent_workflow_id`; forwarding that context is application glue, not automatic global state.

## DID Signing

When `agentDid` and `agentPrivateKey` are configured, the SDK signs OpenBox requests with:

| Header | Purpose |
| --- | --- |
| `X-OpenBox-Agent-DID` | agent DID |
| `X-OpenBox-Agent-Timestamp` | Unix timestamp |
| `X-OpenBox-Agent-Nonce` | replay-prevention nonce |
| `X-OpenBox-Body-SHA256` | body hash |
| `X-OpenBox-Agent-Signature` | Ed25519 signature |

Configure both DID values together. Partial DID configuration throws during config parsing.

## Next Steps

- [Integration Walkthrough](/developer-guide/copilotkit/integration-walkthrough)
- [Add OpenBox to CopilotKit](/getting-started/copilotkit/add-openbox-to-copilotkit)
- [Run the Demo](/getting-started/copilotkit/run-the-demo)
