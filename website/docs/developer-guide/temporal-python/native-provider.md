---
title: Native Provider
sidebar_label: Native Provider
sidebar_position: 1
description: "Install and provision the default native sandbox provider on macOS or Linux."
llms_description: Native Seatbelt and bubblewrap provisioning, policy, egress, evidence, and limitations
slug: native-provider
tags:
  - sdk
  - temporal
  - governance
---

# Native Provider

The native provider (`native`) is the default. It runs an exact argument vector under the isolation controls of the operating system.

## Isolation boundary

The native provider uses these platform controls:

- **macOS:** Seatbelt through `/usr/bin/sandbox-exec`.
- **Linux:** bubblewrap (`bwrap`).

## Requirements

| Host | Requirements |
|---|---|
| macOS 26 | Apple Silicon release asset, `/usr/bin/sandbox-exec`, and OpenSSL |
| Linux | x86_64 release asset, bubblewrap, OpenSSL, and a kernel that permits unprivileged bubblewrap namespaces |

`sandbox-exec` is the program that applies a compiled Seatbelt profile to a process, and macOS ships it. Install `bubblewrap` yourself on Linux. Provisioning checks for the required program and stops if it is missing.

The native provider does not require Docker, a VM runtime, `sudo`, or installation of a system CA.

## Provision

The native provider is the default, so the shortest command selects it:

```bash
obs provision
```

[Provisioning](./provisioning) covers the release assets, checksum verification, the `--provider` and `OPENBOX_PROVIDER` selectors, and every other flag. The launcher has no provider fallback: provisioning stops if the service, the isolation primitive, or the policy is unavailable.

Provisioning performs these actions:

1. Resolves and verifies the service and policy template.
2. Compiles the YAML policy into an owner-only profile for Seatbelt or bubblewrap.
3. Records the SHA-256 digest of the compiled profile in `service.json`.
4. Creates local mTLS identities for the service and its caller under `~/.config/openbox-sandbox/`.
5. Starts the loopback service.
6. Runs `/usr/bin/true` or `/bin/true` under the native profile.
7. Writes `~/.config/openbox-sandbox/agent.env` for the SDK.

## Policy templates

[Provisioning](./provisioning) lists the published templates and the default for each release line. Select one explicitly with `--policy-file` or `OPENBOX_POLICY_FILE`.

The service treats the provisioned policy and profile as immutable inputs. Before each execution, it verifies the policy identity and the SHA-256 digest of the compiled profile.

## Network allowlist

A network-enabled policy starts an HTTP and HTTPS proxy for each execution. The proxy listens on an ephemeral loopback port.

The service clears the command environment. It then sets `HTTP_PROXY`, `HTTPS_PROXY`, and their lowercase forms.

The proxy performs these actions:

- Supports HTTPS `CONNECT` requests.
- Supports plain HTTP proxy requests.
- Resolves DNS outside the sandbox.
- Compares each normalized `host:port` with the pinned policy endpoints.
- Returns HTTP 403 for denied hosts and IP-literal bypass targets.

On macOS, Seatbelt permits only the loopback proxy port for that execution. Direct sockets cannot provide another egress path. A stopped proxy also cannot provide another egress path.

## Violation evidence

Each observed proxy request adds a verdict, host, and port to terminal `sandbox_evidence`. The SDK writes these values to `openbox.sandbox.egress.*` attributes on the `sandbox_execution` span.

On macOS, the service queries the unified log for `com.apple.sandbox.reporting:violation` records. It reports a count and stable denial categories. It also writes each record to the service log.

The service uses `log show`. Tests on current macOS versions found that redirected `log stream` output does not reliably include records from kernel-originated violations.

## Limitations

### Linux network allowlists

Bubblewrap cannot filter destination addresses in a shared network namespace. The Linux allowlist routes proxy-aware HTTP and HTTPS clients through the policy proxy.

Without another kernel network control, the allowlist cannot stop clients that bypass the proxy.

Use the deny-network template for bypass-resistant native Linux isolation.

### Linux violation telemetry

Bubblewrap does not provide an equivalent unprivileged denial stream for each process. Linux results omit violation counts and categories from the operating system. Proxy egress verdicts remain available.

### Command and policy scope

The native provider accepts only registered, non-interactive commands. It does not accept shell commands, TTYs, standard input, environment variables, host mounts, credentials, or working directories from callers.

Commands can write only to the sandbox workspace. Unknown fields fail closed. Unsupported combinations of profiles and policies also fail closed.

## Operations

```bash
obs status
obs provision --clean-rerun
obs uninstall
```

A clean rerun removes the runtime state that the launcher owns and recompiles the pinned profile. The native provider has no prepared VM cache.

## Related pages

- [Governed Sandbox Commands](./concept): Registration of Temporal profiles.
- [Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution): The lifecycle and evidence model.
- [Error Handling](./error-handling): Fail-closed command outcomes.
