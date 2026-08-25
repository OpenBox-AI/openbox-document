---
title: OpenShell Provider (VM)
sidebar_label: OpenShell Provider (VM)
sidebar_position: 2
description: "Provision the optional OpenShell microVM provider on macOS or Linux."
llms_description: OpenShell microVM provisioning, prepared caches, zot registry, CA trust, and platforms
slug: openshell-provider
tags:
  - sdk
  - temporal
  - governance
---

# OpenShell Provider (VM)

The optional OpenShell provider (`openshell`) runs admitted commands in a libkrun microVM with a guest kernel.

## Isolation boundary

The OpenShell provider uses these platform controls:

- **macOS:** Hypervisor.framework.
- **Linux:** KVM.

Select this provider with `--provider openshell` or `OPENBOX_PROVIDER=openshell`. The launcher never selects the OpenShell provider as a fallback from the default [native provider (`native`)](./native-provider).

After a failure of the OpenShell provider, OpenBox does not retry the command under the native provider (`native`) or on the host.

## Selection guidance

Use the OpenShell provider when one of these requirements applies:

- The command requires a VM boundary instead of a host operating system sandbox.
- A Linux network allowlist must stop clients that bypass `HTTP_PROXY` and `HTTPS_PROXY`.
- The command requires a prepared Linux guest image.
- Your deployment requires VM-backed isolation.

Use the native provider (`native`) when you require a shorter local setup and lower startup cost. The native provider does not require an image cache. It also provides native filtering for each domain on macOS.

The OpenShell provider adds a gateway, VM driver, guest image, cache lifecycle, and platform requirements.

## Supported platforms

| Host | VM boundary | Release support | Prepared cache | OCI and zot assets for development |
|---|---|---|---|---|
| macOS on Apple Silicon | Hypervisor.framework | Supported | `prepared-vm-cache-darwin-arm64.tar.gz` | `openbox-sandbox-dev-darwin-arm64-oci.tar.gz` and `zot-darwin-arm64` |
| Linux x86_64 with glibc 2.28 or later | KVM (`/dev/kvm`) | Supported | `prepared-vm-cache-linux-x86_64.tar.gz` | `openbox-sandbox-dev-linux-x86_64-oci.tar.gz` and `zot-linux-x86_64` |
| Linux arm64 | KVM | Incomplete. OpenShell can fetch aarch64 dependencies, but OpenBox does not publish the matching cache and pinned zot assets. | Not published | Not published |
| Intel macOS | Not available | OpenBox does not publish a VM bundle or cache. | Not published | Not published |
| Windows | Not available | Not supported directly. WSL2 requires readable nested `/dev/kvm`. | Not published | Not published |

A launcher binary does not prove that a complete VM asset set exists. OpenBox publishes complete provider assets for Apple Silicon macOS and x86_64 glibc Linux.

## Requirements

### macOS

The macOS host requires:

- Apple Silicon.
- A `1` response from `sysctl -n kern.hv_support`.
- Xcode Command Line Tools, including `codesign`.
- Developer mode enabled with `sudo DevToolsSecurity -enable`.
- OpenSSL and `curl`.
- `e2fsprogs`, including `mkfs.ext4` or `mke2fs`, and `debugfs`.

The launcher applies an ad hoc signature to the VM driver. The signature includes the `com.apple.security.hypervisor` entitlement.

Provisioning installs `e2fsprogs` when Homebrew is available. Otherwise, install it before you retry:

```bash
brew install e2fsprogs
```

### Linux

The Linux host requires:

- x86_64 with glibc 2.28 or later.
- Read access to `/dev/kvm`.
- OpenSSL, `curl`, and `e2fsprogs`.

The released VM binaries do not support musl or Alpine Linux.

If `/dev/kvm` exists but is not readable, add the operator to the `kvm` group according to your host policy. Then log out and log in again.

Provisioning stops before the VM starts when `/dev/kvm` is inaccessible.

## Install and provision

Download the release assets as described in [Provisioning](./provisioning), plus two that only this provider needs: the OpenShell bundle and the prepared VM cache.

OpenShell is a pinned external runtime. The hosted bundle locks OpenShell `0.0.88`. Alternatively, it accepts the corresponding approved source marker. The launcher verifies the OpenShell release assets.

Provision this provider explicitly:

```bash
obs provision --provider openshell
```

Provisioning never prompts, and it does not bypass these checks:

- KVM access
- VM driver signing
- `e2fsprogs` availability
- Asset verification
- Required CA trust

Provisioning performs these actions:

1. Starts the OpenShell gateway and VM driver.
2. Starts the loopback service with mTLS.
3. Verifies the selected policy and image identity.
4. Prepares or warms the image cache.
5. Runs a create, ready, and delete warm lifecycle.
6. Writes the same provider-neutral `agent.env` that the native provider writes.

An application needs no code change when a registered command switches providers.

## Prepared VM caches

A cold image pull and ext4 conversion can take minutes. The release provides these caches for the supported platforms:

- `prepared-vm-cache-darwin-arm64.tar.gz`
- `prepared-vm-cache-linux-x86_64.tar.gz`

`obs provision` uses the matching cache by default. It verifies the cache with the checksum data that the release locks. It extracts the cache into VM driver state for each user.

Then it runs a warm sandbox lifecycle. This lifecycle verifies that the driver accepts the cache.

The cache uses these identity controls:

- The state directory belongs to the current user and gateway.
- The `cache-image` file contains the expected sandbox image identity.
- The VM driver keys prepared content by immutable image identity, not by a mutable tag.

Do not use a cache from another platform, architecture, user, gateway state layout, or image identity.

A normal `--clean-rerun` preserves prepared images. Use `--purge-cache` for a full reset:

```bash
obs provision --provider openshell --clean-rerun --purge-cache
```

Skip cache use only during diagnosis:

```bash
obs provision --provider openshell --no-vm-cache
obs provision --provider openshell --skip-warm-cache
```

If the prepared cache is missing, invalid, or rejected, provisioning can build it through the documented runtime fallback. Provisioning does not switch sandbox providers.

## OCI registry mode for development

The development release can serve the sandbox image without Docker or Podman. `obs update --dev --all` downloads these assets:

- The platform-specific OpenBox OCI layout.
- The platform-specific service and policy assets.
- The prepared VM cache, when published.
- The pinned official zot `v2.1.20` binary for the platform.

The launcher downloads zot from `project-zot/zot`. It verifies the binary against its platform pin.

Download the assets, then provision the development release:

```bash
obs update --dev --all
obs provision --provider openshell --dev
```

When the OCI layout and zot are present, provisioning performs these actions:

1. Extracts the OCI layout into runtime state that the launcher owns.
2. Generates a local TLS certificate for `127.0.0.1` and `localhost`.
3. Starts zot with HTTPS on loopback. The default port is `15000`.
4. Reads the registry manifest digest.
5. Configures a digest-pinned image reference in this form: `127.0.0.1:<port>/openbox-sandboxes-dev@sha256:...`.

Docker and Podman are optional. A container engine provides a fallback when the cache and registry assets cannot provide the development image.

The container engine loads the development image locally.

## Registry CA trust

The OpenShell VM driver verifies registry HTTPS certificates. The host must trust the local zot certificate.

The registry CA is separate from the mTLS identities for the SDK, the service, and the OpenShell gateway.

### macOS trust

Provisioning first tries to add the certificate to the login keychain. If that keychain is locked or rejects the certificate, the launcher requests `sudo` access.

The launcher then tries the system keychain.

If both operations fail, provisioning stops. It prints this one-time command:

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain \
  "$HOME/.local/state/openbox-sandbox/zot/tls/cert.pem"
```

Confirm that the path contains the certificate that the launcher owns. Then provision the provider again.

Alternatively, unlock the login keychain instead of changing system trust.

### Linux trust

Provisioning writes a CA copy to:

```text
~/.local/state/openbox-sandbox/certs/openbox-registry-ca.crt
```

When passwordless authorization is available, provisioning copies the CA under `/usr/local/share/ca-certificates/`. It then runs `update-ca-certificates`.

If you cannot update the system trust, install the CA that the launcher owns according to your distribution policy. Then provision the provider again.

The VM driver can reject the registry until the host trusts the CA.

## Security properties

The OpenShell provider retains the provider-neutral lifecycle and admission controls:

- It executes an exact registered argument vector without a shell.
- It verifies immutable policy and image identities.
- It bounds command output and execution time.
- It uses mTLS between the service for the SDK and the runtime boundary.
- It performs create, ready, execute, delete, and terminal-absence checks that the request owns.
- It never uses host execution after a `CONSTRAIN` dispatch.

The VM supplies a guest-kernel and hardware isolation boundary. Enforcement of the policy inside the guest depends on the pinned OpenShell image, supervisor, and policy.

A prepared cache reduces startup time. It does not replace identity verification.

## Limitations

- The OpenShell provider has higher startup and resource costs than the native provider (`native`).
- Cache warming requires `e2fsprogs`, even without a container engine.
- Registry mode requires host CA trust. Provisioning does not bypass this requirement.
- Linux requires readable KVM and compatible glibc.
- A cache miss can slow the first request or require the container engine fallback.
- OpenBox does not publish a complete VM path for Windows or Intel macOS.

## Operations

Use these commands to inspect, verify, provision again, or remove the provider:

```bash
obs status
obs provision --provider openshell --clean-rerun
obs uninstall
```

`obs --verify-runtime` checks local artifact and version compatibility only. It does not connect to the gateway or create a VM.

## Related pages

- [Governed Sandbox Commands](./concept): Shared profiles, interception, results, and evidence.
- [Native Provider](./native-provider): The default native provider and its platform limits.
- [Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution): The governance model that is independent of the provider.
