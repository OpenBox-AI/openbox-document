---
title: Configuration
description: "Configure OpenBox CopilotKit integration credentials, adapter options, approvals, and runtime behavior."
llms_description: CopilotKit OpenBox configuration reference
sidebar_position: 2
tags:
  - sdk
  - copilotkit
  - configuration
---

# Configuration

The CopilotKit integration can be configured through environment variables or explicit options passed to `createOpenBoxCopilotKitAdapter()`, `createOpenBoxCopilotRuntime()`, `createOpenBoxApprovalRoute()`, and `createOpenBoxReadinessCheck()`.

## Configuration Precedence

Configuration is resolved in this order:

1. Explicit options passed in code
2. Environment variables
3. SDK defaults for optional fields

Runtime governance requires an OpenBox Core URL and an agent runtime key.

## Environment Variables

### Runtime Governance

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENBOX_ENABLED` | No | adapter default | Enable or disable OpenBox. The adapter treats `OPENBOX_ENABLED=true` as enabled when no explicit config is provided. |
| `OPENBOX_CORE_URL` | Yes when enabled | - | OpenBox Core base URL for governance evaluation |
| `OPENBOX_API_KEY` | Yes when enabled | - | Agent runtime key, `obx_live_*` or `obx_test_*` |
| `OPENBOX_AGENT_DID` | Yes, unless disabled | - | DID assigned to this OpenBox agent |
| `OPENBOX_AGENT_PRIVATE_KEY` | Yes, unless disabled | - | Base64 raw Ed25519 private key returned during identity provision or rotation |

### CopilotKit And LangGraph

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `AGENT_URL` | No | `http://localhost:8123` | LangGraph backend URL used by the CopilotKit runtime |
| `LANGGRAPH_DEPLOYMENT_URL` | No | - | alternative LangGraph deployment URL |
| `LANGSMITH_API_KEY` | No | empty | LangSmith key when the LangGraph deployment requires it |
| `OPENAI_BASE_URL` | Usually | - | OpenAI-compatible provider base URL for the reference agent |
| `OPENAI_MODEL` | Usually | - | chat model for the reference agent |
| `OPENAI_API_KEY` | Usually | - | model provider API key |

### Platform And Approvals

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENBOX_API_URL` | Only for readiness or inline approval decisions | - | OpenBox platform/backend API URL |
| `OPENBOX_BACKEND_API_KEY` | Only for readiness or inline approval decisions | - | org/backend key, `obx_key_*` |
| `OPENBOX_AGENT_ID` | Only for readiness or inline approval decisions | - | platform agent ID |

Runtime governance uses `OPENBOX_CORE_URL` and `OPENBOX_API_KEY`. Inline approval decisions use `OPENBOX_API_URL`, `OPENBOX_BACKEND_API_KEY`, and `OPENBOX_AGENT_ID`.

## Adapter Options

| Option | Default | Use it to |
| --- | --- | --- |
| `enabled` | `OPENBOX_ENABLED` or auto-enabled when a Core client is present | enable or disable OpenBox explicitly |
| `coreUrl` | `OPENBOX_CORE_URL` | set the OpenBox Core URL |
| `apiKey` | `OPENBOX_API_KEY` | set the agent runtime key |
| `agentIdentity` | `OPENBOX_AGENT_DID` + `OPENBOX_AGENT_PRIVATE_KEY` | sign OpenBox requests with the registered agent identity |
| `coreTimeoutMs` | Core client default | set governance evaluation timeout |
| `apiUrl` | `OPENBOX_API_URL` | set platform/backend API URL for readiness and approval decisions |
| `backendApiKey` | `OPENBOX_BACKEND_API_KEY` | set platform/backend key for readiness and approval decisions |
| `backendTimeoutMs` | backend client default | set platform/backend timeout |
| `agentId` | `OPENBOX_AGENT_ID` | identify the platform agent for readiness and approvals |
| `clientName` | `openbox-copilotkit` | label SDK traffic |
| `agentWorkflowType` | `CopilotKitAgent` | set workflow type for runtime or LangGraph backend sessions |
| `taskQueue` | `copilotkit` | set the OpenBox task queue label |
| `selfGovernedToolNames` | OpenBox default governed tool names | prevent recursive self-governance for OpenBox-owned tools |
| `governanceMode` | `enforce` | evaluate in observe or enforce mode |
| `failClosed` | `true` | choose runtime behavior when OpenBox is unavailable |
| `strict` | `true` | keep strict validation and enforcement behavior |

## Recommended Runtime Setup

```ts
import {
  createOpenBoxCopilotKitAdapter,
  createOpenBoxCopilotRuntime,
} from "openbox-sdk/copilotkit";

const adapter = createOpenBoxCopilotKitAdapter({
  agentWorkflowType: "CopilotKitRuntime",
  taskQueue: "copilotkit-runtime",
  selfGovernedToolNames: [
    "openbox_governed_action",
    "openbox_governed_approval_action",
    "openbox_resume_governed_action",
  ],
  clientName: "my-copilotkit-app",
  coreTimeoutMs: 180_000,
});

const openboxRuntime = createOpenBoxCopilotRuntime({
  runtime,
  runner,
  agents: ["default"],
  adapter,
});
```

## Agent DID Identity

Newly created OpenBox agents require cryptographic DID signing by default. When signing is enabled for the registered agent, set both values:

```bash title=".env"
OPENBOX_AGENT_DID=did:aip:550e8400-e29b-41d4-a716-446655440000
OPENBOX_AGENT_PRIVATE_KEY=base64_raw_ed25519_private_key
```

Rules:

- set `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY` together
- store the private key in a secret manager or runtime secret store
- never commit the private key
- rotate the key from OpenBox if it is exposed
- omit both values only when signing is disabled for the registered agent

## Approval Decisions

Use `createOpenBoxApprovalRoute()` when CopilotKit renders a human approval control that should call back into OpenBox:

```ts title="src/app/api/openbox/approvals/decide/route.ts"
import { NextResponse } from "next/server";
import { createOpenBoxApprovalRoute } from "openbox-sdk/copilotkit";

const approvalRoute = createOpenBoxApprovalRoute({
  clientName: "my-copilotkit-app",
  backendTimeoutMs: 180_000,
});

export async function POST(request: Request) {
  const body = await request.json();
  const resolved = await approvalRoute.decide({
    governanceEventId: body.governanceEventId,
    decision: body.decision,
  });

  return NextResponse.json({
    ok: true,
    eventId: resolved.eventId,
  });
}
```

This route requires `OPENBOX_API_URL`, `OPENBOX_BACKEND_API_KEY`, and a `governanceEventId`.

## Failure Policy

For production, choose the failure policy intentionally:

| Setting | Behavior |
| --- | --- |
| `governanceMode: "enforce"` | OpenBox verdicts affect execution |
| `governanceMode: "observe"` | OpenBox observes decisions without enforcing them |
| `failClosed: true` | unavailable OpenBox governance prevents governed execution |
| `failClosed: false` | unavailable OpenBox governance allows execution to continue |

## Next Steps

- [Integration Walkthrough](/developer-guide/copilotkit/integration-walkthrough)
- [Add OpenBox to CopilotKit](/getting-started/copilotkit/add-openbox-to-copilotkit)
- [LangGraph Developer Guide](/developer-guide/langgraph)
