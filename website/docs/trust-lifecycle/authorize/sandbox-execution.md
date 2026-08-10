---
title: Sandbox Execution
description: "How a CONSTRAIN verdict can hand an operation to a rootless, client-owned container for execution over an mTLS create-exec-delete lifecycle instead of running it in-process."
llms_description: Rootless container execution for CONSTRAIN verdicts, client-owned, mTLS create-exec-delete lifecycle
sidebar_position: 6
tags:
  - governance
  - guardrails
---

# Sandbox Execution

For an operation type with a sandbox-capable integration, a [CONSTRAIN](/core-concepts/governance-decisions#constrain) verdict can route the operation to the **Sandbox** instead of executing it in-process. The client-owned, rootless container is reached over mTLS and returns a bounded, typed result. Integrations without an enforcement path must fail closed; they must not treat `CONSTRAIN` as `ALLOW`.

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

1. The authorization pipeline returns exact `CONSTRAIN` for a registered, sandbox-capable operation.
2. Over mTLS, the integration creates a fresh, rootless container on your Sandbox infrastructure.
3. The integration executes the admitted operation in that container and accepts only a bounded, typed result.
4. The container is deleted after execution; cleanup remains explicit if deletion fails.
5. The integration returns only its bounded result contract to the caller.

Each execution goes through this same three-step lifecycle (mTLS create → exec → delete) over a mutually authenticated connection; no container is reused across operations.

## Client-Owned, Not OpenBox-Hosted

The Sandbox container runs in infrastructure you own and operate. OpenBox does not execute your code; it directs eligible operations to your container over mTLS and governs the result the same way it governs any other operation output.

## Configuring It

Sandbox Execution is configured through SDK and deployment settings, not through a dashboard form. Check the framework-specific guide for availability. Temporal Python supports the model for [registered governed commands](/developer-guide/temporal-python/governed-sandbox-commands); ordinary Temporal actions do not become sandbox-capable.

## Related

- **[Governance Decisions](/core-concepts/governance-decisions)**: The CONSTRAIN verdict this feature hangs off of
- **[Authorize Phase](/trust-lifecycle/authorize)**: Where CONSTRAIN fits in the full pipeline
- **[Temporal governed commands](/developer-guide/temporal-python/governed-sandbox-commands)**: Temporal-specific registration, history, and zero-host requirements
