---
title: Console Evidence
description: "Inspect bounded sandbox execution evidence in the OpenBox session tree."
llms_description: Evidence keys, result limits, and evidence limits for sandbox execution spans
tags:
  - sdk
  - temporal
  - governance
---

# Console Evidence

The `sandbox_execution` span records the bounded result of one admitted sandbox dispatch.

## 1. Open the span

1. Open **Agent > Verify > Sessions > Tree**.
2. Select the governed session.
3. Expand the `sandbox_execution` child span under the governed Activity.

For the [Quick Start](./quick-start) example, confirm these two facts first:

- The Activity did not complete through its host path.
- `openbox.sandbox.disposition` is `executed_in_sandbox`.

## 2. Check the evidence

| Evidence group | Fields to check |
|---|---|
| Dispatch | The `native` provider, profile `post-batch`, stable dispatch identity, and `openbox.sandbox.disposition=executed_in_sandbox` |
| Process | `openbox.sandbox.exit_code`, timeout status, cleanup status, and bounded stdout and stderr byte counts and hashes |
| Network | `openbox.sandbox.egress.count`, and `openbox.sandbox.egress.<n>.decision`, `openbox.sandbox.egress.<n>.host`, and `openbox.sandbox.egress.<n>.port` for each request |
| Violations | `openbox.sandbox.violations.count` and `openbox.sandbox.violations.categories` when macOS Seatbelt records denials |

The span carries no typed result values. Core admits only the allowlisted `openbox.sandbox.*` attributes above. Typed values reach the bounded Activity result instead.

The network destination for the example is `example.com:443`.

The bounded Activity result contains these values:

- The admitted profile
- The disposition
- The exit code
- The timeout status
- The cleanup status
- The byte counts for standard output and standard error
- The values accepted by an optional schema for typed results

Raw command output and credentials do not enter Workflow history.

## Interpret the evidence

Authorization and execution provide separate evidence:

- The started-hook `CONSTRAIN` verdict explains why the integration replaced the host action.
- The child `sandbox_execution` span records the bounded runtime outcome.
- A completed-hook event records the execution after completion. It must not dispatch the command again.

The span is correlated operational evidence. It is not a portable signed execution receipt. It is not a kernel teardown attestation.

Treat the command as indeterminate when cleanup or terminal absence is uncertain. Reconcile the external state without another dispatch.
