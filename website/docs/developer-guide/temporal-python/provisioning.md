---
title: Provisioning
description: "Select, verify, and provision an OpenBox Sandbox provider and policy."
llms_description: Provider flags, policy templates, release verification, and generated Worker environment
tags:
  - sdk
  - temporal
  - governance
---

# Provisioning

Install the Temporal SDK with sandbox support:

```bash
pip install "openbox-temporal-sdk-python[sandbox]"
```

Download the matching `obs-<platform>` launcher and `openbox-sandbox-<platform>` service from one [OpenBox Sandbox release](https://github.com/OpenBox-AI/openbox-sandbox/releases). Keep the launcher, service, policy templates, `SHA256SUMS`, verification bundle, and SBOM files together. Rename or invoke the launcher as `obs`; the launcher and service are not interchangeable.

Before running either binary, verify the release with its shipped `verify-release.sh` and `SHA256SUMS`. Do not mix assets from different releases. Provisioning verifies the selected service and policy again, compiles the policy, and pins its SHA-256 in `service.json`. The service checks that policy identity and compiled-profile digest before every execution.

## Select a Provider

Fresh configurations default to `native`. These forms are equivalent:

```bash
obs provision --yes
obs provision --provider native --yes
OPENBOX_PROVIDER=native obs provision --yes
```

`--provider native` selects the provider explicitly; the command-line flag overrides `OPENBOX_PROVIDER`. Selection is explicit and fail-closed. If the selected provider is unavailable or fails verification, the launcher does not switch providers.

Use `--yes` to accept non-privileged defaults without prompts. It does not bypass platform checks, artifact verification, or required trust setup. Use `--clean-rerun` to remove launcher-owned runtime state and provision it again:

```bash
obs provision --provider native --clean-rerun --yes
```

## Select a Policy

The native release includes these templates:

| Template | Behavior |
|---|---|
| `policy-deny-network-dev.yaml` | Development deny-network policy; Linux uses a private network namespace |
| `policy-allow-network-dev.yaml` | Development demo policy; allows only `/usr/bin/curl` to reach `example.com:443` |
| `policy-deny-network.yaml` | Hardened deny-network candidate that requires Landlock; production qualification is still required |

The templates marked `dev` are not production policies. The release line chooses its default template. Override it explicitly with `--policy-file` or `OPENBOX_POLICY_FILE`:

```bash
obs provision --provider native --yes \
  --policy-file "$PWD/policy-allow-network-dev.yaml"
```

## Verify and Load the Runtime

Provisioning creates owner-only local mTLS material, starts the loopback service, runs a provider smoke test, and writes:

```text
~/.config/openbox-sandbox/agent.env
```

Check the deployment, then load the generated provider-neutral values into the Worker process:

```bash
obs status
obs verify

set -a
. "$HOME/.config/openbox-sandbox/agent.env"
set +a
```

`obs verify` exercises the live mTLS create → ready → exec → delete lifecycle. Checksum or artifact-only verification is not proof that a command executed.

Continue with [Native Provider](./native-provider) setup for Seatbelt and bubblewrap prerequisites, network behavior, and limitations.
