---
title: Command Profiles
description: "Define the exact commands an application may run in the sandbox."
llms_description: Registry reference. Argument types, result schemas, and admission rules for governed commands.
tags:
  - sdk
  - temporal
  - governance
---

# Command Profiles

A command profile defines one executable and the exact argument grammar the sandbox accepts for it. The registry of profiles is the only sandbox definition an application writes.

[Quick Start](./quick-start) shows a complete registry in a running Worker. This page is the reference for what you can put in one.

## Admission rules

The application owns an immutable registry. Workflow input selects a profile by `profile_id` and fills the named arguments. It cannot supply an executable, and it cannot supply a free-form argument vector.

The integration invokes the admitted argument vector directly. It never reconstructs a shell command string.

One command definition produces matching profiles for Temporal derivation and for dispatcher admission. Any difference between the two fails closed.

## Arguments

Import every type from `openbox.sandbox`.

| Type | Purpose |
|---|---|
| `LiteralArgument(value)` | A fixed token that never varies with workflow input |
| `IdentifierArgument(field, max_bytes=256)` | A bounded identifier supplied by the caller |
| `EnumArgument(field, values)` | A caller-supplied token restricted to a fixed choice set |
| `DecimalArgument(field, minimum, maximum)` | A caller-supplied base-10 integer inside a fixed range |

Each non-literal argument names a field. The activity input fills it:

```python
GovernedCommandDefinition(
    command_id="fetch-report",
    executable="/usr/bin/curl",
    arguments=(
        LiteralArgument("--silent"),
        EnumArgument("region", ("eu", "us")),
        IdentifierArgument("report_id", max_bytes=64),
    ),
)
```

```python
{"profile_id": "fetch-report", "arguments": [
    {"name": "region", "value": "eu"},
    {"name": "report_id", "value": "R-2026-004"},
]}
```

A value outside the declared bounds or choice set fails closed. Field names must be unique within one definition.

## Typed results

A profile can admit bounded JSON from the command's standard output. Without a schema, the activity result carries only the process outcome.

| Field type | Purpose |
|---|---|
| `IdentifierResultField(name, max_bytes=256)` | A bounded identifier |
| `IntegerResultField(name, minimum, maximum)` | An integer inside a fixed range |

```python
result_schema=TypedJsonResultSchema(
    name="sandbox-http",
    fields=(
        IntegerResultField("http_status", minimum=0, maximum=999),
        IdentifierResultField("remote_ip"),
    ),
)
```

The service admits only the declared fields, within the declared limits. Everything else in the output is discarded, so raw command output never reaches workflow history.

## Configure the Worker

Pass the registry to `SandboxConfig`, and that config to the one `OpenBoxPlugin` the Worker uses:

```python
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
```

The plugin intercepts the application activity, so the Worker needs no second Worker and no public activity of its own. The five sandbox paths come from `agent.env`.

Set `timeout_seconds` to bound one execution, and `governance_policy="fail_closed"` so a governance failure cannot release the host action.

## Next step

Run one in [Quick Start](./quick-start), then read [Console Evidence](./console-evidence) for what the execution records.
