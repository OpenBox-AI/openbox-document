# The Guided Demo — AI-governed payment batch execution

A step-by-step walkthrough from a completely empty directory. Every
command is concrete — copy-paste, run, watch. The warm-up takes 15-20
minutes on the first run; subsequent runs boot in seconds.

**The story:** an AI agent proposes a payment batch posting. OpenBox
evaluates it against a policy that returns CONSTRAIN. The posting
executes inside an isolated sandbox microVM on your Mac. The console
shows the whole session.

## What runs where

This machine runs two things:

- **the agent** — the code you write here, in the current directory
- **the OpenShell sandbox** — the isolated execution environment

Everything else is a service you connect to:

- the Temporal server (workflow orchestration)
- the decision engine (OpenBox Core — policy evaluation)
- the backend (session/event storage)
- the web console (FE — the evidence UI)

The services run elsewhere. Your environment provides their addresses.

---

## What this demo points to

Every piece is pinned to a branch or release — nothing floats on main.

**Downloads (GitHub releases):**
| Component | Ref |
|---|---|
| `obs` + sandbox service + OpenShell | `OpenBox-AI/openbox-sandbox` release `v0.1.0` (base) |
| Dev sandbox image + allow-network policy | `OpenBox-AI/openbox-sandbox` release `v0.1.0-dev` |

**SDKs (cloned in Step 2):**
| Repo | Branch | PR |
|---|---|---|
| `OpenBox-AI/openbox-sdk-python` | `feat/PROD-250-sandbox-core-contract` | #10 |
| `OpenBox-AI/openbox-temporal-sdk-python` | `feat/PROD-250-sandbox-sdk-integration` | #22 |

**Host stack (Core/backend/FE — already running for the demo):**
| Repo | Branch | PR |
|---|---|---|
| `OpenBox-AI/openbox-core` | `feat/sandbox-constrain-governance` | #113 |
| `OpenBox-AI/openbox-backend` | `feat/PROD-250-opa-sandbox-constraints` | #410 |
| `OpenBox-AI/openbox-fe` | `feat/PROD-250-sandbox-constrain-ui` | #172 |

**Docs:**
| Repo | Branch |
|---|---|
| `OpenBox-AI/openbox-document` | `docs/constrain-temporal-python-integration` |

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

The two SDK repos are private — sign in once:

```bash
gh auth login
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
---

## Appendix — Recording script

The demo on camera. Eight scenes: narration, commands, expected output.
No names appear except "the sdk" and the dot.

# Recording script — the guided demo

Eight scenes. For each: the narration (read it aloud), the commands (type
them), the expected output (what should appear on screen), and the pacing
notes. Pause between scenes. No names appear except "the sdk" and the dot.
The machine starts empty — nothing exists before the recording begins.

---

## Scene 1 — The overview (no screen, just you)

**Narration:**

"OpenBox lets you run AI-generated business actions safely. The idea is
simple: an AI agent proposes an action — like posting a payment batch —
and before that action runs, OpenBox decides where it runs. Safe actions
run normally. Sensitive actions run inside an isolated sandbox. This demo
shows the whole journey: the agent, the policy that triggers the sandbox,
a minimal Temporal application, and the sandbox execution itself."

**Pacing:** 15 seconds, then cut.

---

## Scene 2 — The credentials and the agent

**Narration:**
"Every request goes through an agent identity. OpenBox authenticates the
agent, signs every request, and records every decision against it. These
files are the demo agent's identity — the API token, the agent ID, and
the policy that governs it."

**Commands:**

```bash
ls <the-agent-config-dir>
```

**Expected:** three files — the token, the agent id, the policy id.

**Pacing:** show the file names, do not open them.

---

## Scene 3 — The policy that triggers CONSTRAIN

**Narration:**
"OpenBox evaluates every activity against a policy. The policy says: this
activity must run in the sandbox — the verdict is CONSTRAIN. Let me show
you the policy file."

**Commands:**

```bash
cat <the-policy>
```

**Expected:** the policy rule that maps the governed activity to
`constrain` with the `run_in_sandbox` constraint.

**Pacing:** highlight the `constrain` decision line with the cursor.

---

## Scene 4 — The minimal application

**Narration:**
"This is the whole application. One file, built in an empty current
directory. The workflow knows nothing about OpenBox — it calls its own
business activity, exactly like any Temporal workflow you would write
today. The activity is the payment posting logic. The registry declares
the command the sandbox is allowed to execute. And the worker — this is
the only place OpenBox appears. One plugin initializer, and the sandbox
configuration is a single object: the registry, the sandbox service, and
the policy. That is the complete integration."

**Commands:** the current directory is the working directory — the dot.
Everything builds here. Start the empty project:

```bash
uv init
```

Both sdk repositories are public — the clones work without
authentication. Clone them over HTTPS on the correct branches:

```bash
git clone -b feat/PROD-250-sandbox-core-contract https://github.com/OpenBox-AI/openbox-sdk-python.git
```

```bash
git clone -b feat/PROD-250-sandbox-sdk-integration https://github.com/OpenBox-AI/openbox-temporal-sdk-python.git
```

Add both to the project:

```bash
uv add --editable ./openbox-sdk-python
```

```bash
uv add --editable ./openbox-temporal-sdk-python
```

Create one file with this content — the whole app: the workflow, the
activity, the command registry, the worker, and the entry:

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
    IdentifierArgument,
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
    args = {a["name"]: a["value"] for a in batch.get("arguments", [])}
    return {
        "batch_id": args["batch_id"],
        "amount_cents": args["amount_cents"],
        "status": "posted",
        "executed_by": "payment-service",
    }


def posting_registry() -> GovernedCommandRegistry:
    return GovernedCommandRegistry(
        commands=(
            GovernedCommandDefinition(
                command_id="post-batch",
                executable="/usr/local/bin/post-batch",
                arguments=(
                    LiteralArgument("post-batch"),
                    IdentifierArgument("batch_id", max_bytes=64),
                    IdentifierArgument("amount_cents", max_bytes=32),
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
        batch = {
            "profile_id": "post-batch",
            "arguments": [
                {"name": "batch_id", "value": "demo-2026-08"},
                {"name": "amount_cents", "value": "125000"},
            ],
        }
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

Save the file as the main module — the dot needs exactly this name.
The app reads the service config and policy directly from the paths
in the agent environment — no copies needed.

**Pacing:** walk through the code top to bottom. Pause at the
`OpenBoxPlugin(...)` block and the `sandbox=SandboxConfig(...)` argument —
say: "this one plugin initializer does all of it".

---

## Scene 5 — The agent connects to the services

**Narration:**
"This machine runs only the agent. Everything else is a service: the
Temporal server, the decision engine, the policy engine, the web console
— and the sandbox, which runs here on macOS. The agent connects to each
one. Let me show you the connections."

**Commands:**

```bash
curl <the-engine-address>/health
```

```bash
ss -ltnp | grep -E "17443|17670"
```

```bash
ls -la <the-socket>
```

**Expected:** the engine responds, the service on 17443, the gateway on
17670, the sandbox socket present.

**Pacing:** point at the socket — say: "this is the sandbox boundary —
OpenShell, running locally on this machine".

---

## Scene 6 — Run the workflow

**Narration:**
"Now the moment of truth. I start the worker and run the workflow. Watch
what happens: the workflow calls its activity, OpenBox evaluates it
against the policy, the verdict is CONSTRAIN, and the activity routes
into the sandbox VM instead of running here."

**Commands:**

```bash
export OPENBOX_URL=<the-engine-address>
```

```bash
export OPENBOX_API_KEY=$(cat <the-token-file>)
```

```bash
uv run python .
```

**Expected:** the worker starts, the workflow completes, the result prints:
the batch id, the amount, the status.

**Pacing:** hold the camera on the terminal until the result prints. Say:
"the payment batch executed — inside the sandbox, not on this machine".

---

## Scene 7 — The sandbox execution proof

**Narration:**
"Where did it actually run? The sandbox on this machine recorded the
execution. Let me show the trail it produced."

**Commands:**

```bash
ls -la <the-sandbox-state-dir>
```

**Expected:** the sandbox lifecycle files: created, ready, command
executed, cleanup confirmed.

**Pacing:** highlight the executed line and the cleanup line.

---

## Scene 8 — The console

**Narration:**
"And the whole session is visible in the OpenBox console. Here is the
workflow, the activity, the governance decision, and the sandbox
execution rendered in the tree. The disclaimer you see on the policy —
that CONSTRAIN is fail-closed — this is exactly the behavior we just
watched: if the sandbox had been unavailable, the activity would have
failed rather than run here."

**Commands:**

```bash
open <the-console-url>
```

**Expected:** log in, open the session for the agent, show the workflow
tree, the activity node, the sandbox execution path, and the policy
disclaimer.

**Pacing:** slow scroll down the tree. Click the sandbox node. End on the
disclaimer text.

---

## Closing line

"That's it — an agent, a policy, a minimal Temporal app, and a sandbox.
OpenBox decides, the sandbox executes, and you see the whole story."
