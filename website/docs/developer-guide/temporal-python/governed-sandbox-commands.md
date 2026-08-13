---
title: Governed Sandbox Commands
description: "Configure registered Temporal commands for enforced CONSTRAIN execution through OpenBoxPlugin and bounded Workflow history."
llms_description: Plugin-only Temporal governed command registration, sandbox execution, history safety, results, and cleanup
sidebar_position: 6
tags:
  - sdk
  - temporal
  - governance
---

# Governed Sandbox Commands

## Installation

Install the Temporal SDK with governed-command sandbox support:

```bash
pip install "openbox-temporal-sdk-python[sandbox]"
```

`OpenBoxPlugin` is the only OpenBox integration entry point for Temporal. Configure sandbox support on that same plugin with `sandbox=SandboxConfig(...)`; the plugin owns Worker integration, Activity registration, and interception.

A governed command is a registered, profile-bound operation handled by the plugin-owned `openbox_governed_command` Activity. For that registered Activity, `CONSTRAIN` with exactly `constraints: ["run_in_sandbox"]` selects sandbox execution. Ordinary Temporal Activities do not become sandbox-capable: if they receive `CONSTRAIN` without an enforcement path, the plugin fails closed with `GovernanceConstrainUnsupported`.

## Register command profiles

Define the executable, bounded arguments, and optional typed result schema in an immutable registry:

```python title="command_registry.py"
from openbox.sandbox import (
    GovernedCommandDefinition,
    GovernedCommandRegistry,
    IdentifierArgument,
    IdentifierResultField,
    IntegerResultField,
    LiteralArgument,
    TypedJsonResultSchema,
)

command_registry = GovernedCommandRegistry(commands=(
    GovernedCommandDefinition(
        command_id="reconcile",
        executable="/app/bin/reconcile",
        arguments=(
            LiteralArgument("--batch-id"),
            IdentifierArgument("batch_id", max_bytes=64),
        ),
        result_schema=TypedJsonResultSchema(
            name="reconciliation-v1",
            fields=(
                IdentifierResultField("status", max_bytes=16),
                IntegerResultField("records", minimum=0, maximum=1_000_000),
            ),
        ),
    ),
))
```

Workflow input cannot choose an arbitrary executable or free-form `argv`. The registry is the application-owned command boundary that the plugin uses for derivation and admission.

## Configure the native Worker

The copy-ready integration shape is a native Temporal `Worker` with one `OpenBoxPlugin` instance:

```python title="worker.py"
import asyncio
import os

from openbox import OpenBoxPlugin
from openbox.sandbox import SandboxConfig
from temporalio.client import Client
from temporalio.worker import Worker

from command_registry import command_registry
from workflows import ReconciliationWorkflow
from activities import fetch_batch, persist_report


async def main() -> None:
    client = await Client.connect(os.environ["TEMPORAL_ADDRESS"])

    worker = Worker(
        client,
        task_queue="agent-task-queue",
        workflows=[ReconciliationWorkflow],
        activities=[fetch_batch, persist_report],
        plugins=[OpenBoxPlugin(
            openbox_url=os.environ["OPENBOX_URL"],
            openbox_api_key=os.environ["OPENBOX_API_KEY"],
            governance_policy="fail_closed",
            sandbox=SandboxConfig(
                registry=command_registry,
                timeout_seconds=300,
                heartbeat_interval_seconds=10.0,
            ),
        )],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

Keep Workflows and Activities focused on application-domain orchestration. The plugin owns OpenBox registration, interception, the governed-command Activity, one-attempt scheduling, enforcement, heartbeats, result mapping, and cancellation cleanup. All OpenBox setup stays in the plugin initializer.

## Security and history boundaries

- Workflow history contains only bounded structured command data and results, never raw `argv`, stdout, stderr, credentials, policy documents, or authority material.
- The plugin schedules at most one governed-command Activity attempt and rejects any attempt number other than `1`.
- Raw output is bounded and parsed on the Activity Worker. Only metadata and values admitted by the registered result schema become durable results.
- Authorization and execution evidence are different. A governance decision or authorization receipt proves permission, not execution.
- Cancellation waits for the dispatch cleanup boundary before the Activity finishes cancelling.

## Result contract

The bounded governed-command result reports:

| Field | Meaning |
|---|---|
| `profile_id` | Registered profile that derived and admitted the command |
| `disposition` | Successful `CONSTRAIN` + `run_in_sandbox` produces `executed_in_sandbox`; an `ALLOW` path can produce `executed_on_host` |
| `exit_code` | Validated process exit code |
| `timeout_status` | Terminal timeout status reported by execution |
| `cleanup_status` | `deleted` after sandbox deletion, `failed` when cleanup failed, or `not_needed` when no sandbox cleanup applied |
| `stdout_bytes`, `stderr_bytes` | Output sizes only, not output bodies |
| `typed_result` | Optional values admitted by the registered `TypedJsonResultSchema` |

The Workflow result stays bounded and excludes stdout/stderr bodies. The plugin's wrapper-owned `ActivityCompleted` governance event separately sends bounded stdout/stderr content and the admitted typed-result values so the console can render execution evidence without putting raw output into Workflow history.

In **Verify → Sessions → Tree**, the resulting `sandbox_execution` span shows `disposition`, `exit_code`, stdout/stderr content and byte counts, and typed values. A typed `http_status` is mapped to `http.response.status_code` and displayed as the activity's HTTP-style status badge; when no HTTP status exists, the badge shows the process exit code.

An authorization decision is not independent proof that execution occurred. The result is bounded, lifecycle-correlated reporting; it is not a portable signed execution receipt.

## Fail-closed behavior

The plugin rejects unknown profiles, invalid structured arguments, malformed or oversized results, nonterminal execution, missing execution metadata, unexpected Activity attempts, and unsupported `CONSTRAIN` decisions. Governed-command failures are non-retryable because a second Activity attempt could repeat a side effect.

### Host-result caveat

The plugin can accept `executed_on_host` after dispatch and return its bounded result. It does not reject that disposition, prevent a host attempt, or make result validation a host-path control. If Core returns `ALLOW`, the dispatcher host path may run the subprocess.

A zero-host deployment therefore needs both controls:

1. Core policy must return exactly `CONSTRAIN` for the governed command.
2. The dispatcher deployment must have no available host execution path.

Do not rely on Temporal result handling for host-path enforcement.

## Cancellation and cleanup

On cancellation, the plugin cancels in-flight dispatch and waits for the dispatcher to cross its cleanup boundary. The dispatcher must own deletion after any create that may have succeeded. `cleanup_status="deleted"` confirms sandbox deletion, `"not_needed"` means no sandbox cleanup applied, and `"failed"` requires reconciliation through the sandbox runtime's cleanup mechanism.

## Deployment wrapper

`GovernedCommandDeployment` is a thin operational wrapper for validated manifests, cleanup reconciliation, and Worker deployment settings. Internally it builds `OpenBoxPlugin(...)` and returns a native `Worker(..., plugins=[openbox_plugin])`. It does not define a second OpenBox integration surface; use the direct plugin shape above for normal application setup.

## Plugin-only E2E evidence

The archived [plugin-only live evidence](https://github.com/OpenBox-AI/openbox-sandbox-poc/blob/48cb20c/docs/proofs/2026-08-10/plugin-only-e2e/live-evidence.json) records a native plugin Worker completing one governed Activity attempt with `CONSTRAIN` + `run_in_sandbox`, sandbox create-exec-delete ordering, `cleanup_status="deleted"`, no host execution, and successful Workflow replay.

This artifact is scoped runtime evidence from the exercised stack. It does not claim a portable signed execution receipt, kernel teardown proof, source provenance, or formal gate approval.

## Related

- **[Governance Decisions](/core-concepts/governance-decisions)** — canonical `CONSTRAIN` semantics
- **[Configuration](/developer-guide/temporal-python/configuration)** — `OpenBoxPlugin` and `SandboxConfig` options
- **[Error Handling](/developer-guide/temporal-python/error-handling)** — Temporal error types and recovery
- **[Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution)** — integration-neutral isolation model
