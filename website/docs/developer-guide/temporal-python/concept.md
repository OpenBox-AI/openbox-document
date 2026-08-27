---
title: Concept
description: "Learn how OpenBox routes governed commands through sandbox providers."
llms_description: Sandbox routing, providers, evidence, and fail-closed behavior
tags:
  - sdk
  - temporal
  - governance
---

# Concept

OpenBox can replace a governed host action with an admitted command in an isolated sandbox.

## One dispatch, no fallback

Each governed operation receives one verdict:

- **ALLOW:** The operation runs on the host.
- **CONSTRAIN:** OpenBox aborts the host action. It dispatches the admitted command to the sandbox.
- **BLOCK or HALT:** The operation stops without execution.
- **REQUIRE_APPROVAL:** The operation waits for approval.

A completed hook records the result. It does not dispatch the command again.

A constrained command never runs on the host. A sandbox failure also never releases the host action.

## What happens during interception

For one constrained attempt, the integration performs these actions:

1. Receives the `CONSTRAIN` verdict before the activity side effect.
2. Stops the host activity before its body runs.
3. Derives the exact argument vector from the registry.
4. Dispatches the command one time through the selected provider.
5. Waits for cleanup and terminal absence.
6. Returns the bounded sandbox outcome as the activity result.

Two rule types produce that verdict. A policy rule matches the activity and takes the profile from the activity input. A behavior rule supplies the profile itself, and its command takes no input.

The operation fails closed if the profile is missing, the constraint is malformed, the provider fails, or the result is invalid or indeterminate.

## Sandbox isolation

A sandbox limits access to host resources. Its policy defines the permitted files and network destinations. The provider denies access that the policy does not permit.

The native provider (`native`) uses these controls of the operating system:

- **macOS:** Seatbelt through `sandbox-exec`.
- **Linux:** bubblewrap.

The optional OpenShell provider (`openshell`) uses a microVM, which adds a guest-kernel boundary. The selection of a provider does not change the rules for governance routing.

## Command admission

The application registers each permitted command before the Worker starts. A command profile specifies the executable and its argument grammar.

Workflow input cannot provide an arbitrary executable. It also cannot provide a shell command string.

OpenBox invokes the admitted argument vector directly. It does not reconstruct a shell command.

## Safety properties

1. **Fail-closed execution:** A constrained command runs only in the selected sandbox. The operation fails closed if policy validation, dispatch, execution, or cleanup fails.
2. **At-most-once dispatch:** Each command has a stable dispatch identity. Retries and duplicate requests cannot cause a second dispatch.
3. **Bounded evidence:** OpenBox records bounded output data, process status, cleanup status, network verdicts, and available isolation violations.

## Selecting a provider

Select a provider with `--provider native|openshell` or `OPENBOX_PROVIDER`. OpenBox does not switch providers after a provisioning or execution failure.

## Next steps

- [Quick Start](./quick-start)
- [Provisioning](./provisioning)
- [Command Profiles](./command-profiles)
- [Console Evidence](./console-evidence)
