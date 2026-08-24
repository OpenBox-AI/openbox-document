---
title: Native Provider
sidebar_label: Native Provider
sidebar_position: 1
description: "Install and provision the default OpenBox native sandbox provider on macOS or Linux."
llms_description: Native sandbox-exec and bubblewrap provisioning, policy, egress, evidence, and limitations
slug: native-provider
tags:
  - sdk
  - temporal
  - governance
---

# Native Provider

`native` is the default OpenBox Sandbox provider. It invokes exact `argv` under native operating-system isolation:

- **macOS:** Seatbelt through `/usr/bin/sandbox-exec`
- **Linux:** bubblewrap (`bwrap`)

It is conceptually similar to Anthropic's sandbox-runtime; implemented natively without adopting the Node/npm CLI. For a guest-kernel boundary, see the optional [OpenShell Provider (VM)](./openshell-provider).

## Prerequisites

| Host | Requirements |
|---|---|
| macOS | Apple Silicon release asset, `/usr/bin/sandbox-exec` (included with macOS), OpenSSL |
| Linux | x86_64 release asset, bubblewrap, OpenSSL, a kernel that permits unprivileged bubblewrap namespaces |

The native path does not need Docker, a VM runtime, `sudo`, or system CA installation. `obs provision --yes` can accept every non-privileged default non-interactively.

## Install Release Assets

Download the matching `obs-<platform>` launcher and `openbox-sandbox-<platform>` service binary from the same [OpenBox Sandbox release](https://github.com/OpenBox-AI/openbox-sandbox/releases). Rename or invoke the launcher as `obs`; the two binaries are not interchangeable. Retain the release's policy templates, `SHA256SUMS`, SPDX and CycloneDX SBOMs, and verification bundles beside them.

Verify the downloaded release before provisioning. Use the release's `SHA256SUMS` and the shipped `verify-release.sh`; do not rename or mix assets from different release lines.

## Provision

The shortest supported command selects `native` automatically:

```bash
obs provision --yes
```

For an explicit, auditable selection:

```bash
obs provision --provider native --yes
```

The environment form is equivalent:

```bash
OPENBOX_PROVIDER=native obs provision --yes
```

There is no provider fallback. If the native service binary, platform primitive, or selected policy is unavailable, provisioning stops.

Provisioning:

1. resolves and verifies the native service binary and policy template;
2. compiles the YAML policy into an owner-only Seatbelt or bubblewrap profile;
3. records the compiled profile SHA-256 in `service.json`;
4. creates local mTLS service and caller identities under `~/.config/openbox-sandbox/`;
5. starts the loopback sandbox service;
6. runs `/usr/bin/true` or `/bin/true` under the native profile; and
7. writes `~/.config/openbox-sandbox/agent.env` for the SDK.

Check the deployment:

```bash
obs status
obs verify
```

`obs verify` exercises the live mTLS create → ready → exec → delete lifecycle. Artifact-only verification is not an execution proof.

## Policy Templates and Release Lines

Both native templates are distributed. The launcher's release line chooses the default; an explicit `--policy-file`/`OPENBOX_POLICY_FILE` overrides it.

| Template | Purpose |
|---|---|
| `policy-deny-network-dev.yaml` | Development deny-network profile; Linux uses a private network namespace |
| `policy-allow-network-dev.yaml` | Development demo profile; allows only `/usr/bin/curl` to `example.com:443` |
| `policy-deny-network.yaml` | Hardened deny-network candidate that requires Landlock; production qualification is still required |

The templates marked `dev` are non-production. Provisioned files are immutable inputs: the service checks the selected policy identity and the compiled profile's SHA-256 before every execution.

Select a specific template explicitly:

```bash
obs provision --provider native --yes \
  --policy-file "$PWD/policy-allow-network-dev.yaml"
```

## Per-Domain Proxy Filtering

A network-enabled policy starts an execution-scoped HTTP(S) proxy on an ephemeral loopback port. The command environment is cleared before the service sets `HTTP_PROXY`, `HTTPS_PROXY`, and their lowercase equivalents.

The proxy:

- supports HTTPS `CONNECT` and plain HTTP proxy requests;
- resolves DNS outside the sandbox;
- normalizes and compares the requested `host:port` with the pinned policy endpoints; and
- returns HTTP 403 for denied hosts and IP-literal bypass targets.

On macOS, Seatbelt allows only that execution's loopback proxy port. Direct sockets and a stopped proxy cannot provide alternate egress.

## Violation Evidence

Every observed proxy request contributes an allowed/denied decision, host, and port to terminal `sandbox_evidence`. The SDK projects those values into `openbox.sandbox.egress.*` attributes on the `sandbox_execution` span.

On macOS, the service queries the unified log after observing the process for records under `com.apple.sandbox.reporting:violation`. It reports a count and stable denial categories and mirrors each record to the service log. The runtime uses `log show`, because current macOS testing found that redirected `log stream` output does not reliably deliver kernel-originated violation records.

## Limitations

### Linux allowlist bypass resistance

Bubblewrap cannot filter destinations in a shared network namespace by address. The native Linux allowlist routes proxy-aware HTTP(S) clients through the policy proxy, but it cannot provide the same direct-socket guarantee as macOS without an additional kernel network control.

Use the deny-network template for bypass-resistant native Linux isolation. If you require both a network allowlist and a stronger Linux network boundary, consider the [OpenShell Provider (VM)](./openshell-provider).

### Linux violation telemetry

Bubblewrap has no equivalent unprivileged per-process denial event stream. Linux results therefore omit OS violation counts/categories, although proxy egress decisions remain available.

### Command and policy scope

The provider supports non-interactive, registered commands only. It accepts no caller-provided shell, TTY, stdin, environment, host mounts, credentials, or working directory. Writable content is limited to the sandbox workspace. Unknown fields and unsupported profile or policy combinations fail closed.

## Operations

```bash
obs status
obs verify
obs provision --provider native --clean-rerun --yes
obs uninstall
```

A clean rerun removes launcher-owned state and recompiles the pinned profile. The native provider has no prepared VM cache to purge.

## Related

- **[Governed Sandbox Commands](./governed-sandbox-commands)** — Temporal profile registration and behavioral interception demo
- **[OpenShell Provider (VM)](./openshell-provider)** — optional microVM provider
- **[Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution)** — conceptual lifecycle and evidence model
- **[Error Handling](./error-handling)** — fail-closed command outcomes
