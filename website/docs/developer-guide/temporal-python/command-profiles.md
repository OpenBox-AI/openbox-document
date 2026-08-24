---
title: Command Profiles
description: "Register exact commands and connect their immutable registry to OpenBoxPlugin."
llms_description: Governed command registry and SandboxConfig Worker wiring
tags:
  - sdk
  - temporal
  - governance
---

# Command Profiles

The immutable registry is the application-owned admission boundary. It fixes each executable and argument grammar. Workflow input cannot select an arbitrary executable or pass free-form `argv`, and the integration never reconstructs a shell command string.

## Register the Demo Profile

This zero-input profile admits one request to `https://example.com/`. It can replace the payment-batch host action when a behavioral started hook returns `CONSTRAIN`:

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

For data-bearing commands, use bounded identifier, enum, or decimal arguments and an optional `TypedJsonResultSchema`. One definition produces equivalent Temporal derivation and dispatcher admission profiles, so profile drift fails closed.

## Connect the Registry to the Worker

Pass `SandboxConfig` to the same `OpenBoxPlugin` that owns governance and telemetry:

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

The plugin intercepts the application's Activity. It does not require a second Worker or a plugin-owned public Activity in Workflow code.

Next, configure the replacement decision in the [Demo Walkthrough](./demo-walkthrough).
