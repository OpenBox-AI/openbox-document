---
title: Concept
description: "Learn how OpenBox routes governed commands through sandbox providers."
llms_description: Sandbox routing, providers, evidence, and fail-closed behavior
tags:
  - sdk
  - temporal
  - governance
---

# Governed Sandbox Commands

OpenBox can replace a governed host action with an admitted command in an isolated sandbox.

## One Dispatch, No Fallback

Each governed operation receives one verdict:

- **ALLOW:** The operation runs on the host.
- **CONSTRAIN:** The host action is aborted. OpenBox dispatches the admitted command to the sandbox.
- **BLOCK or HALT:** The operation stops without execution.
- **REQUIRE_APPROVAL:** The operation waits for an approval decision.

A behavioral started hook returns `CONSTRAIN` before the host side effect. The integration then aborts the host action and dispatches the registered command. A completed hook records the result. It does not dispatch the command again.

A constrained command never runs on the host. A sandbox failure also never releases the host action.

## Sandbox Isolation

A sandbox limits access to host resources. Its policy defines the permitted files and network destinations. The provider denies access that the policy does not permit.

The default `native` provider uses operating system isolation:

- **macOS:** Seatbelt through `sandbox-exec`.
- **Linux:** bubblewrap.

The optional `openshell` provider uses a microVM. Provider selection does not change the governance routing rules.

## Command Admission

The application registers each permitted command before the Worker starts. A command profile fixes the executable and its argument grammar. Workflow input cannot provide an arbitrary executable or a shell command string.

OpenBox invokes the admitted argument vector directly. It does not reconstruct a shell command.

## Safety Properties

1. **Fail-closed execution:** A constrained command runs only in the selected sandbox. If policy validation, dispatch, execution, or cleanup fails, the operation fails closed.
2. **At-most-once dispatch:** Each command has a stable dispatch identity. Retries and duplicate requests cannot cause a second dispatch.
3. **Bounded evidence:** OpenBox records bounded output data, process status, cleanup status, network decisions, and available isolation violations.

## Providers

- **`native` (default):** Uses Seatbelt on macOS and bubblewrap on Linux.
- **`openshell` (optional):** Uses a microVM for a guest-kernel boundary.

Select a provider with `--provider native|openshell` or `OPENBOX_PROVIDER`. OpenBox does not switch providers after a provisioning or execution failure.

## Next Steps

- [Quick Start](./quick-start)
- [Provisioning](./provisioning)
- [Command Profiles](./command-profiles)
- [Demo Walkthrough](./demo-walkthrough)
- [Console Evidence](./console-evidence)
