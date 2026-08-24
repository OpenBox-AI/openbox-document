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

The default `native` provider runs an exact argument vector under operating system isolation.

## Isolation Boundary

The provider uses these platform controls:

- **macOS:** Seatbelt through `/usr/bin/sandbox-exec`.
- **Linux:** bubblewrap (`bwrap`).

The provider does not use the Node or npm CLI from Anthropic sandbox-runtime. Use the optional [OpenShell Provider (VM)](./openshell-provider) when you require a guest-kernel boundary.

## Requirements

| Host | Requirements |
|---|---|
| macOS | Apple Silicon release asset, `/usr/bin/sandbox-exec`, and OpenSSL |
| Linux | x86_64 release asset, bubblewrap, OpenSSL, and a kernel that permits unprivileged bubblewrap namespaces |

macOS includes `/usr/bin/sandbox-exec`. The native provider does not require Docker, a VM runtime, `sudo`, or system CA installation.

`obs provision --yes` accepts all non-privileged defaults without interaction.

## Install Release Assets

Download these assets from the same [OpenBox Sandbox release](https://github.com/OpenBox-AI/openbox-sandbox/releases):

- The matching `obs-<platform>` launcher
- The matching `openbox-sandbox-<platform>` service
- The policy templates
- `SHA256SUMS`
- The SPDX and CycloneDX SBOMs

Keep the assets together. Do not mix assets from different release lines. The launcher and service are not interchangeable.

Verify all downloaded assets against `SHA256SUMS` before provisioning.

On macOS, run:

```bash
shasum -a 256 -c SHA256SUMS
```

On Linux, run:

```bash
sha256sum -c SHA256SUMS
```

Rename the launcher to `obs`, or invoke it by its downloaded name.

## Provision the Provider

The shortest supported command selects `native` by default:

```bash
obs provision --yes
```

You can select the provider explicitly:

```bash
obs provision --provider native --yes
```

You can also use the environment variable:

```bash
OPENBOX_PROVIDER=native obs provision --yes
```

The launcher does not use a provider fallback. Provisioning stops if the service, isolation primitive, or policy is unavailable.

Provisioning performs these actions:

1. Resolves and verifies the service and policy template.
2. Compiles the YAML policy into an owner-only Seatbelt or bubblewrap profile.
3. Records the compiled profile SHA-256 digest in `service.json`.
4. Creates local mTLS service and caller identities under `~/.config/openbox-sandbox/`.
5. Starts the loopback sandbox service.
6. Runs `/usr/bin/true` or `/bin/true` under the native profile.
7. Writes `~/.config/openbox-sandbox/agent.env` for the SDK.

Check the deployment:

```bash
obs status
obs verify
```

`obs verify` exercises the live mTLS create, ready, execute, and delete lifecycle. Artifact verification alone is not execution proof.

## Policy Templates

Each release includes these native policy templates:

| Template | Purpose |
|---|---|
| `policy-deny-network-dev.yaml` | Denies network access for development. Linux uses a private network namespace. |
| `policy-allow-network-dev.yaml` | Allows only `/usr/bin/curl` to reach `example.com:443` for the development demo. |
| `policy-deny-network.yaml` | Provides a hardened deny-network candidate that requires Landlock. Production qualification remains required. |

Templates with `dev` in the name are not production policies. Each release line selects a default template.

Use `--policy-file` or `OPENBOX_POLICY_FILE` to select a template explicitly:

```bash
obs provision --provider native --yes \
  --policy-file "$PWD/policy-allow-network-dev.yaml"
```

The service treats the provisioned policy and profile as immutable inputs. It verifies the policy identity and compiled profile SHA-256 digest before every execution.

## Network Allowlist

A network-enabled policy starts an HTTP and HTTPS proxy for each execution. The proxy listens on an ephemeral loopback port.

The service clears the command environment. It then sets `HTTP_PROXY`, `HTTPS_PROXY`, and their lowercase forms.

The proxy performs these actions:

- Supports HTTPS `CONNECT` requests.
- Supports plain HTTP proxy requests.
- Resolves DNS outside the sandbox.
- Compares each normalized `host:port` with the pinned policy endpoints.
- Returns HTTP 403 for denied hosts and IP-literal bypass targets.

On macOS, Seatbelt permits only the loopback proxy port for that execution. Direct sockets cannot provide another egress path. A stopped proxy also cannot provide another egress path.

## Violation Evidence

Each observed proxy request adds a decision, host, and port to terminal `sandbox_evidence`. The SDK writes these values to `openbox.sandbox.egress.*` attributes on the `sandbox_execution` span.

On macOS, the service queries the unified log for `com.apple.sandbox.reporting:violation` records. It reports a count and stable denial categories. It also writes each record to the service log.

The service uses `log show`. Current macOS testing found that redirected `log stream` output does not reliably include kernel-originated violation records.

## Limitations

### Linux Network Allowlists

Bubblewrap cannot filter destination addresses in a shared network namespace. The Linux allowlist routes proxy-aware HTTP and HTTPS clients through the policy proxy. Without another kernel network control, it cannot stop clients that bypass the proxy.

Use the deny-network template for bypass-resistant native Linux isolation. Use the [OpenShell Provider (VM)](./openshell-provider) if you require a network allowlist and a stronger Linux network boundary.

### Linux Violation Telemetry

Bubblewrap does not provide an equivalent unprivileged denial stream for each process. Linux results omit operating system violation counts and categories. Proxy egress decisions remain available.

### Command and Policy Scope

The provider accepts only registered, non-interactive commands. It does not accept caller-provided shell commands, TTYs, standard input, environment variables, host mounts, credentials, or working directories.

Only the sandbox workspace is writable. Unknown fields fail closed. Unsupported profile and policy combinations also fail closed.

## Operations

Use these commands to inspect, verify, reprovision, or remove the provider:

```bash
obs status
obs verify
obs provision --provider native --clean-rerun --yes
obs uninstall
```

A clean rerun removes launcher-owned runtime state and recompiles the pinned profile. The native provider has no prepared VM cache.

## Related Pages

- [Governed Sandbox Commands](./concept): Temporal profile registration and behavioral interception.
- [OpenShell Provider (VM)](./openshell-provider): Optional microVM provider.
- [Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution): Lifecycle and evidence model.
- [Error Handling](./error-handling): Fail-closed command outcomes.
