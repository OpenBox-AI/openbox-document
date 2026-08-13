---
title: Sandbox Execution
description: "How a CONSTRAIN verdict can hand an operation to a rootless, client-owned container for execution over an mTLS create-exec-delete lifecycle instead of running it in-process."
llms_description: Rootless container execution for CONSTRAIN verdicts, client-owned, mTLS create-exec-delete lifecycle (Alpha)
sidebar_position: 6
tags:
  - governance
  - guardrails
---

# Sandbox Execution

:::tip 🆕 New page in this review
Everything on this page is new.
:::

:::info Alpha
Sandbox Execution is in Alpha. Configuration is SDK/environment-based today; there is no dashboard toggle for it yet.
:::

For an operation type with a sandbox-capable integration, a [CONSTRAIN](/core-concepts/governance-decisions#constrain) verdict with exactly `constraints: ["run_in_sandbox"]` can route the operation to the **Sandbox** instead of executing it in-process. The client-owned, rootless container is reached over mTLS and returns a bounded, typed result. Integrations without an enforcement path must fail closed; they must not treat `CONSTRAIN` as `ALLOW`.

## Why Isolation Instead Of A Bare Constraint

`CONSTRAIN` describes a required enforcement outcome, not one universal execution mechanism. Some integrations enforce a transformed input or another bounded control. Sandbox Execution is for registered operation types whose constraint is isolation—for example, code execution or access to resources that a lower-trust-tier operation must not reach directly.

## How It Works

```mermaid
flowchart TD
    op["<b>Operation</b>"]
    verdict["<b>CONSTRAIN</b>"]
    create["mTLS create<br/>fresh rootless container"]
    exec["exec<br/>operation runs in isolation"]
    delete["delete<br/>container torn down"]
    result["Bounded, typed result"]
    sdk["Returned to the SDK"]

    op --> verdict --> create --> exec --> delete --> result --> sdk
```

1. A policy builder rule returns `CONSTRAIN` with exactly the `run_in_sandbox` constraint for a registered, sandbox-capable operation.
2. Over mTLS, the integration has a fresh, rootless container **created** on your Sandbox infrastructure.
3. The integration sends the admitted operation into that container, which **exec**s it under rootless isolation and produces a bounded, typed result, not an arbitrary payload.
4. The container is **deleted** after execution; nothing persists between executions, and cleanup remains explicit if deletion fails.
5. The integration returns only its bounded result contract to the caller.

Each execution goes through this same three-step lifecycle (mTLS create → exec → delete) over a mutually authenticated connection; no container is reused across operations.

## Client-Owned, Not OpenBox-Hosted

The Sandbox container runs in infrastructure you own and operate. OpenBox does not execute your code; it directs eligible operations to your container over mTLS and governs the result the same way it governs any other operation output.

## Configuring It

The execution integration is configured through SDK and deployment settings on the agent's runtime, not through a dashboard sandbox toggle. Temporal Python supports the model for [registered governed commands](/developer-guide/temporal-python/governed-sandbox-commands): add `OpenBoxPlugin` to the native Worker, pass it a `SandboxConfig`, and provide an immutable `GovernedCommandRegistry`. Ordinary Temporal actions do not become sandbox-capable.

Create the routing rule in **Agent → Authorize → Policies** with the visual policy builder. Selecting **CONSTRAIN** produces `constraints: ["run_in_sandbox"]`; add conditions such as an `activity_type` match to limit which registered operation is routed.

## Behavioral Rules

`sandbox_execution` is available as a behavioral-rule trigger and required-prior-state type. The span is recorded after sandbox execution, so a behavioral rule reacts to that evidence; it does not cause the original command to enter the sandbox. Use the policy's `CONSTRAIN` decision for pre-execution routing.

## Console Evidence

In **Agent → Verify → Sessions → Tree**, a sandbox execution appears as a `sandbox_execution` span on the activity. The tree and span detail surface:

- `openbox.sandbox.disposition`, such as `executed_in_sandbox`
- `openbox.sandbox.exit_code`
- bounded `openbox.sandbox.stdout` and `openbox.sandbox.stderr` content, plus byte counts
- typed result attributes under `openbox.sandbox.result.<field>`
- `http.response.status_code` as the status badge when the typed result contains `http_status`; otherwise the badge shows the exit code

The detail panel also retains lifecycle metadata such as cleanup status, timeout status, profile, and sandbox ID when present.

## Related

- **[Governance Decisions](/core-concepts/governance-decisions)**: The CONSTRAIN verdict this feature hangs off of
- **[Authorize Phase](/trust-lifecycle/authorize)**: Where CONSTRAIN fits in the full pipeline
- **[Temporal governed commands](/developer-guide/temporal-python/governed-sandbox-commands)**: Temporal-specific registration, history, and zero-host requirements
