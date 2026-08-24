---
title: Console Evidence
description: "Inspect bounded sandbox execution evidence in the OpenBox session tree."
llms_description: Sandbox execution span keys, result bounds, and evidence limits
tags:
  - sdk
  - temporal
  - governance
---

# Console Evidence

The `sandbox_execution` span records the bounded result of one admitted sandbox dispatch.

## Open the Span

1. Open **Agent > Verify > Sessions > Tree**.
2. Select the governed session.
3. Expand the `sandbox_execution` child span under the governed Activity.

For the [payment-batch demo](./demo-walkthrough), confirm two facts first:

- The Activity did not complete through its host path.
- `openbox.sandbox.disposition` is `executed_in_sandbox`.

## Check the Evidence

| Evidence group | Fields to check |
|---|---|
| Dispatch | Provider `native`, profile `example-egress`, stable dispatch identity, and `openbox.sandbox.disposition=executed_in_sandbox` |
| Process | `openbox.sandbox.exit_code`, timeout status, cleanup status, and bounded stdout and stderr byte counts and hashes |
| Network | `openbox.sandbox.egress.<n>.decision`, `openbox.sandbox.egress.<n>.host`, and `openbox.sandbox.egress.<n>.port` |
| Violations | `openbox.sandbox.violations.count` and `openbox.sandbox.violations.categories` when macOS Seatbelt records denials |
| Typed result | Accepted values under `openbox.sandbox.result.<field>` when the profile defines a `TypedJsonResultSchema` |

The demo network destination is `example.com:443`.

The bounded Activity result contains these values:

- Admitted profile
- Disposition
- Exit code
- Timeout status
- Cleanup status
- Standard output and standard error byte counts
- Values accepted by an optional typed-result schema

Raw command output and credentials do not enter Workflow history.

## Interpret the Evidence

Authorization and execution provide separate evidence:

- The started-hook `CONSTRAIN` verdict explains why the integration replaced the host action.
- The child `sandbox_execution` span records the bounded runtime outcome.
- A completed-hook event records the execution after completion. It must not dispatch the command again.

The span is correlated operational evidence. It is not a portable signed execution receipt. It is also not a kernel teardown attestation.

Treat the command as indeterminate when cleanup or terminal absence is uncertain. Reconcile external state without another dispatch.
