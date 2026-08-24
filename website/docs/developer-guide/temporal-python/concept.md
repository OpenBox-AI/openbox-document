---
title: Concept
description: "What a sandbox is, why governed commands need one, and how OpenBox routes them."
llms_description: Sandbox concepts in plain language, OpenBox routing, providers, and fail-closed behavior
tags:
  - sdk
  - temporal
  - governance
---

# What Is a Sandbox?

A **sandbox** is a sealed-off place where code runs without touching the rest of your machine. It can read only what you let it read, write only where you let it write, and talk to the network only where you allow it. If the code inside misbehaves, the blast radius stops at the sandbox wall.

This idea is older than AI: browsers run web pages in sandboxes, phones isolate every app, servers run containers. People use sandboxes whenever they must run something they don't fully trust.

## What People Do

Traditionally, you sandbox things you run on purpose: a build script, a downloaded binary, a plugin. You decide what's risky, wrap it, and run it. The human is the one making the safety decision, each time, by hand.

## What We Do

AI agents flip that problem. An agent **decides for itself** what code to run — sometimes dozens of times a minute — and no human is watching each decision. The safety decision must happen automatically, at the exact moment each action is about to run.

OpenBox does that with a governance verdict. Before a governed command executes:

- **ALLOW** — run it normally on the host. Governance saw nothing wrong.
- **CONSTRAIN** — the host action is **aborted before it ever runs**, and the sandbox executes the governed version instead.
- **BLOCK / HALT / REQUIRE_APPROVAL** — it does not run (or waits for a human).

So "governed sandbox commands" means: *every sensitive action stops at a checkpoint; the policy decides; if it must run, it runs inside the sandbox, never on the host.*

## How the Sandbox Works

OpenBox's sandbox uses the operating system's own isolation:

- **macOS** — Seatbelt (`sandbox-exec`): Apple's sandboxing, built into the OS.
- **Linux** — bubblewrap: the same primitive containers and Flatpak use.

The command gets an exact set of permissions — the **policy**: what files it may touch, and which network destinations are allowed (or none at all). Everything else is denied.

## The Rules That Keep It Safe

1. **Never on the host.** A `CONSTRAIN` command runs in the sandbox or nowhere. If the sandbox fails, the action fails — it is never quietly re-run on the host.
2. **Run once, at most.** Each command has a stable identity. Retries, duplicates, and crashes cannot cause a second execution of the same thing.
3. **Verifiable.** The sandbox records what ran, what it produced, and what it was denied — readable evidence in the console.

## Providers

The sandbox boundary comes from a **provider**:

- **native** (the default) — the OS sandbox: Seatbelt on macOS, bubblewrap on Linux. Lightweight, always available.
- **OpenShell** (optional) — a full microVM: a stronger boundary for the highest-risk workloads.

One command, one provider. The routing rules are identical either way.

## Continue the Journey

1. [Run the five-command quick start](./quick-start).
2. [Provision and verify a provider](./provisioning).
3. [Register admitted command profiles](./command-profiles).
4. [Walk through behavioral `CONSTRAIN` interception](./demo-walkthrough).
5. [Read the console evidence](./console-evidence).
