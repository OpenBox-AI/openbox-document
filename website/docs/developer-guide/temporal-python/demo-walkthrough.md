---
title: Demo Walkthrough
description: "Replace a payment-batch host action with one sandbox request to example.com."
llms_description: Payment-batch behavioral CONSTRAIN interception demo
tags:
  - sdk
  - temporal
  - governance
---

# Demo Walkthrough

This demo replaces the `post_payment_batch` host action with the registered `example-egress` sandbox command.

## Expected Behavior

The command uses the `native` provider to request `https://example.com/`. The development policy permits only `/usr/bin/curl` to reach `example.com:443`.

A behavioral started hook returns `CONSTRAIN` before the Activity side effect. The integration aborts the host action. It then dispatches the sandbox command at most once.

## Run the Demo

### 1. Provision the Development Policy

Provision the development allowlist. Then load the generated environment.

```bash
obs provision --provider native --clean-rerun --yes \
  --policy-file "$PWD/policy-allow-network-dev.yaml"

set -a
. "$HOME/.config/openbox-sandbox/agent.env"
set +a
```

### 2. Register the Command and Worker

Use the zero-input `example-egress` profile from [Command Profiles](./command-profiles).

Use one `OpenBoxPlugin(..., sandbox=SandboxConfig(...))` instance. Set `governance_policy="fail_closed"`. A governance service failure must not release the host action.

### 3. Configure Behavioral Interception

Configure the behavioral started hook for `post_payment_batch` with these values:

- Verdict: `CONSTRAIN`
- Replacement profile: `example-egress`

A `sandbox_execution` event is completion evidence. It is not another routing trigger.

### 4. Start the Demo

Start the Worker and submit the payment-batch Workflow:

```bash
uv run python .
```

The application attempts `post_payment_batch` normally. It does not invoke `curl`. It also does not schedule a separate sandbox Activity.

## Interception Sequence

For a constrained attempt, the integration performs these actions:

1. Receives the started-hook `CONSTRAIN` verdict and registered profile.
2. Aborts `post_payment_batch` before its host side effect.
3. Derives the exact `/usr/bin/curl` argument vector from `example-egress`.
4. Dispatches the command at most once through the `native` provider.
5. Waits for terminal cleanup.
6. Adds the bounded sandbox outcome to the Activity result.

The application log includes:

```text
Host action intercepted by behavioral CONSTRAIN; using sandbox execution outcome
```

The result disposition is `executed_in_sandbox`. The payment-batch host side effect does not occur.

The operation fails closed if any of these conditions occurs:

- The profile is missing.
- The constraint is malformed.
- The provider fails.
- The result is invalid or indeterminate.

The integration does not execute the operation on another provider or on the host.

## Inspect the Session

1. Open **Agent > Verify > Sessions > Tree**.
2. Select the payment-batch session.
3. Expand the child `sandbox_execution` span.
4. Use [Console Evidence](./console-evidence) to verify the recorded fields.
