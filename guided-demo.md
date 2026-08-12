# The Guided Demo — AI-governed payment batch execution

A step-by-step walkthrough. Every command is concrete — copy-paste, run,
watch. The warm-up takes 15-20 minutes on the first run; subsequent runs
boot in seconds.

**The story:** an AI agent proposes a payment batch posting. OpenBox
evaluates it against a policy that returns CONSTRAIN. The posting
executes inside an isolated sandbox microVM on your Mac. The console
shows the whole session.

---

## Progress

- [ ] 1 — The tools
- [ ] 2 — The project
- [ ] 3 — The sandbox (warm-up runs, keep going)
- [ ] 4 — The application
- [ ] 5 — The run
- [ ] 6 — The console
- [ ] 7 — Done

---

## Step 1 — The tools

```bash
uv --version
```

```bash
python3 --version
```

```bash
temporal --version
```

Expected: three version lines. Install any missing tool, then re-check.

- [ ] All three tools verified

---

## Step 2 — The project

```bash
uv init
```

```bash
git clone -b feat/PROD-250-sandbox-core-contract https://github.com/OpenBox-AI/openbox-sdk-python.git
```

```bash
git clone -b feat/PROD-250-sandbox-sdk-integration https://github.com/OpenBox-AI/openbox-temporal-sdk-python.git
```

```bash
uv add --editable ./openbox-sdk-python
```

```bash
uv add --editable ./openbox-temporal-sdk-python
```

- [ ] Project created, both sdks added

---

## Step 3 — The sandbox

Two releases, two environments. Each is self-contained — download the
release you want, `obs` provisions everything from the assets next to it.
No flags, no registry, no manual steps.

### Base (isolated, no network)

```bash
gh auth login
```

```bash
gh release download v0.1.0 --repo OpenBox-AI/openbox-sandbox
```

### Dev (isolated + curl to one allowlisted endpoint)

```bash
gh auth login
```

```bash
gh release download v0.1.0-dev --repo OpenBox-AI/openbox-sandbox
```

Then provision (same for both):

```bash
chmod +x obs
./obs provision --clean-rerun
```

The dev release carries the dev sandbox image
(`openbox-sandbox-dev-darwin-arm64.tar.gz` — NVIDIA base + Python 3, Git,
curl) and the allow-network policy. The provisioner auto-detects both and
loads them — the sandbox boots the dev image with an explicit allowlist
for `curl → httpbin.org:443` only. Everything else stays blocked.

Expected: the provision completes — service on 17443, gateway on 17670.
The agent environment file is written.

Verify:

```bash
lsof -i :17443 -i :17670 | grep LISTEN
```

- [ ] Sandbox stack running

---

## Step 4 — The application

The agent environment carries the mTLS material, the service config path,
the policy path, and the binary identity. Source it, then create the
app as a single file saved as the main module (`__main__.py`):

```bash
set -a; source ~/.config/openbox-sandbox/agent.env; set +a
```

```bash
# The decision-engine endpoint — wherever your OpenBox Core runs
export OPENBOX_URL=<your-core-endpoint>
```

```bash
# Your agent token — generated in the OpenBox console
export OPENBOX_API_KEY=<your-agent-token>
```

Create the file with this content:

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
    LiteralArgument,
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
        result = await workflow.execute_activity(
            "post_payment_batch",
            batch,
            start_to_close_timeout=timedelta(minutes=2),
        )
        return result


@activity.defn
async def post_payment_batch(batch: dict) -> dict:
    # The plugin intercepts this activity, evaluates it against the
    # CONSTRAIN policy, and runs it inside the sandbox.
    return batch


def posting_registry() -> GovernedCommandRegistry:
    """One command: fetch the sandbox's public IP via curl.

    The sandbox boots an isolated Linux VM. curl calls httpbin.org/ip
    from INSIDE the VM — the local_ip in the response is the VM's
    network identity, not your Mac's.
    """
    return GovernedCommandRegistry(
        commands=(
            GovernedCommandDefinition(
                command_id="post-batch",
                executable="/usr/bin/curl",
                arguments=(
                    LiteralArgument("-s"),
                    LiteralArgument("-w"),
                    LiteralArgument(
                        '\n{"http_code":%{http_code},"local_ip":"%{local_ip}",'
                        '"time_total":%{time_total}}\n'
                    ),
                    LiteralArgument("https://httpbin.org/ip"),
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
                    ca=Path(SANDBOX_CA),
                    certificate=Path(SANDBOX_CERT),
                    private_key=Path(SANDBOX_KEY),
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

The app has four parts: the workflow (zero OpenBox), the activity (the
posting logic), the registry (the one sandbox command — curl), and the
worker (the only OpenBox line — one plugin initializer, the
`ca`/`certificate`/`private_key` from the agent environment, the
`service_config` and `policy` paths from the provision).

- [ ] The application file created

---

## Step 5 — The run

```bash
uv run python .
```

Expected (dev release): the worker starts, the sandbox boots the dev
image, curl calls `httpbin.org/ip` from inside the VM, and the workflow
result prints:

```
{'cleanup_status': 'deleted', 'disposition': 'executed_in_sandbox',
 'exit_code': 0, 'profile_id': 'post-batch', 'stderr_bytes': 0,
 'stdout_bytes': ~100, 'timeout_status': 'not_observed', ...}
```

`exit_code: 0` — curl succeeded inside the sandbox. The stdout carries
the httpbin JSON with the sandbox's public IP plus the `-w` telemetry
(http code, local IP, time). The gateway log shows the sandbox lifecycle
— created, ready, command executed, deleted.

- [ ] The workflow ran and printed the result

---

## Step 6 — The console

Open the FE console (the port printed by `pnpm dev`, e.g. 3233):

```bash
open http://localhost:3233
```

### Login

- **Organization:** `master`
- **Username:** `admin@master`
- **Password:** `OpenBox123!`

### See the policy

1. Click the **accounts-payable-showcase** agent card
2. Go to **Authorize** → **Policies**
3. The policy **payment-batch-sandbox** is listed — this is the pre-built
   CONSTRAIN policy deployed by `obs provision`. It enforces that
   `post_payment_batch` governed commands MUST run in a sandbox.
4. The policy metadata shows:
   - **Decision:** CONSTRAIN
   - **Constraint:** `run_in_sandbox`
   - **Fail-closed:** if the sandbox stack is unavailable, the activity
     is rejected, never silently allowed.

### See the sandbox execution evidence

1. Go to **Verify** → **Sessions**
2. Click a **payment-demo** session (the most recent one)
3. Go to the **Tree** tab (the tree view)
4. Find the **ActivityCompleted** node — it shows:
   - **CONSTRAIN verdict** with reason: _"payment batch postings must run in the sandbox"_
   - **Orange sandbox badge** on the activity node — this is the
     `sandbox_execution` span
5. The span detail panel shows the execution metadata:
   - **Disposition:** `executed_in_sandbox`
   - **Exit code:** `0` — curl succeeded
   - **Cleanup status:** `deleted`
   - **Profile:** `post-batch`
   - **Stderr:** 0 bytes / **Stdout:** ~100 bytes (the httpbin response)
   - **Timeout:** `not_observed`
   - **Sandbox ID:** `sbx-<uuid>` — traceable to the gateway log

These details are the same evidence the POC gateway log captured —
CreateSandbox, ExecSandbox, DeleteSandbox — now surfaced in the FE
with the complete lifecycle and execution metadata.

### See the policy builder CONSTRAIN option

1. Go to **Authorize** → **Policies** → **Add Rule**
2. The decision dropdown includes **CONSTRAIN** with a **Fail-closed**
   disclaimer: "CONSTRAIN rules are fail-closed. If the sandbox stack is
   unavailable, the command is rejected rather than silently allowed."
3. This is the same decision path the pre-built policy uses — the UI
   exposes it for new policies you create.

- [ ] Policy visible, CONSTRAIN visible, sandbox execution visible, full metadata visible

---

## Done

An agent. A policy. A minimal application. A sandbox. OpenBox decides
CONSTRAIN, the sandbox executes, and the console shows the full
story: the policy, the verdict, curl running inside the isolated VM,
and the post-execution metadata — every detail the POC proved.
