---
title: Cognitive Debugger
description: "Reconstruct why an agent misbehaved from sealed proof-trace evidence, and get an intervention-driven path to a repaired retry."
llms_description: Proof-trace forensics and intervention-driven remediation for misbehaving agent sessions
sidebar_position: 3
tags:
  - observability
  - audit
  - hitl
---

# Cognitive Debugger

:::tip 🆕 New page in this review
Everything on this page is new.
:::

When a session goes wrong (a HALT, a repeated BLOCK, a drift event), the Cognitive Debugger reconstructs *why* from the session's sealed evidence, and proposes an intervention that leads to a repaired retry.

## Forensics From Sealed Evidence

The Cognitive Debugger reads from the same tamper-proof evidence [Attestation & Cryptographic Proof](/administration/attestation-and-cryptographic-proof) and the [Proof Engine](/trust-lifecycle/proof-engine) already produced; it doesn't re-run the session or rely on live telemetry. Because the evidence is Merkle-sealed, the reconstruction is provably faithful to what actually happened, not a best-effort replay.

It walks backward from the failure point through the event log to identify:

- the operation that ultimately triggered the terminal verdict
- the chain of prior operations that led to it
- which layer (guardrail, policy, or behavioral rule) produced each intermediate decision

## Intervention-Driven Remediation

Once the root cause is identified, the Cognitive Debugger proposes an intervention: a targeted change to input, configuration, or a specific rule that addresses the identified cause, rather than a generic retry.

Where the proposed intervention is a correction to the operation's own input, it can be expressed as a patch and retried the same way a [Patch & Retry](/trust-lifecycle/authorize/patch-and-retry) BLOCK-with-patch is retried. The difference is where the fix comes from: Patch & Retry attaches a fix at evaluation time, from the layer that blocked the operation. The Cognitive Debugger's intervention is proposed after the fact, from forensic analysis of a session that didn't recover on its own.

## Related

- **[Patch & Retry](/trust-lifecycle/authorize/patch-and-retry)**: The evaluation-time mechanism the debugger's interventions can reuse
- **[Proof Engine](/trust-lifecycle/proof-engine)**: The dual-record evidence the debugger reconstructs from
- **[Session Replay](/trust-lifecycle/session-replay)**: Step-by-step playback of the same session
