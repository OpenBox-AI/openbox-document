---
title: Demo Walkthrough
description: "Replace a governed payment-batch host action with one native sandbox request to example.com."
llms_description: Payment batch behavioral CONSTRAIN interception demo
tags:
  - sdk
  - temporal
  - governance
---

# Demo Walkthrough

This demo attempts a `post_payment_batch` Activity and uses behavioral `CONSTRAIN` interception to replace its host action with the registered `example-egress` command. The command reaches only `https://example.com/` through the `native` provider.

## 1. Provision the Demo Policy

Provision `policy-allow-network-dev.yaml`. It allows `/usr/bin/curl` to reach `example.com:443` and denies other destinations covered by the policy:

```bash
obs provision --provider native --clean-rerun --yes \
  --policy-file "$PWD/policy-allow-network-dev.yaml"

set -a
. "$HOME/.config/openbox-sandbox/agent.env"
set +a
```

## 2. Register and Configure the Worker

Use the zero-input `example-egress` profile and the single-Worker `OpenBoxPlugin(..., sandbox=SandboxConfig(...))` setup from [Command Profiles](./command-profiles). Set `governance_policy="fail_closed"` so a governance-service failure cannot release the host action.

## 3. Configure Behavioral Interception

Configure the behavioral started hook for the governed `post_payment_batch` operation to return:

- verdict `CONSTRAIN`; and
- replacement profile `example-egress`.

The started hook runs before the Activity side effect. A `sandbox_execution` event emitted after completion is evidence of the replacement execution; it is not a second routing trigger.

## 4. Run the Payment Batch

Start the Worker and submit the payment-batch Workflow as the demo application expects:

```bash
uv run python .
```

The application attempts `post_payment_batch` normally. It does not invoke `curl` itself or schedule a separate sandbox Activity.

## 5. Follow the Interception

For the constrained attempt, the integration:

1. receives the started-hook `CONSTRAIN` verdict and registered profile;
2. aborts `post_payment_batch` before its host side effect;
3. derives the exact `/usr/bin/curl` argument vector from `example-egress`;
4. dispatches it at most once through the `native` provider;
5. waits for terminal cleanup; and
6. attaches the bounded sandbox outcome to the Activity result.

The expected application log includes:

```text
Host action intercepted by behavioral CONSTRAIN; using sandbox execution outcome
```

The result disposition is `executed_in_sandbox`. No payment-batch host side effect occurs. If the profile is missing, the constraint is malformed, the provider fails, or the result is invalid or indeterminate, the operation fails closed and executes nowhere else.

## 6. Inspect the Session

Open **Agent → Verify → Sessions → Tree**, select the payment-batch session, and expand the child `sandbox_execution` span. Continue to [Console Evidence](./console-evidence) for the fields to check.
