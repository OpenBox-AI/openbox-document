---
title: Configuration
description: "Configure the OpenBox CrewAI SDK: engine options, environment variables, fail-open behavior, approvals, and instrumentation."
llms_description: CrewAI SDK configuration and defaults
tags:
  - sdk
  - crewai
  - python
---

# Configuration

## `create_openbox_engine()`

| Option | Default | Purpose |
| --- | --- | --- |
| `api_url` | `OPENBOX_URL` env | OpenBox Core base URL |
| `governance_timeout` | `30.0` | HTTP timeout in seconds |
| `governance_policy` | `"fail_open"` | API outage policy: `fail_open` or `fail_closed` |
| `on_fallback` | `"log_warning"` | behavior when Core returns `fallback_used=true` |
| `send_task_start_event` | `True` | emit `ActivityStarted` |
| `send_task_completed_event` | `True` | emit `ActivityCompleted` |
| `llm_level_governance` | `True` | gate LLM calls after a stop verdict |
| `hitl_enabled` | `True` | poll for approval on `REQUIRE_APPROVAL` |
| `hitl_poll_interval` | `5.0` | approval polling interval in seconds |
| `exclude_crews_hitl` | `None` | crew names to skip HITL polling for |
| `instrument_databases` | `True` | enable supported DB instrumentation |
| `db_libraries` | `None` | restrict DB instrumentation to selected drivers |
| `instrument_file_io` | `False` | enable file I/O instrumentation |
| `debug_log` | `False` | per-agent trace logging |

## Environment Variables

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENBOX_URL` | yes, unless `api_url` is passed | OpenBox Core base URL |
| `{PREFIX}_API_KEY` | yes, per governed agent | agent-specific OpenBox API key |
| `{PREFIX}_DID` | optional | agent DID; with private key, enables AIP signing |
| `{PREFIX}_PRIVATE_KEY` | optional | base64 Ed25519 seed paired with DID |

`{PREFIX}` is the `env_prefix` on each `OpenBoxAgent`.

Examples:

- `env_prefix="OPENBOX_RESEARCHER"` maps to `OPENBOX_RESEARCHER_API_KEY`, `OPENBOX_RESEARCHER_DID`, and `OPENBOX_RESEARCHER_PRIVATE_KEY`
- `env_prefix="OPENBOX_EDITOR"` maps to `OPENBOX_EDITOR_API_KEY`, `OPENBOX_EDITOR_DID`, and `OPENBOX_EDITOR_PRIVATE_KEY`

## Identity Model

Every governed agent should have its own `env_prefix` and its own OpenBox credentials.

Those credentials come from provisioning the agent in OpenBox:

- API key
- DID
- one-time private key

If you want per-agent AIP request signing:

- set both `{PREFIX}_DID` and `{PREFIX}_PRIVATE_KEY`
- do not reuse one agent's DID credentials for another role

If you omit signing credentials:

- omit both DID fields together
- API-key-based governance still works

## API Failure Policy

`governance_policy`:

- `fail_open` — network error becomes a soft allow and execution continues
- `fail_closed` — network error raises `GovernanceAPIError`

`on_fallback`:

- `log_warning` — accept the fallback response from Core
- `fail_closed` — override fallback to `BLOCK`

## Approvals

When Core returns `REQUIRE_APPROVAL`:

- `hitl_enabled=True` — the SDK polls the approval endpoint until resolved
- `hitl_enabled=False` — approval behavior falls back to `on_fallback`
- `exclude_crews_hitl` — lets you disable approval polling for specific crew names

## Instrumentation Defaults

Enabled by default:

- HTTP capture
- supported database capture
- LLM-level governance

Disabled by default:

- file I/O capture

Use file instrumentation only when you have a concrete governance need for file operations.

## Production Guidance

- decide explicitly between `fail_open` and `fail_closed`
- keep one `OpenBoxEngine` per process
- treat DID private keys like API secrets when signing is enabled
- turn on `debug_log` only when diagnosing runtime issues
