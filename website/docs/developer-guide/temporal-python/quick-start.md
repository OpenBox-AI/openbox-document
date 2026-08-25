---
title: Quick Start
description: "Provision the sandbox and run one Temporal activity inside it."
llms_description: Fast path. Provision the native sandbox, then run a Temporal Worker whose activity is routed into it.
tags:
  - sdk
  - temporal
  - governance
---

# Quick Start

A `CONSTRAIN` verdict stops a Temporal activity before its body runs and executes a registered command in the sandbox instead. This page gets you there.

## Requirements

| Platform | Required | How you get it |
|---|---|---|
| macOS 26 on Apple Silicon | `curl` and `/usr/bin/sandbox-exec` | Both ship with macOS. Install nothing. |
| Linux x86_64 | `curl` and the `bwrap` binary | Install the `bubblewrap` package. The kernel must permit unprivileged namespaces. |

You also need `uv`, a running `temporal server start-dev`, and an `OPENBOX_API_KEY` from a [registered agent](/dashboard/agents/registering-agents).

## 1. Provision the sandbox

Download the launcher into a directory you own, then provision. The `v0.1.0-dev` tag selects the development release line, whose default policy permits `/usr/bin/curl` to reach `example.com:443`. [Provisioning](./provisioning) explains the release lines and every flag.

```bash
curl -fL -O https://github.com/OpenBox-AI/openbox-sandbox/releases/download/v0.1.0-dev/obs-darwin-arm64
curl -fL -O https://github.com/OpenBox-AI/openbox-sandbox/releases/download/v0.1.0-dev/SHA256SUMS
shasum -a 256 -c SHA256SUMS 2>/dev/null | grep obs-darwin-arm64
chmod +x obs-darwin-arm64 && mv obs-darwin-arm64 obs
./obs provision --yes --detach
```

Verify the download before you rename it. `SHA256SUMS` lists the release
filename, so the check only works while the file still carries it. Assets you
did not download report `FAILED open or read`, which is why the check is
filtered to the one line that matters. On Linux, use `sha256sum -c SHA256SUMS`.

`--detach` leaves the service running in the background so the rest of this
page works in one terminal. Without it the service runs in the foreground and
Ctrl-C stops it, which is the better shape for watching what it does. Use
`--systemd` on Linux to have systemd supervise it and restart it on failure.

On Linux, download `obs-linux-x86_64` instead.

The launcher verifies each asset, compiles and pins the sandbox profile, starts the mTLS service, runs one smoke execution, and writes `~/.config/openbox-sandbox/agent.env`.

## 2. Create the rule

The verdict comes from your agent's configuration, not from the code.

1. Open **Agent > Authorize > Policies > Create Rule**.
2. Set the verdict to `CONSTRAIN`.
3. Add the condition: field `activity_type`, operator `equals`, value `post_payment_batch`.
4. Select **Deploy**.

Without this rule the verdict is `ALLOW` and the activity runs on the host.

## 3. Write the Worker

```bash
uv init
uv add openbox-temporal-sdk-python temporalio httpx
```

The example is two files, `workflow.py` and `__main__.py`.

The workflow goes in its own module. The Worker re-imports the workflow module inside the Temporal workflow sandbox, and that sandbox rejects a module that can perform I/O. Keeping the workflow away from `httpx` and the OpenBox imports satisfies it.

The workflow imports nothing from OpenBox. It calls its own activity, and the plugin decides where that activity runs.

```python title="workflow.py"
from datetime import timedelta

from temporalio import workflow


@workflow.defn
class PaymentBatchWorkflow:
    @workflow.run
    async def run(self, batch: dict) -> dict:
        return await workflow.execute_activity(
            "post_payment_batch",
            batch,
            start_to_close_timeout=timedelta(minutes=2),
        )
```

```python title="__main__.py"
import asyncio
import os
import time
from pathlib import Path

from temporalio import activity
from temporalio.client import Client
from temporalio.worker import Worker

import httpx

from openbox import OpenBoxPlugin
from openbox.sandbox import SandboxConfig
from openbox.sandbox.registry import (
    GovernedCommandDefinition,
    GovernedCommandRegistry,
    IdentifierResultField,
    IntegerResultField,
    LiteralArgument,
    TypedJsonResultSchema,
)

from workflow import PaymentBatchWorkflow

TASK_QUEUE = "payment-demo"


@activity.defn
async def post_payment_batch(batch: dict) -> dict:
    """Under CONSTRAIN this body never runs."""
    async with httpx.AsyncClient() as client:
        response = await client.get("https://example.com")
    return {"status": "posted", "http_status": response.status_code}


def posting_registry() -> GovernedCommandRegistry:
    return GovernedCommandRegistry(
        commands=(
            GovernedCommandDefinition(
                command_id="post-batch",
                executable="/usr/bin/curl",
                arguments=(
                    LiteralArgument("-s"),
                    LiteralArgument("-o"),
                    LiteralArgument("/dev/null"),
                    LiteralArgument("-w"),
                    LiteralArgument(
                        '{"http_status":%{http_code},'
                        '"local_ip":"%{local_ip}",'
                        '"remote_ip":"%{remote_ip}"}'
                    ),
                    LiteralArgument("https://example.com/"),
                ),
                result_schema=TypedJsonResultSchema(
                    name="sandbox-http",
                    fields=(
                        IntegerResultField("http_status", minimum=0, maximum=999),
                        IdentifierResultField("remote_ip"),
                        IdentifierResultField("local_ip"),
                    ),
                ),
            ),
        )
    )


async def main() -> None:
    client = await Client.connect("localhost:7233")
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[PaymentBatchWorkflow],
        activities=[post_payment_batch],
        plugins=[
            OpenBoxPlugin(
                openbox_url=os.environ["OPENBOX_URL"],
                openbox_api_key=os.environ["OPENBOX_API_KEY"],
                sandbox=SandboxConfig(
                    registry=posting_registry(),
                    service_config=Path(os.environ["OPENBOX_SANDBOX_CONFIG_PATH"]),
                    policy=Path(os.environ["OPENBOX_SANDBOX_POLICY_FILE"]),
                    ca=Path(os.environ["OPENBOX_SANDBOX_CA"]),
                    certificate=Path(os.environ["OPENBOX_SANDBOX_CERT"]),
                    private_key=Path(os.environ["OPENBOX_SANDBOX_KEY"]),
                ),
            )
        ],
    )
    async with worker:
        handle = await client.start_workflow(
            PaymentBatchWorkflow,
            {"profile_id": "post-batch", "arguments": []},
            id=f"payment-demo-{int(time.time())}",
            task_queue=TASK_QUEUE,
        )
        print(await handle.result())


asyncio.run(main())
```

The registry is the only sandbox definition you write. It pins the executable and every argument, so workflow input can select a command but never construct one. [Command Profiles](./command-profiles) covers the argument and result types.

The activity input selects that command: `profile_id` names it, and `arguments` fills any token that is not a literal.

## 4. Run it

```bash
export OPENBOX_URL=https://core.openbox.ai OPENBOX_API_KEY=<your-key>
set -a && . "$HOME/.config/openbox-sandbox/agent.env" && set +a
uv run python .
```

The second line loads the sandbox boundary values that provisioning generated. `set -a` exports them, so the Worker process inherits them.

```text
{'cleanup_status': 'deleted', 'disposition': 'executed_in_sandbox',
 'exit_code': 0, 'profile_id': 'post-batch', 'stderr_bytes': 0,
 'stdout_bytes': 66, 'timeout_status': 'not_observed',
 'typed_result': {'schema_name': 'sandbox-http',
                  'values': [{'name': 'http_status', 'value': 200},
                             {'name': 'remote_ip', 'value': '127.0.0.1'},
                             {'name': 'local_ip', 'value': '127.0.0.1'}]}}
```

`disposition` is `executed_in_sandbox`, so the activity body never ran. Both addresses are `127.0.0.1` because the native provider reaches the destination through its loopback policy proxy. The OpenShell provider reports the guest network address instead.

## 5. Prove the policy

Change the last `LiteralArgument` to `https://api.github.com/` and run it again. The workflow now fails, which is the correct outcome.

The command still runs in the sandbox. The proxy compares the destination with the pinned policy, refuses it, and `curl` exits `56`:

```text
exit_code: 56
stdout:    {"http_status":000,"local_ip":"127.0.0.1","remote_ip":"127.0.0.1"}
evidence:  [{'decision': 'denied', 'host': 'api.github.com', 'port': 443}]
```

`curl` writes `000` for a request it never completed. That is not a valid JSON number, so the typed result schema rejects the output and the activity fails closed:

```text
ApplicationError: GovernedCommandResultInvalid: Governed command typed result rejected
```

A refused destination therefore surfaces as a failed activity, not as a result carrying exit code `56`. Open **Agent > Verify > Sessions > Tree** and expand the `sandbox_execution` span for the recorded denial. [Console Evidence](./console-evidence) lists every field.

## Troubleshooting

### The workflow returns the activity result unchanged

No rule matched, so the verdict was `ALLOW` and the body ran on the host. Check the rule condition against the activity name.

### `GovernedCommandConfigurationRequired`

The Worker has no sandbox configuration. Confirm that one `OpenBoxPlugin` receives `sandbox=SandboxConfig(...)`, that the requested profile exists in the registry, and that `agent.env` is loaded in the Worker process.

### `missing required env var: OPENBOX_SANDBOX_ENDPOINT`

The shell did not source `agent.env`, or it sourced the file without `set -a`.

### The request to `example.com` is refused

You provisioned the base release line, which denies every destination. Provision from the `v0.1.0-dev` tag.

### `deployment policy identity or native profile mismatch`

The loaded environment and the provisioned policy differ.

```bash
./obs provision --clean-rerun --yes
```

### Provisioning fails

Provisioning fails closed when it cannot verify a release asset, the policy, or the provider. Confirm every asset came from one release, verify `SHA256SUMS`, then provision again with `--clean-rerun --yes`. There is no provider fallback.

## Next steps

- [Concept](./concept) explains routing, verdicts, and the fail-closed guarantees.
- [Provisioning](./provisioning) covers release lines, policy templates, and every launcher flag.
- [Console Evidence](./console-evidence) explains the recorded evidence.
