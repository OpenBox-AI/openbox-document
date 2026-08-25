---
title: Provisioning
description: "Select, verify, and provision an OpenBox Sandbox provider and policy."
llms_description: Provider selection, policy templates, release verification, and Worker environment
tags:
  - sdk
  - temporal
  - governance
---

# Provisioning

Provisioning verifies a sandbox release. It selects a provider and a policy. It creates the local runtime configuration.

## 1. Install the SDK

```bash
pip install openbox-temporal-sdk-python
```

This one package installs everything the Worker needs: the plugin, the command registry, and the sandbox lifecycle client.

## 2. Choose a release line

OpenBox publishes two release lines. Each launcher binary is compiled for one line, so the tag you download from selects the line.

| Line | Tag | Default policy | Network behavior |
|---|---|---|---|
| Base | `v0.1.0` | `policy-deny-network-dev.yaml` | Denies every network destination |
| Dev | `v0.1.0-dev` | `policy-allow-network-dev.yaml` | Permits only `/usr/bin/curl` to reach `example.com:443` |

Use the dev line to demonstrate the difference between a permitted destination and a refused one. One policy that permits everything, or denies everything, cannot show that difference.

Use the base line when you want a deny-network floor and no demonstration destination.

Both lines publish both templates. The line selects the default only.

## 3. Download and verify a release

Download these matching assets from one [OpenBox Sandbox release](https://github.com/OpenBox-AI/openbox-sandbox/releases):

- The launcher, `obs-<platform>`
- The service, `openbox-sandbox-<platform>`
- The policy templates
- `SHA256SUMS`
- The SBOM files

Keep all assets together. Do not mix assets from different releases. The launcher and the service are not interchangeable.

Rename the launcher to `obs`. Alternatively, invoke it by its downloaded name.

Before you run either binary, verify all downloaded assets against `SHA256SUMS`.

On macOS, run:

```bash
shasum -a 256 -c SHA256SUMS
```

On Linux, run:

```bash
sha256sum -c SHA256SUMS
```

Provisioning verifies the selected service and policy again. It compiles the policy. It pins the SHA-256 digest of the policy in `service.json`.

Before each execution, the service verifies the policy identity and the digest of the compiled profile.

## 4. Select a provider

A new configuration uses the native provider (`native`) by default. The following commands are equivalent:

```bash
obs provision --yes
obs provision --provider native --yes
OPENBOX_PROVIDER=native obs provision --yes
```

The `--provider` option accepts `native` or `openshell`. The command-line option overrides `OPENBOX_PROVIDER`.

The selection of a provider fails closed. The launcher does not switch providers when the selected provider is unavailable or fails verification.

Use `--yes` to accept non-privileged defaults without prompts. This option does not bypass platform checks, artifact verification, or required trust setup.

Use `--clean-rerun` to remove runtime state that the launcher owns. Then provision the state again:

```bash
obs provision --provider native --clean-rerun --yes
```

## 5. Select a policy

The release for the native provider includes these templates:

| Template | Behavior |
|---|---|
| `policy-deny-network-dev.yaml` | Denies network access for development. Linux uses a private network namespace. |
| `policy-allow-network-dev.yaml` | Allows only `/usr/bin/curl` to reach `example.com:443` for the example. |

Both templates set `landlock: best_effort`. If the kernel cannot provide Landlock, the sandbox runs with a warning instead of failing closed, and the service admits it only when `allow_degraded_landlock` is `true`. A production policy sets `landlock: hard_requirement`, which fails closed instead.

The repository also contains `deploy/policies/policy-deny-network.yaml`. This hardened deny-network candidate requires Landlock, and it still requires production qualification. Releases do not publish it.

Use `--policy-file` or `OPENBOX_POLICY_FILE` to select another template:

```bash
obs provision --provider native --yes \
  --policy-file "$PWD/policy-allow-network-dev.yaml"
```

## 6. Choose how the service runs

Provisioning starts the service in one of three ways.

| Mode | Command | Behavior |
|---|---|---|
| Foreground | `obs provision --yes` | The service runs in your terminal. Ctrl-C stops it and drains work in flight. |
| Detached | `obs provision --yes --detach` | The service runs in the background with a PID file, in its own process group, so it survives the terminal closing. |
| Supervised | `obs provision --yes --systemd` | Linux only. Writes a systemd unit and enables it, so the service restarts on failure. Root installs a system unit; any other user installs a user unit. |

A user unit stops when the last session ends unless you enable lingering.

## 7. Verify the runtime

Provisioning performs these actions:

1. Creates owner-only local mTLS material.
2. Starts the loopback service.
3. Runs a provider smoke test.
4. Writes the Worker environment file.

The environment file is:

```text
~/.config/openbox-sandbox/agent.env
```

Check the deployment:

```bash
obs status
```

Provisioning already ran one command inside the sandbox, so a healthy status means the lifecycle works on this machine. Checksum verification alone does not prove that a command executed.

Load the generated provider-neutral values into the Worker process, as shown in [Quick Start](./quick-start).

## Provider guides

- [Native Provider](./native-provider): Requirements, network behavior, and limitations for Seatbelt and bubblewrap.
