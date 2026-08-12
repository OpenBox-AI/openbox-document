# OpenBox Sandbox Guided Demo

AI-governed payment batch: the agent proposes, OpenBox returns CONSTRAIN,
the command runs inside an isolated sandbox microVM on your Mac, and the
console shows the evidence.

Everything below is copy-paste. First run warms up for 15-20 minutes.

## Pointers

| Component | Ref |
|---|---|
| Sandbox release (base) | `OpenBox-AI/openbox-sandbox` → `v0.1.0` |
| Sandbox release (dev image + curl) | `OpenBox-AI/openbox-sandbox` → `v0.1.0-dev` |
| openbox-sdk-python | `feat/PROD-250-sandbox-core-contract` (#10) |
| openbox-temporal-sdk-python | `feat/PROD-250-sandbox-sdk-integration` (#22) |
| openbox-core | `feat/sandbox-constrain-governance` (#113) |
| openbox-backend | `feat/PROD-250-opa-sandbox-constraints` (#410) |
| openbox-fe | `feat/PROD-250-sandbox-constrain-ui` (#172) |

## 1. Tools

```bash
uv --version
python3 --version
temporal --version
```

## 2. Project

```bash
uv init
gh auth login
git clone -b feat/PROD-250-sandbox-core-contract https://github.com/OpenBox-AI/openbox-sdk-python.git
git clone -b feat/PROD-250-sandbox-sdk-integration https://github.com/OpenBox-AI/openbox-temporal-sdk-python.git
uv add --editable ./openbox-sdk-python
uv add --editable ./openbox-temporal-sdk-python
```

## 3. Sandbox

Download ONE release — base (isolated, no network) or dev (dev image with
curl allowlisted to httpbin.org:443):

```bash
# base
gh release download v0.1.0 --repo OpenBox-AI/openbox-sandbox

# OR dev
gh release download v0.1.0-dev --repo OpenBox-AI/openbox-sandbox
```

Each download lands the full asset set in the current directory:
`obs`, the service binary, the OpenShell bundle tarballs, and the policy.
The dev release also carries the dev image tar — the provisioner
auto-detects and loads it.

Provision (same for both):

```bash
chmod +x obs
./obs provision --clean-rerun
lsof -i :17443 -i :17670 | grep LISTEN
```

## 4. App

```bash
set -a; source ~/.config/openbox-sandbox/agent.env; set +a
export OPENBOX_URL=<your-core-endpoint>
export OPENBOX_API_KEY=<your-agent-token>
```

Save this as `__main__.py`:

```python
import asyncio
import os
from datetime import timedelta
from pathlib import Path

from temporalio import activity, workflow
from temporalio.client import Client
from temporalio.worker import Worker

from openbox import OpenBoxPlugin
from openbox.sandbox import SandboxConfig
from openbox.sandbox.registry import (
    GovernedCommandDefinition,
    GovernedCommandRegistry,
    IdentifierResultField,
    LiteralArgument,
    TypedJsonResultSchema,
)

SANDBOX_CA = Path(os.environ["OPENBOX_SANDBOX_CA"])
SANDBOX_CERT = Path(os.environ["OPENBOX_SANDBOX_CERT"])
SANDBOX_KEY = Path(os.environ["OPENBOX_SANDBOX_KEY"])
SERVICE_CONFIG = Path(os.environ["OPENBOX_SANDBOX_CONFIG_PATH"])
POLICY = Path(os.environ["OPENBOX_SANDBOX_POLICY_FILE"])


@workflow.defn
class PaymentBatchWorkflow:
    @workflow.run
    async def run(self, batch: dict) -> dict:
        return await workflow.execute_activity(
            "post_payment_batch",
            batch,
            start_to_close_timeout=timedelta(minutes=2),
        )


@activity.defn
async def post_payment_batch(batch: dict) -> dict:
    return batch


def posting_registry() -> GovernedCommandRegistry:
    return GovernedCommandRegistry(
        commands=(
            GovernedCommandDefinition(
                command_id="post-batch",
                executable="/bin/sh",
                arguments=(
                    LiteralArgument("-c"),
                    LiteralArgument(
                        "curl -s https://httpbin.org/ip | tr -d ' \\n'"
                    ),
                ),
                result_schema=TypedJsonResultSchema(
                    name="sandbox-http",
                    fields=(IdentifierResultField("origin"),),
                ),
            ),
        )
    )


async def main() -> None:
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="payment-demo",
        workflows=[PaymentBatchWorkflow],
        activities=[post_payment_batch],
        plugins=[
            OpenBoxPlugin(
                openbox_url=os.environ["OPENBOX_URL"],
                openbox_api_key=os.environ["OPENBOX_API_KEY"],
                sandbox=SandboxConfig(
                    registry=posting_registry(),
                    service_config=SERVICE_CONFIG,
                    policy=POLICY,
                    ca=SANDBOX_CA,
                    certificate=SANDBOX_CERT,
                    private_key=SANDBOX_KEY,
                ),
            )
        ],
    )

    async with worker:
        batch = {"profile_id": "post-batch", "arguments": []}
        handle = await client.start_workflow(
            PaymentBatchWorkflow,
            batch,
            id="payment-demo",
            task_queue="payment-demo",
        )
        result = await handle.result()
        print("\n=== WORKFLOW RESULT ===")
        print(result)


if __name__ == "__main__":
    asyncio.run(main())
```

## 5. Run

```bash
uv run python .
```

Expected:

```
{'cleanup_status': 'deleted', 'disposition': 'executed_in_sandbox',
 'exit_code': 0, 'profile_id': 'post-batch', 'stderr_bytes': 0,
 'timeout_status': 'not_observed',
 'typed_result': {'schema_name': 'sandbox-http',
                  'values': [{'name': 'origin', 'value': '171.101.162.112'}]}}
```

`exit_code: 0` — curl ran inside the sandbox and the typed result IS
httpbin's actual response: `origin` is the sandbox's public egress IP
(your Mac's IP will differ — the request left the isolated VM).

Base release (`v0.1.0`) instead: the deny-network policy blocks the
request — same sandbox execution, curl exits `56` (connection reset)
with `stderr_bytes: 0`, `stdout_bytes: 0`, no typed result. The blocked
attempt IS the expected proof for the isolated environment.

## 6. Console

```bash
open http://localhost:3233
```

Login: org `master` — `admin@master` / `OpenBox123!`

- **Authorize → Policies** — `payment-batch-sandbox`, decision CONSTRAIN,
  fail-closed disclaimer.
- **Verify → Sessions → payment-demo → Tree** — the ActivityCompleted node
  shows the CONSTRAIN verdict and the orange sandbox badge.
- Expand the sandbox span — the full evidence renders:
  - `disposition: executed_in_sandbox`, `exit_code: 0`
  - `cleanup_status: deleted`, sandbox ID `sbx-<uuid>`
  - `stdout`: the sandbox's complete printed output
  - typed result: `origin` — httpbin's response, the sandbox's public IP
  - stdout/stderr byte counts and timeout status

The span view renders ALL attributes dynamically — whatever the governed
command prints appears here, bounded to 64 KiB.
