---
title: Quick Start
description: "Provision the native sandbox and run the example.com demo in five commands."
llms_description: Five-command native sandbox quick start
tags:
  - sdk
  - temporal
  - governance
---

# Quick Start

This macOS Apple Silicon example provisions the `native` provider with the development allowlist, loads its Worker environment, and runs the demo against `https://example.com/`. Install `gh`, OpenSSL, `uv`, and the Temporal SDK's sandbox extra first.

Run these five commands from the demo directory:

```bash
# 1. Download one complete release. Keep its launcher, service, policy templates, and SHA256SUMS together.
gh release download --repo OpenBox-AI/openbox-sandbox

# 2. Make the matching binaries executable and expose the launcher as ./obs.
chmod +x obs-darwin-arm64 openbox-sandbox-darwin-arm64 && cp obs-darwin-arm64 obs

# 3. Re-provision native with the example.com allowlist.
./obs provision --provider native --clean-rerun --yes --policy-file "$PWD/policy-allow-network-dev.yaml"

# 4. Load the provider-neutral SDK environment.
set -a; source "$HOME/.config/openbox-sandbox/agent.env"; set +a

# 5. Run the payment-batch demo.
uv run python .
```

On Linux x86_64, use the matching Linux launcher and service names and install bubblewrap before provisioning. Provisioning has no provider fallback: if the selected runtime or policy cannot be verified, it stops.

For release verification, platform prerequisites, and other flags, continue to [Provisioning](./provisioning). For the application and governance setup behind the final command, see the [Demo Walkthrough](./demo-walkthrough).
