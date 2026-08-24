---
title: Command Profiles
description: "Register exact commands and connect the registry to OpenBoxPlugin."
llms_description: Governed command registry and SandboxConfig Worker configuration
tags:
  - sdk
  - temporal
  - governance
---

# Command Profiles

A command profile defines the exact executable and permitted argument grammar for sandbox dispatch.

## Admission Rules

The application owns an immutable command registry. Workflow input cannot select an arbitrary executable. It also cannot provide a free-form argument vector.

The integration invokes the admitted argument vector directly. It never reconstructs a shell command string.

For command input, use bounded identifier, enum, or decimal arguments. You can also define a `TypedJsonResultSchema` for output. One command definition creates matching Temporal derivation and dispatcher admission profiles. Any profile difference fails closed.

## Register the Demo Command

The demo profile accepts no input. It permits one request to `https://example.com/`.

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

A behavioral started hook can return `CONSTRAIN` with the `example-egress` profile. The integration then aborts the payment-batch host action and dispatches this command to the sandbox.

## Configure the Worker

Pass `SandboxConfig` to the `OpenBoxPlugin` that owns governance and telemetry.

```python title="worker.py"
import asyncio
import os
from pathlib import Path

from openbox import OpenBoxPlugin
from openbox.sandbox import SandboxConfig
from temporalio.client import Client
from temporalio.worker import Worker

from activities import post_payment_batch
from command_registry import command_registry
from workflows import PaymentBatchWorkflow


async def main() -> None:
    client = await Client.connect(os.environ["TEMPORAL_ADDRESS"])

    worker = Worker(
        client,
        task_queue="payment-demo",
        workflows=[PaymentBatchWorkflow],
        activities=[post_payment_batch],
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

The plugin intercepts the application Activity. You do not need a second Worker. Workflow code also does not need a public Activity owned by the plugin.

## Next Step

Configure the replacement decision in the [Demo Walkthrough](./demo-walkthrough).
