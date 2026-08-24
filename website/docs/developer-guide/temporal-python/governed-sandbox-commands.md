---
title: Governed Sandbox Commands
description: "Route registered Temporal operations through enforced CONSTRAIN execution with OpenBoxPlugin and bounded Workflow history."
llms_description: Temporal command registration, CONSTRAIN interception, bounded results, and cleanup
sidebar_position: 6
tags:
  - sdk
  - temporal
  - governance
---

# Governed Sandbox Commands

The optional sandbox integration makes a `CONSTRAIN` verdict replace an admitted host operation with sandbox execution. Workflow code remains application code: `OpenBoxPlugin` intercepts the user Activity at the Worker boundary, derives an exact command from a registered profile, and returns a bounded result.

- `ALLOW` follows the application's normal host path.
- `CONSTRAIN` for a registered profile aborts the host action and dispatches the derived command to the sandbox.
- An unsupported or malformed constraint fails closed.
- A sandbox failure never retries on the host and never switches provider.

The default provider is the [`native` provider](./native-provider): Seatbelt (`sandbox-exec`) on macOS and bubblewrap on Linux. Additional providers are documented separately.

## Installation

Install the Temporal SDK with sandbox support:

```bash
pip install "openbox-temporal-sdk-python[sandbox]"
```

Install the verified `obs-<platform>` launcher and matching `openbox-sandbox-<platform>` service binary from an [OpenBox Sandbox release](https://github.com/OpenBox-AI/openbox-sandbox/releases). Keep the launcher, service binary, policy templates, `SHA256SUMS`, and SBOM files together so `obs` can verify and provision them. Rename or invoke the launcher as `obs`; do not substitute the service binary for it.

The native provider does **not** require Docker, a VM runtime, administrator access, or host CA trust. On Linux, install bubblewrap first; macOS includes `/usr/bin/sandbox-exec`.

## Provision the Runtime

Provisioning defaults to `native`:

```bash
obs provision --yes
obs status
obs verify
```

The explicit equivalent is:

```bash
obs provision --provider native --yes
```

You can also select it with the environment:

```bash
OPENBOX_PROVIDER=native obs provision --yes
```

`--provider` accepts `native` or an additional provider documented separately. `native` is always the default for a fresh configuration. The launcher does not fall back to another provider if the selected provider is unavailable.

Provisioning compiles and SHA-256-pins the selected policy, creates owner-only local mTLS material, starts the loopback service, runs a native smoke test, and writes:

```text
~/.config/openbox-sandbox/agent.env
```

Load those provider-neutral values into the Worker environment:

```bash
set -a
. "$HOME/.config/openbox-sandbox/agent.env"
set +a
```

See [Native Provider](./native-provider) for policy selection, verification, network behavior, and platform limitations.

## Register Command Profiles

The immutable registry is the application-owned admission boundary. It fixes the executable and argument grammar; Workflow input cannot select an arbitrary executable or pass free-form `argv`.

This zero-input profile is suitable for the `example.com` egress demo and for a behavioral `CONSTRAIN` replacement action:

```python title="command_registry.py"
from openbox.sandbox import (
    GovernedCommandDefinition,
    GovernedCommandRegistry,
    LiteralArgument,
)

command_registry = GovernedCommandRegistry(commands=(
    GovernedCommandDefinition(
        command_id="example-egress",
        executable="/usr/bin/curl",
        arguments=(
            LiteralArgument("--fail"),
            LiteralArgument("--silent"),
            LiteralArgument("--show-error"),
            LiteralArgument("https://example.com/"),
        ),
    ),
))
```

For data-bearing commands, use bounded identifier, enum, or decimal arguments and an optional `TypedJsonResultSchema`. The registry builds equivalent Temporal derivation and dispatcher admission profiles from one definition, so profile drift fails closed.

## Configure the Native Worker

Pass `SandboxConfig` to the same `OpenBoxPlugin` that owns governance and telemetry:

```python title="worker.py"
import asyncio
import os
from pathlib import Path

from openbox import OpenBoxPlugin
from openbox.sandbox import SandboxConfig
from temporalio.client import Client
from temporalio.worker import Worker

from activities import governed_request
from command_registry import command_registry
from workflows import GovernedWorkflow


async def main() -> None:
    client = await Client.connect(os.environ["TEMPORAL_ADDRESS"])

    worker = Worker(
        client,
        task_queue="agent-task-queue",
        workflows=[GovernedWorkflow],
        activities=[governed_request],
        plugins=[OpenBoxPlugin(
            openbox_url=os.environ["OPENBOX_URL"],
            openbox_api_key=os.environ["OPENBOX_API_KEY"],
            governance_policy="fail_closed",
            sandbox=SandboxConfig(
                registry=command_registry,
                service_config=Path(os.environ["OPENBOX_SANDBOX_CONFIG_PATH"]),
                policy=Path(os.environ["OPENBOX_SANDBOX_POLICY_FILE"]),
                ca=Path(os.environ["OPENBOX_SANDBOX_CA"]),
                certificate=Path(os.environ["OPENBOX_SANDBOX_CERT"]),
                private_key=Path(os.environ["OPENBOX_SANDBOX_KEY"]),
                timeout_seconds=300,
                heartbeat_interval_seconds=10.0,
            ),
        )],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

The plugin intercepts the application's Activity. It does not require a second Worker or a plugin-owned public Activity in Workflow code.

## Demo: Behavioral CONSTRAIN Interception

The demo target is `https://example.com/`.

1. Provision the dev allowlist template, which allows `/usr/bin/curl` to reach only `example.com:443`.
2. Register the zero-input `example-egress` profile shown above.
3. Configure a behavioral rule whose started hook returns `CONSTRAIN` and the `example-egress` profile for the governed host operation.
4. Run the Workflow and attempt the governed operation normally.
5. The started-hook verdict aborts the host action. The integration dispatches `example-egress` once through the native sandbox and attaches its outcome to the Activity result.
6. Open **Agent → Verify → Sessions → Tree** and inspect the child `sandbox_execution` span.

The expected application log includes the semantic evidence:

```text
Host action intercepted by behavioral CONSTRAIN; using sandbox execution outcome
```

The expected sandbox disposition is `executed_in_sandbox`; no host side effect occurs. A completed-hook `sandbox_execution` event is evidence of the replacement execution, not a second routing trigger.

## Result and Console Evidence

The bounded result reports the admitted profile, disposition, exit code, timeout and cleanup states, stdout/stderr byte counts, and values accepted by an optional typed-result schema. Raw command output and credentials remain outside Workflow history.

The `sandbox_execution` span provides the operational evidence:

| Evidence | What to check |
|---|---|
| Dispatch | provider `native`, profile ID, stable dispatch ID, `executed_in_sandbox` disposition |
| Process | exit code, timeout status, cleanup status, output byte counts and hashes |
| Network | `openbox.sandbox.egress.<n>.decision`, `.host`, and `.port` |
| Violations | macOS `openbox.sandbox.violations.count` and `.categories` when Seatbelt recorded denials |

Authorization and execution evidence are different. The span is correlated, bounded runtime evidence; it is not a portable signed execution receipt.

## Fail-Closed and History Boundaries

- Command profiles admit exact executables and bounded structured arguments; they never reconstruct a shell string.
- The dispatcher makes at most one possible execution dispatch for a dispatch ID.
- Unknown profiles, malformed arguments, unsupported constraints, nonterminal execution, invalid results, and provider failures execute nowhere else.
- Cancellation waits for provider-owned cleanup. If terminal absence cannot be confirmed, cleanup remains pending for reconciliation without another command dispatch.
- A zero-host deployment must ensure the applicable Core result is `CONSTRAIN`. An `ALLOW` result follows the application's normal host path by design.
- Temporal retries must not be used to repeat an indeterminate side effect; reconcile external state instead.

## Related

- **[Native Provider](./native-provider)** — install, provision, policies, egress, monitoring, and limitations
- **[Configuration](./configuration)** — `OpenBoxPlugin` and `SandboxConfig` options
- **[Error Handling](./error-handling)** — terminal and indeterminate command failures
- **[Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution)** — integration-neutral governance model
