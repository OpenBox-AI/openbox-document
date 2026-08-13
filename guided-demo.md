# OpenBox Sandbox Guided Demo

AI-governed payment batch: create an agent, define a policy that returns
`CONSTRAIN` with `run_in_sandbox`, run one governed command in an isolated
sandbox microVM, and inspect the execution evidence in the console.

Everything below is copy-paste except values shown in angle brackets. The
first sandbox provision can take 15–20 minutes.

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

## 1. Tools and project

```bash
uv --version
python3 --version
temporal --version
gh auth login

uv init
git clone -b feat/PROD-250-sandbox-core-contract https://github.com/OpenBox-AI/openbox-sdk-python.git
git clone -b feat/PROD-250-sandbox-sdk-integration https://github.com/OpenBox-AI/openbox-temporal-sdk-python.git
uv add --editable ./openbox-sdk-python
uv add --editable ./openbox-temporal-sdk-python
```

## 2. Create the agent through the API

Use an organization API key with the `CreateAgent` permission. The response
contains the new agent ID and its runtime API key; save the runtime key now
because it is returned only once.

```bash
export OPENBOX_BACKEND_URL=http://localhost:5002
export OPENBOX_ORG_API_KEY=<organization-api-key>

AGENT_RESPONSE=$(curl -fsS -X POST "$OPENBOX_BACKEND_URL/agent/create" \
  -H "X-API-Key: $OPENBOX_ORG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "sandbox-payment-demo",
    "agent_type": "temporal",
    "model_name": "governed-command",
    "description": "Sandbox payment batch guided demo",
    "team_ids": [],
    "tags": ["sandbox", "demo"],
    "icon": "bot",
    "aivss_config": {
      "base_security": {
        "attack_vector": 1,
        "attack_complexity": 1,
        "privileges_required": 1,
        "user_interaction": 1,
        "scope": 1
      },
      "ai_specific": {
        "model_robustness": 2,
        "data_sensitivity": 3,
        "ethical_impact": 2,
        "decision_criticality": 3,
        "adaptability": 3
      },
      "impact": {
        "confidentiality_impact": 2,
        "integrity_impact": 3,
        "availability_impact": 2,
        "safety_impact": 2
      }
    }
  }')

export OPENBOX_AGENT_ID=$(printf '%s' "$AGENT_RESPONSE" | python3 -c \
  'import json,sys; d=json.load(sys.stdin); d=d.get("data",d); print(d["agent"]["id"])')
export OPENBOX_API_KEY=$(printf '%s' "$AGENT_RESPONSE" | python3 -c \
  'import json,sys; d=json.load(sys.stdin); d=d.get("data",d); print(d["token"])')

printf 'Agent ID: %s\n' "$OPENBOX_AGENT_ID"
```

## 3. Sandbox

Download one release: base (isolated with no network) or dev (curl allowlisted
to `httpbin.org:443`).

```bash
# Base
# gh release download v0.1.0 --repo OpenBox-AI/openbox-sandbox

# Or dev
# gh release download v0.1.0-dev --repo OpenBox-AI/openbox-sandbox
```

Uncomment one download command. Each release contains platform-suffixed
launchers, the OpenShell bundles, and the sandbox policy. The dev release also
contains the dev image; the provisioner detects and loads the matching asset.

Verify the downloaded binaries with an SBOM before running them (syft
scans the Go/Rust binaries and emits the software bill of materials):

```bash
brew install syft
# macOS (Linux: obs-linux-x86_64 / openbox-sandbox-linux-x86_64)
syft obs-darwin-arm64 -o spdx-json > sbom-obs.spdx.json
syft openbox-sandbox-darwin-arm64 -o spdx-json > sbom-sandbox.spdx.json
# inspect both SBOMs (syft accepts an SBOM file directly)
syft sbom-obs.spdx.json
syft sbom-sandbox.spdx.json
jq '.spdxVersion, (.packages[] | {name, versionInfo})' sbom-obs.spdx.json sbom-sandbox.spdx.json
# full detail: complete document or full table
jq '.' sbom-obs.spdx.json
syft sbom-obs.spdx.json -o table
```

Pick the launcher for your platform, then provision:

```bash
# macOS
cp obs-darwin-arm64 obs

# Linux (use this instead on Linux)
# cp obs-linux-x86_64 obs

chmod +x obs
./obs provision --clean-rerun
lsof -i :17443 -i :17670 | grep LISTEN
```

The provision output prints the generated agent environment file. Save that
reported path without assuming a user-specific directory:

```bash
export OPENBOX_SANDBOX_AGENT_ENV=<agent-env-path-printed-by-provision>
set -a; source "$OPENBOX_SANDBOX_AGENT_ENV"; set +a
export OPENBOX_URL=<your-core-endpoint>
```

## 4. Create the governance rules in the console

Open the console before running the app:

```bash
open http://localhost:3233
```

Login to organization `master` with the local demo credentials, then open the
`sandbox-payment-demo` agent created by the API.

### Policy: route the activity into the sandbox

Create the policy through **Agent → Authorize → Policies**:

1. Click **Create Rule**.
2. Select **CONSTRAIN**. The builder shows the fail-closed notice and emits the
   supported constraint `run_in_sandbox`.
3. Set the reason to `payment batch postings must run in the sandbox`.
4. Add the condition: **activity_type** **equals** `post_payment_batch`.
5. Click **Deploy**.

The builder-backed policy decides where the governed activity runs. Its result
contains `decision: "CONSTRAIN"` and exactly
`constraints: ["run_in_sandbox"]`. The backend publishes the policy through
its existing policy deployment path.

### Behavioral rule: react to sandbox evidence

Create the rule through **Agent → Authorize → Behavior**:

1. Click **Create Rule**.
2. Name it `sandbox-execution-human-gate`, add a description, and set priority
   `80`.
3. Select trigger type **sandbox_execution**.
4. Select required prior state **sandbox_execution**.
5. Select verdict **REQUIRE_APPROVAL**, set the timeout and reject message, and
   click **Create Rule**.

The policy and behavioral rule have different timing. The policy's
`CONSTRAIN` result routes the registered command before host execution. Core
records a `sandbox_execution` span after the sandbox runs; the behavioral rule
reacts to that span and does not cause the routing.

## 5. Create the one-file app

Create `__main__.py` with only the following Python:

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

This is the supported SDK composition: one native Temporal Worker, one
`OpenBoxPlugin`, a `SandboxConfig` on that plugin, and an immutable governed
command registry.

## 6. Run and inspect the result

```bash
uv run python .
```

Expected with the dev release:

```text
{'cleanup_status': 'deleted', 'disposition': 'executed_in_sandbox',
 'exit_code': 0, 'profile_id': 'post-batch', 'stderr_bytes': 0,
 'timeout_status': 'not_observed',
 'typed_result': {'schema_name': 'sandbox-http',
                  'values': [{'name': 'http_status', 'value': 200},
                             {'name': 'remote_ip', 'value': '10.200.0.1'},
                             {'name': 'local_ip', 'value': '10.200.0.2'}]}}
```

`exit_code: 0` confirms curl ran in the sandbox. The typed result contains the
HTTP status, remote address, and the VM's local address. Exact IP values can
vary.

With the base release, the deny-network policy blocks the request. Sandbox
execution still occurs, but curl exits nonzero and no typed result is
returned. That blocked attempt is the expected isolation proof.

### Console evidence

Open **Agent → Verify → Sessions → payment-demo → Tree** and expand the
`sandbox_execution` span. The activity shows:

- disposition `executed_in_sandbox`
- exit code `0`
- bounded stdout and stderr content, plus their byte counts
- typed result values such as `http_status=200`, `remote_ip`, and `local_ip`
- an HTTP-style `200` badge sourced from `http.response.status_code`; when no
  HTTP status exists, the badge falls back to the process exit code
- cleanup, timeout, profile, and sandbox ID metadata when present

The displayed evidence comes from the recorded sandbox span. It is separate
from the policy decision: authorization permits constrained execution, while
the span reports what ran and how it completed.
