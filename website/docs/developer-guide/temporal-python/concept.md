---
title: Concept
description: "How governed Temporal commands replace host actions with fail-closed sandbox execution."
llms_description: Governed command isolation, provider selection, fail-closed behavior, and at-most-once dispatch
tags:
  - sdk
  - temporal
  - governance
---

# Governed Sandbox Commands

The optional sandbox integration lets a `CONSTRAIN` verdict replace an admitted host operation with sandbox execution. `OpenBoxPlugin` intercepts the application's Activity at the Worker boundary, derives an exact command from a registered profile, and returns a bounded result to Workflow code.

- `ALLOW` follows the application's normal host path.
- `CONSTRAIN` for a registered profile aborts the host action and dispatches the derived command to the sandbox.
- Unsupported or malformed constraints fail closed.
- A failed sandbox dispatch never retries on the host or switches provider.

The default provider is [`native`](./native-provider): Seatbelt (`sandbox-exec`) on macOS and bubblewrap on Linux. The optional [OpenShell provider](./openshell-provider) adds a microVM boundary.

## One Dispatch, No Fallback

The dispatcher makes at most one possible execution dispatch for each stable dispatch ID. Unknown profiles, malformed arguments, unsupported constraints, nonterminal execution, invalid results, and provider failures execute nowhere else.

Cancellation waits for provider-owned cleanup. If terminal absence cannot be confirmed, cleanup remains pending for reconciliation; the integration does not issue another command dispatch. Do not use Temporal retries to repeat an indeterminate side effect. Reconcile the external state instead.

A zero-host deployment must ensure the applicable Core result is `CONSTRAIN`. An `ALLOW` result uses the normal host path by design.

## Continue the Journey

1. [Run the five-command quick start](./quick-start).
2. [Provision and verify a provider](./provisioning).
3. [Register admitted command profiles](./command-profiles).
4. [Walk through behavioral `CONSTRAIN` interception](./demo-walkthrough).
5. [Read the console evidence](./console-evidence).
