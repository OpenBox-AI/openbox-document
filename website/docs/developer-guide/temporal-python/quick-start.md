---
title: Quick Start
description: "Provision the native sandbox and run the example.com demo."
llms_description: Native sandbox quick start for the example.com demo
tags:
  - sdk
  - temporal
  - governance
---

# Quick Start

This procedure provisions the default `native` provider and runs the demo against `https://example.com/`.

## Requirements

This example requires macOS on Apple Silicon. Install these tools first:

- OpenSSL
- `uv`
- `openbox-temporal-sdk-python` (pulls `openbox-sdk-python`, which provides the sandbox dispatcher)

Run the commands from the demo directory.

## Provision and Run

1. Download all assets from one release. No GitHub account or CLI is required.

   ```bash
   curl -fL -o obs-darwin-arm64 https://github.com/OpenBox-AI/openbox-sandbox/releases/download/v0.1.0-dev/obs-darwin-arm64
   curl -fL -o openbox-sandbox-darwin-arm64 https://github.com/OpenBox-AI/openbox-sandbox/releases/download/v0.1.0-dev/openbox-sandbox-darwin-arm64
   curl -fL -o policy-allow-network-dev.yaml https://github.com/OpenBox-AI/openbox-sandbox/releases/download/v0.1.0-dev/policy-allow-network-dev.yaml
   curl -fL -o SHA256SUMS https://github.com/OpenBox-AI/openbox-sandbox/releases/download/v0.1.0-dev/SHA256SUMS
   ```

2. Verify the release SHA-256 manifest. Then prepare the launcher and service.

   ```bash
   shasum -a 256 -c SHA256SUMS
   chmod +x obs-darwin-arm64 openbox-sandbox-darwin-arm64
   cp obs-darwin-arm64 obs
   ```

3. Provision the native provider with the development allowlist.

   ```bash
   ./obs provision --provider native --clean-rerun --yes \
     --policy-file "$PWD/policy-allow-network-dev.yaml"
   ```

4. Load the generated Worker environment.

   ```bash
   set -a
   . "$HOME/.config/openbox-sandbox/agent.env"
   set +a
   ```

5. Run the payment-batch demo.

   ```bash
   uv run python .
   ```

## Linux

On Linux x86_64, use the matching Linux launcher and service. Install bubblewrap before provisioning.

Provisioning has no provider fallback. It stops if it cannot verify the selected runtime or policy.

## Next Steps

- [Provisioning](./provisioning) covers release verification, platform requirements, and launcher flags.
- [Demo Walkthrough](./demo-walkthrough) explains the application and governance configuration.
