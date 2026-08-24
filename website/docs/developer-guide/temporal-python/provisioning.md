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

Provisioning verifies a sandbox release, selects a provider and policy, and creates the local runtime configuration.

## Install the SDK

Install the Temporal SDK with sandbox support:

```bash
pip install "openbox-temporal-sdk-python[sandbox]"
```

## Download and Verify a Release

Download these matching assets from one [OpenBox Sandbox release](https://github.com/OpenBox-AI/openbox-sandbox/releases):

- The `obs-<platform>` launcher
- The `openbox-sandbox-<platform>` service
- The policy templates
- `SHA256SUMS`
- The SBOM files

Keep all assets together. Do not mix assets from different releases. The launcher and service are not interchangeable. Rename the launcher to `obs`, or invoke it by its downloaded name.

Before you run either binary, verify all downloaded assets against `SHA256SUMS`.

On macOS, run:

```bash
shasum -a 256 -c SHA256SUMS
```

On Linux, run:

```bash
sha256sum -c SHA256SUMS
```

Provisioning verifies the selected service and policy again. It compiles the policy and pins its SHA-256 digest in `service.json`. The service verifies the policy identity and compiled-profile digest before every execution.

## Select a Provider

A new configuration uses `native` by default. The following commands are equivalent:

```bash
obs provision --yes
obs provision --provider native --yes
OPENBOX_PROVIDER=native obs provision --yes
```

The `--provider` option accepts `native` or `openshell`. The command-line option overrides `OPENBOX_PROVIDER`.

Provider selection fails closed. The launcher does not switch providers when the selected provider is unavailable or fails verification.

Use `--yes` to accept non-privileged defaults without prompts. This option does not bypass platform checks, artifact verification, or required trust setup.

Use `--clean-rerun` to remove launcher-owned runtime state and provision it again:

```bash
obs provision --provider native --clean-rerun --yes
```

## Select a Policy

The native release includes these templates:

| Template | Behavior |
|---|---|
| `policy-deny-network-dev.yaml` | Denies network access for development. Linux uses a private network namespace. |
| `policy-allow-network-dev.yaml` | Allows only `/usr/bin/curl` to reach `example.com:443` for the development demo. |
| `policy-deny-network.yaml` | Provides a hardened deny-network candidate that requires Landlock. Production qualification remains required. |

Templates with `dev` in the name are not production policies. Each release line selects a default template.

Use `--policy-file` or `OPENBOX_POLICY_FILE` to select another template:

```bash
obs provision --provider native --yes \
  --policy-file "$PWD/policy-allow-network-dev.yaml"
```

## Verify the Runtime

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
obs verify
```

`obs verify` exercises the live mTLS create, ready, execute, and delete lifecycle. Checksum verification alone does not prove that a command executed.

Load the generated provider-neutral values into the Worker process:

```bash
set -a
. "$HOME/.config/openbox-sandbox/agent.env"
set +a
```

## Provider Guide

See [Native Provider](./native-provider) for Seatbelt and bubblewrap requirements, network behavior, and limitations.
