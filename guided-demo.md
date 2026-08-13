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
platform-suffixed binaries (`obs-darwin-arm64` / `obs-linux-x86_64`,
`openbox-sandbox-darwin-arm64` / `openbox-sandbox-linux-x86_64`),
the OpenShell bundle tarballs, and the policy. The dev release also
carries the dev image tar — the provisioner auto-detects the
platform-specific one and loads it.

Pick your platform's launcher, then provision:

```bash
# macOS
cp obs-darwin-arm64 obs
# Linux
cp obs-linux-x86_64 obs

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
    IntegerResultField,
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
                    LiteralArgument("https://httpbin.org/ip"),
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
                  'values': [{'name': 'http_status', 'value': 200},
                             {'name': 'remote_ip', 'value': '10.200.0.1'},
                             {'name': 'local_ip', 'value': '10.200.0.2'}]}}
```

`exit_code: 0` — curl ran inside the sandbox and the typed result is
the HTTP trace: status `200`, the remote server IP, and the VM's local
IP (10.x — the sandbox network, not your Mac).

Base release (`v0.1.0`) instead: the deny-network policy blocks the
request — same sandbox execution, curl exits `56` (connection reset)
with `stderr_bytes: 0`, `stdout_bytes: 0`, no typed result. The blocked
attempt IS the expected proof for the isolated environment.

## 6. Console

```bash
open http://localhost:3233
```

Login: org `master` — `admin@master` / `OpenBox123!`

- **Authorize → Policies** — `payment-batch-sandbox` (pre-built, custom
  Rego, read-only) and `constrain-post-batch` (builder-backed, editable
  rules). Both enforce CONSTRAIN with the fail-closed disclaimer.

### Pre-define the policy AND behavioral rule (BEFORE running the agent)

Both must exist before the agent runs — they are what make the sandbox
routing happen.

Backend `.env` for the demo:

```
AGENT_SIGNING_REQUIRED=false
```

(Signing is config-driven — production keeps the default `true` and
signs every request. The demo turns it off so no DID setup is needed.)

**Policy — decides WHERE the activity runs.** Its condition matches the
Temporal activity name in the app code. In the app, the activity is
`post_payment_batch`; the policy rule says: when `activity_type ==
post_payment_batch`, verdict CONSTRAIN — the SDK interceptor sees that
verdict BEFORE the activity body runs and routes the governed command
into the sandbox instead of the host.

Create it through the console (MinIO must be up — see the backend .env
S3 block):

1. Agent page → **Authorize** → **Policies** tab
2. Click **Create Rule**
3. **Decision:** CONSTRAIN — the fail-closed disclaimer appears
4. **Reason:** `payment batch postings must run in the sandbox`
5. Add a condition: field **activity_type**, operator **equals**,
   value **post_payment_batch**
6. Click **Deploy** — the rule appears in the list with editable
   builder rules

**Behavioral rule — reacts to the sandbox execution span.** Its trigger
is `sandbox_execution`, the span type the Core records after the
sandbox runs. It fires AFTER the policy routed the activity into the
sandbox — a second layer (e.g. REQUIRE_APPROVAL on the sandbox span).

Create it through the console:

1. **Authorize** → **Behavior** tab
2. Click **Create Rule**
3. Step 1 — name `sandbox-execution-human-gate`, description, priority 80
4. Step 2 — trigger type **sandbox_execution**
5. Step 3 — required state **sandbox_execution**
6. Step 4 — verdict **REQUIRE_APPROVAL** (the human-gated disclaimer
   appears), approval timeout, reject message
7. Click **Create Rule**



Relationship: **policy = pre-execution routing** (before the activity
body, decides sandbox vs host). **Behavioral rule = post-execution
span evaluation** (after the sandbox span exists). The policy causes
the sandbox; the behavioral rule reacts to the sandbox.


