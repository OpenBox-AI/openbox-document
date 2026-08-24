---
title: Console Evidence
description: "Read bounded sandbox execution evidence in the OpenBox session tree."
llms_description: sandbox_execution span keys, result bounds, and evidence limits
tags:
  - sdk
  - temporal
  - governance
---

# Console Evidence

Open **Agent → Verify → Sessions → Tree** and expand the `sandbox_execution` child span beneath the governed Activity. For the [payment-batch demo](./demo-walkthrough), first confirm that the Activity did not complete on its host path and that the sandbox disposition is `executed_in_sandbox`.

## Read the Span

| Evidence | What to check |
|---|---|
| Dispatch | Provider `native`, admitted profile `example-egress`, stable dispatch identity, and `openbox.sandbox.disposition=executed_in_sandbox` |
| Process | `openbox.sandbox.exit_code`, timeout status, cleanup status, and bounded stdout/stderr byte counts and hashes |
| Network | `openbox.sandbox.egress.<n>.decision`, `openbox.sandbox.egress.<n>.host`, and `openbox.sandbox.egress.<n>.port`; the demo destination is `example.com:443` |
| Violations | `openbox.sandbox.violations.count` and `openbox.sandbox.violations.categories` when macOS Seatbelt recorded denials |
| Typed result | Accepted values under `openbox.sandbox.result.<field>` when the command profile defines a `TypedJsonResultSchema` |

The bounded Activity result reports the admitted profile, disposition, exit code, timeout and cleanup states, stdout/stderr byte counts, and values accepted by an optional typed-result schema. Raw command output and credentials remain outside Workflow history.

## Interpret the Evidence

Authorization and execution answer different questions:

- The started-hook `CONSTRAIN` verdict records why the host action was replaced.
- The child `sandbox_execution` span records the bounded runtime outcome.
- A completed-hook event records that execution after it happened; it must not dispatch the command again.

The span is correlated operational evidence. It is not a portable signed execution receipt or kernel teardown attestation. If cleanup or terminal absence is uncertain, treat the command as indeterminate and reconcile external state without another dispatch.
