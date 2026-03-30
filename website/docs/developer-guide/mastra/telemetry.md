---
title: Telemetry
description: "See what operational telemetry the OpenBox Mastra SDK captures and how it appears in OpenBox."
llms_description: Mastra SDK telemetry capture and runtime behavior
sidebar_position: 6
tags:
  - sdk
  - mastra
  - observability
---

# Telemetry

The Mastra SDK uses OpenTelemetry to attach operational evidence to governed runs. This is what lets OpenBox show HTTP calls, data access, file operations, and traced functions alongside workflow and activity events.

## Capture Surfaces

### HTTP

By default, the SDK captures:

- outbound HTTP requests
- status codes
- timing
- text request and response bodies
- relevant headers

This is the primary path for model provider traffic and external service calls.

### Databases

Database instrumentation is enabled by default for supported libraries. Use it to surface query behavior in operator timelines without writing custom tracing code.

### File I/O

File instrumentation is optional and disabled by default. Turn it on only when you have a concrete file-governance requirement.

### Custom Functions

For work that does not naturally appear as a tool or workflow boundary, use `traced()` to create a span that OpenBox can attach to the surrounding execution.

```ts
import { traced } from "@openbox-ai/openbox-mastra-sdk";

const sendEmail = traced(async function sendEmail(input: { to: string }) {
  return { delivered: true, to: input.to };
});
```

## Where Telemetry Appears

Telemetry is attached to the surrounding activity, signal, or workflow context.

That means:

- tool-related telemetry is usually attached to the tool activity
- agent-only model telemetry is associated with `SignalReceived(agent_output)` and workflow summary events
- internal telemetry does not create a new business activity row by itself

## Why Tool Health Can Be Empty

Tool health is only meaningful for agents that actually execute tools. If an agent only orchestrates or only performs model generation, you should not expect tool health metrics for that run.

## Why Model Usage Can Differ By Run Type

- An orchestrator or gateway may have no direct model usage if it only routes work.
- Child agent runs can still carry model and token usage.
- Agent-only model work shows up on the agent signal and workflow path, not as a separate tool activity.

## Recommended Defaults

| Setting | Recommended value |
| --- | --- |
| HTTP capture | Enabled |
| Database instrumentation | Enabled |
| File I/O instrumentation | Disabled until needed |
| Traced functions | Use selectively for meaningful custom operations |

## Privacy And Noise Control

Use these levers when telemetry is too noisy or too sensitive:

- disable file instrumentation unless needed
- use skip lists for known low-value workflow or signal traffic
- avoid tracing helper functions that do not matter to operators

## Next Steps

- [Configuration](/developer-guide/mastra/configuration)
- [Event Model](/developer-guide/mastra/event-model)
- [Troubleshooting](/developer-guide/mastra/troubleshooting)
