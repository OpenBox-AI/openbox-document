---
title: Concept
description: "What a sandbox is, how OpenBox routes governed commands, and the safety rules."
llms_description: Sandbox concepts, OpenBox routing, providers, and fail-closed behavior
tags:
  - sdk
  - temporal
  - governance
---

# What Is a Sandbox?

A sandbox is an isolated execution area.

Code that runs in the sandbox cannot access the host system. The sandbox permits only the operations that its policy allows.

Organizations use sandboxes to run code that they do not fully trust. Examples include web pages in a browser, applications on a phone, and containers on a server.

## What This Integration Does

AI agents run commands without human review. Each command must pass a governance checkpoint before it runs.

The checkpoint returns one verdict:

- **ALLOW** — the command runs on the host.
- **CONSTRAIN** — the command does not run on the host. The sandbox runs the governed version.
- **BLOCK / HALT / REQUIRE_APPROVAL** — the command does not run. It waits for approval, or it stops.

A `CONSTRAIN` command runs in the sandbox only. It never runs on the host.

## How the Sandbox Works

The sandbox uses the operating system isolation:

- **macOS** — Seatbelt (`sandbox-exec`).
- **Linux** — bubblewrap.

A policy defines the permissions. The policy states which files the command can access and which network destinations it can reach. All other access is denied.

## Safety Rules

1. **No host execution.** A `CONSTRAIN` command runs in the sandbox. If the sandbox fails, the command fails. It does not run on the host.
2. **One execution at most.** Each command has a stable identifier. Retries and duplicate requests cannot run the same command twice.
3. **Verifiable evidence.** The sandbox records the command, its output, and its denials. The console shows this evidence.

## Providers

A provider supplies the sandbox boundary:

- **native** (default) — the operating system sandbox: Seatbelt on macOS, bubblewrap on Linux.
- **OpenShell** (optional) — a microVM. Use it for workloads that need a stronger boundary.

The routing rules do not change between providers.

## Continue

- [Quick Start](./quick-start)
- [Provisioning](./provisioning)
- [Command Profiles](./command-profiles)
- [Demo Walkthrough](./demo-walkthrough)
- [Console Evidence](./console-evidence)
