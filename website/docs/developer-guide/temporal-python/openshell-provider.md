---
title: OpenShell Provider (VM)
sidebar_label: OpenShell Provider (VM)
sidebar_position: 2
description: "Provision the optional OpenShell microVM provider on macOS or Linux, including prepared caches and OCI registry mode."
llms_description: Optional Hypervisor.framework and KVM provider, prepared caches, zot registry, CA trust, and platforms
slug: openshell-provider
tags:
  - sdk
  - temporal
  - governance
---

# OpenShell Provider (VM)

OpenShell is an optional OpenBox Sandbox provider for commands that need a guest-kernel boundary. It runs an OpenShell libkrun microVM through:

- **Hypervisor.framework** on macOS; or
- **KVM** on Linux.

Choose it explicitly with `--provider openshell`. The launcher never selects it as a fallback from the default [`native` provider](./native-provider), and an OpenShell failure never retries the command under `native` or on the host.

## When to Choose OpenShell

Use OpenShell when:

- you require a VM boundary rather than a host OS sandbox;
- a Linux network allowlist must resist clients that bypass `HTTP_PROXY`/`HTTPS_PROXY`;
- the command needs a prepared Linux guest image; or
- VM-backed isolation is part of your deployment requirement.

Prefer `native` for the shortest local setup, lower startup overhead, no image cache, and native macOS per-domain filtering. OpenShell adds a gateway, VM driver, guest image, cache lifecycle, and platform prerequisites.

## Platform Matrix

| Host | VM boundary | Release path | Prepared cache | Dev OCI + zot mode |
|---|---|---|---|---|
| macOS on Apple Silicon | Hypervisor.framework | Supported | `prepared-vm-cache-darwin-arm64.tar.gz` | `openbox-sandbox-dev-darwin-arm64-oci.tar.gz` + `zot-darwin-arm64` |
| Linux x86_64, glibc 2.28+ | KVM (`/dev/kvm`) | Supported | `prepared-vm-cache-linux-x86_64.tar.gz` | `openbox-sandbox-dev-linux-x86_64-oci.tar.gz` + `zot-linux-x86_64` |
| Linux arm64 | KVM | Not a complete current OpenBox release path; OpenShell's dependency fetch supports aarch64, but the matching prepared-cache and pinned-zot assets are not published | Not published | Not published |
| Intel macOS | — | No published OpenBox VM bundle/cache path | Not published | Not published |
| Windows | — | Not supported directly; WSL2 still requires readable nested `/dev/kvm` | Not published | Not published |

Do not treat a launcher binary existing for a platform as proof that the complete VM asset set exists. The two fully provisioned release paths are Apple Silicon macOS and x86_64 glibc Linux.

## Prerequisites

### macOS

- Apple Silicon with `sysctl -n kern.hv_support` returning `1`
- Xcode Command Line Tools (`codesign`)
- Developer mode enabled (`sudo DevToolsSecurity -enable`)
- OpenSSL and `curl`
- `e2fsprogs` (`mkfs.ext4`/`mke2fs` and `debugfs`)

The launcher ad-hoc signs the VM driver with the `com.apple.security.hypervisor` entitlement. If `e2fsprogs` is missing and Homebrew is available, provisioning installs it; otherwise install it before retrying:

```bash
brew install e2fsprogs
```

### Linux

- x86_64 glibc 2.28 or newer (musl/Alpine is not supported by the released VM binaries)
- readable `/dev/kvm`
- OpenSSL, `curl`, and `e2fsprogs`

If KVM exists but is not readable, add the operator to the `kvm` group according to the host's administration policy, then log out and back in. Provisioning fails before VM startup when `/dev/kvm` is inaccessible.

## Install and Provision

Download the matching `obs-<platform>` launcher, `openbox-sandbox-<platform>` service, OpenShell bundle, policy templates, checksums, and prepared cache from one [OpenBox Sandbox release](https://github.com/OpenBox-AI/openbox-sandbox/releases). OpenShell remains an external pinned runtime; the hosted bundle locks OpenShell `0.0.88` (or accepts the corresponding approved source marker) and verifies its release artifacts.

Provision explicitly:

```bash
obs provision --provider openshell --yes
obs status
obs verify
```

The environment form is equivalent:

```bash
OPENBOX_PROVIDER=openshell obs provision --yes
```

`--yes` accepts non-privileged defaults. It does not bypass KVM checks, driver signing, e2fsprogs checks, asset verification, or a required CA-trust prompt.

Provisioning starts the OpenShell gateway, VM driver, and loopback OpenBox mTLS service; verifies the selected policy and image identity; prepares or warms the image cache; runs a create → ready → delete warm lifecycle; and writes provider-neutral SDK values to:

```text
~/.config/openbox-sandbox/agent.env
```

Load that file into the Worker environment exactly as for `native`. No Python application changes are required when switching an already-registered command profile between providers.

## Prepared VM Caches

A cold OpenShell image pull and ext4 conversion can take minutes. The release therefore publishes prepared caches for the two supported paths:

- `prepared-vm-cache-darwin-arm64.tar.gz`
- `prepared-vm-cache-linux-x86_64.tar.gz`

`obs provision` uses the matching cache by default. It verifies the cache through the same release-locked checksum path as other OpenBox assets, extracts it into the per-user VM driver state, and performs a warm sandbox lifecycle to prove that the driver accepts it.

The cache is identity-keyed:

- the state directory is scoped to the current user and gateway;
- the archive carries its expected sandbox image identity in `cache-image`; and
- the VM driver keys prepared content by the immutable image identity rather than a mutable tag.

A cache from another platform, architecture, user/gateway state layout, or image identity is not interchangeable. A normal `--clean-rerun` preserves prepared images. Use `--clean-rerun --purge-cache` for a full reset:

```bash
obs provision --provider openshell --clean-rerun --purge-cache --yes
```

Disable or skip cache use only for diagnosis:

```bash
obs provision --provider openshell --no-vm-cache --yes
obs provision --provider openshell --skip-warm-cache --yes
```

If the prepared cache is absent, invalid, or rejected, provisioning can build the cache through the separately documented runtime fallback. It does not switch sandbox providers.

## Dev Image: OCI Registry Mode

The dev release can serve the sandbox image without Docker or Podman. `obs update --dev --all` acquires:

- the platform-specific OpenBox OCI layout;
- the platform-specific OpenBox service and policy assets;
- the prepared VM cache when published; and
- the platform's pinned official zot binary (`v2.1.20`), downloaded from `project-zot/zot` and verified against its platform pin.

Provision the dev line:

```bash
obs update --dev --all
obs provision --provider openshell --dev --yes
```

When the OCI layout and zot are present, provisioning:

1. extracts the OCI layout into launcher-owned state;
2. generates a local TLS certificate for `127.0.0.1`/`localhost`;
3. starts zot over HTTPS on loopback (port `15000` by default);
4. reads the registry's manifest digest; and
5. configures the VM image as a digest-pinned `127.0.0.1:<port>/openbox-sandboxes-dev@sha256:...` reference.

This is the runtime-agnostic happy path. Docker and Podman are **not mandatory**. A container engine is only a fallback when the prepared cache or registry assets cannot be used and the dev image must be loaded locally.

## Registry CA Trust

The OpenShell VM driver's registry client verifies HTTPS, so the local zot certificate must be trusted by the host.

### macOS trust flow

Provisioning first checks/adds the certificate in the login keychain. If the login keychain is locked or does not accept it, the launcher prompts for `sudo` and adds it to the system keychain. If both paths fail, provisioning stops and prints the one-time command:

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain \
  "$HOME/.local/state/openbox-sandbox/zot/tls/cert.pem"
```

Run the command only after checking that the path is the launcher-owned certificate, then re-provision. Unlocking the login keychain is the non-system alternative.

### Linux trust flow

Provisioning places a copy at:

```text
~/.local/state/openbox-sandbox/certs/openbox-registry-ca.crt
```

It attempts to install that CA under `/usr/local/share/ca-certificates/` and run `update-ca-certificates` when passwordless authorization is available. If the warning says system trust could not be updated, install the launcher-owned CA according to your distribution's trust policy before retrying; otherwise the VM driver may reject the registry.

The registry CA is separate from the local mTLS identities used between the SDK, OpenBox sandbox service, and OpenShell gateway.

## Security Model

OpenShell keeps the provider-neutral OpenBox lifecycle and admission controls:

- exact registered `argv`, never a reconstructed shell command;
- immutable policy and image identities;
- bounded output and execution time;
- mTLS between the SDK-facing service and runtime boundary;
- request-owned create, ready, exec, delete, and terminal-absence checks; and
- no host fallback after a `CONSTRAIN` dispatch.

The VM supplies a guest-kernel/hardware isolation boundary. Policy enforcement inside the guest still depends on the pinned OpenShell image, supervisor, and policy. A prepared cache improves startup latency; it does not weaken or replace identity verification.

## Limitations and Operations

- OpenShell has more moving parts and higher startup/resource cost than `native`.
- Cache warming needs `e2fsprogs` even when no container engine is used.
- Registry mode needs host CA trust; `--yes` does not silently bypass it.
- Linux needs readable KVM and glibc release compatibility.
- A cache miss can make the first request slow or require the container-engine fallback.
- Windows and Intel macOS do not have a complete published OpenBox VM path.

Useful checks:

```bash
obs status
obs verify
obs provision --provider openshell --clean-rerun --yes
obs uninstall
```

`obs verify` is the live mTLS lifecycle proof. `obs --verify-runtime` checks local artifact/version compatibility only and does not connect to the gateway or create a VM.

## Related

- **[Governed Sandbox Commands](./governed-sandbox-commands)** — shared Temporal profiles, interception, results, and evidence
- **[Native Provider](./native-provider)** — default provider and native platform limits
- **[Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution)** — provider-neutral governance model
