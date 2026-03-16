---
title: Glossary
description: "OpenBox terminology explained: Definitions for trust scores, attestation, policies, governance decisions, and AI agent concepts."
llms_description: Definitions of all OpenBox terms
tags:
  - reference
  - trust-scoring
  - cryptography
---

# Glossary

This page provides definitions of key terms and concepts used throughout the OpenBox documentation.

---

## Activity

A single unit of work inside a [Workflow](#workflow) — calling an LLM, querying a database, invoking a tool, or making an HTTP request. Activities are where side effects happen in Temporal.

**OpenBox connection:** OpenBox captures the inputs and outputs of every Activity execution, evaluates governance policies against them, and records a [Governance Decision](#governance-decision) for each one.

**Learn more:** [Temporal 101](/getting-started/temporal-101#activity)

---

## Risk Profile

A risk scoring framework that evaluates AI agents across three weighted categories:

| Category | Weight | Parameters |
|----------|--------|------------|
| **Base Security** | 25% | Attack vector, attack complexity, privileges required, user interaction, scope |
| **AI-Specific** | 45% | Model robustness, data sensitivity, ethical impact, decision criticality, adaptability |
| **Impact** | 30% | Confidentiality, integrity, availability, safety impact |

The resulting score (0% – 100%) determines the agent's initial [Trust Tier](#trust-tier).

**Learn more:** [Assess Phase](/trust-lifecycle/assess)

---

## Alignment Score

A 0% – 100% metric measuring how well an agent's actions match its stated goals. Contributes 25% of the overall [Trust Score](#trust-score).

| Range | Rating | Meaning |
|-------|--------|---------|
| 90% – 100% | Excellent | Actions strongly aligned with goals |
| 70% – 89% | Good | Minor deviations, acceptable |
| 50% – 69% | Warning | Notable drift, review recommended |
| Below 50% | Misaligned | Significant deviation, action required |

**Learn more:** [Verify Phase](/trust-lifecycle/verify)

---

## Attestation

Cryptographic, tamper-proof evidence for every governance session. Each session's events are hashed into a [Merkle Tree](#merkle-tree) and digitally signed, creating a verifiable [Proof Certificate](#proof-certificate) that confirms no governance data was altered after the fact.

Signing providers:
- **AWS KMS** — ECDSA NIST P-256 (default)
- **External Attestation** — Your own signing service (e.g., TEE, HSM)

**Learn more:** [Attestation & Cryptographic Proof](/administration/attestation-and-cryptographic-proof)

---

## Behavioral Rules

Stateful authorization rules that detect multi-step patterns across an agent's session. Unlike [Policies](#policy-oparego), behavioral rules track prior actions to identify sequences, frequencies, or combinations.

**Pattern examples:**
- **Sequence:** PII access → External API call (without approval)
- **Frequency:** More than 10 failed auth attempts in 1 minute
- **Combination:** Database write + File export + External send

Rules are evaluated in priority order and stop at the first rule that triggers a verdict.

**Learn more:** [Authorize Phase: Behavioral Rules](/trust-lifecycle/authorize/behaviors)

---

## Behavioral Score

A 0–100 runtime compliance metric that starts at 100 for new agents and decreases when policy violations occur. Contributes 35% of the overall [Trust Score](#trust-score).

| Violation Severity | Penalty | Trust Score Impact |
|--------------------|---------|-------------------|
| Minor | -5 pts | -1.75 pts |
| Major | -15 pts | -5.25 pts |
| Critical | -25 pts | -8.75 pts |

**Learn more:** [Trust Scores](/core-concepts/trust-scores)

---

## Governance Decision

The outcome produced when OpenBox evaluates an agent operation. There are four possible decisions, listed in precedence order:

| Decision | Effect | Impact |
|----------|--------|--------|
| **HALT** | Terminates the entire agent session | Significant negative |
| **BLOCK** | Action rejected, agent continues | Negative |
| **REQUIRE_APPROVAL** | Operation paused for [HITL](#hitl-human-in-the-loop) review | Neutral (pending) |
| **ALLOW** | Operation proceeds normally | Positive |

**Precedence:** HALT > BLOCK > REQUIRE_APPROVAL > ALLOW

**Learn more:** [Governance Decisions](/core-concepts/governance-decisions)

---

## Guardrail

Pre- or post-processing validation and transformation rules applied to agent inputs and outputs. Multiple guardrails execute as a chained pipeline — the output of one feeds into the next.

**Types:**
- **Input Guardrails** — Validate/transform incoming data (PII detection, rate limiting)
- **Output Guardrails** — Validate/transform responses (PII redaction, format enforcement)

**Learn more:** [Authorize Phase: Guardrails](/trust-lifecycle/authorize/guardrails)

---

## HITL (Human-in-the-Loop)

A workflow pattern where an agent operation is paused pending human approval before proceeding. Triggered by a [REQUIRE_APPROVAL](#governance-decision) governance decision.

**Approval actions:**

| Action | Result | Trust Score Effect |
|--------|--------|-------------------|
| **Approve** | Operation proceeds | No change |
| **Reject** | Operation blocked (reason required) | -2 pts |
| **Timeout** | Operation blocked after 5 minutes | -1 pt |

**Learn more:** [Approvals](/approvals)

---

## Merkle Tree

A cryptographic data structure used to combine individual event hashes into a single session root hash. Uses SHA-256 with sorted-pair hashing to ensure consistent tree construction regardless of processing order. Enables tamper-proof verification of governance events.

**Learn more:** [Attestation & Cryptographic Proof](/administration/attestation-and-cryptographic-proof)

---

## Policy (OPA/Rego)

Stateless permission checks written in [OPA](https://www.openpolicyagent.org/) (Open Policy Agent) Rego language. Policies evaluate an input document at runtime and return a governance decision (`CONTINUE` or `REQUIRE_APPROVAL`) with an optional reason.

Unlike [Behavioral Rules](#behavioral-rules), policies are stateless — they evaluate each operation independently without tracking prior actions.

**Learn more:** [Authorize Phase: Policies](/trust-lifecycle/authorize/policies)

---

## Proof Certificate

A per-session attestation record produced after an agent session completes. Contains:

| Field | Description |
|-------|-------------|
| **Merkle Root** | SHA-256 root hash of the session's event [Merkle Tree](#merkle-tree) |
| **Signature** | Digital signature of the Merkle root (from AWS KMS or external provider) |
| **Event Count** | Number of governance events included in the attestation |

**Learn more:** [Attestation & Cryptographic Proof](/administration/attestation-and-cryptographic-proof)

---

## Query

A synchronous, read-only request to inspect a running [Workflow's](#workflow) state without affecting its execution. Queries return a value but never change the Workflow.

**OpenBox connection:** OpenBox uses Queries to inspect governance state during execution — for example, checking whether an approval is still pending. Queries do not trigger governance evaluation since they are read-only.

**Learn more:** [Temporal 101](/getting-started/temporal-101)

---

## Session Replay

An interactive dashboard view showing the complete execution timeline of an agent session. Allows step-by-step walkthrough of every operation with its governance decision (ALLOW, BLOCK, REQUIRE_APPROVAL, etc.).

**Learn more:** [Session Replay](/trust-lifecycle/session-replay)

---

## Signal

An asynchronous message sent to a running [Workflow](#workflow) from the outside. Signals let external systems inject data or trigger decisions mid-execution — for example, delivering a human approval result back to a paused agent.

**OpenBox connection:** OpenBox captures Signal data and evaluates governance policies on every Signal received. This is how [HITL](#hitl-human-in-the-loop) approvals flow back into the Workflow when a REQUIRE_APPROVAL decision pauses execution.

**Learn more:** [Temporal 101](/getting-started/temporal-101)

---

## Task Queue

A named channel that connects [Workflow](#workflow)/[Activity](#activity) starters to [Workers](#worker). When you start a Workflow on a Task Queue, only Workers listening on that same queue will pick it up.

**OpenBox connection:** OpenBox preserves your existing Task Queue configuration. The wrapped Worker polls the same queue your original Worker used — governance is transparent to task routing.

**Learn more:** [Temporal 101](/getting-started/temporal-101)

---

## Trust Layer

The governance layer OpenBox adds alongside your workflow engine. It provides trust scoring, policy enforcement, monitoring, and compliance evidence — without modifying your existing workflow code. Your workflow engine remains the system of record for execution.

**Learn more:** [What is OpenBox?](/overview)

---

## Trust Lifecycle

OpenBox's 5-phase governance model for establishing, maintaining, and evolving trust in AI agents:

1. **[Assess](/trust-lifecycle/assess)** — Establish baseline risk profile
2. **[Authorize](/trust-lifecycle/authorize)** — Define guardrails, policies, and behavioral rules
3. **[Monitor](/trust-lifecycle/monitor)** — Observe runtime behavior and telemetry
4. **[Verify](/trust-lifecycle/verify)** — Check goal alignment and session integrity
5. **[Adapt](/trust-lifecycle/adapt)** — Evolve trust based on observed patterns

**Learn more:** [Trust Lifecycle Overview](/trust-lifecycle)

---

## Trust Score

A 0–100 metric representing an agent's overall trustworthiness, calculated from three components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Risk Profile Score | 40% | Inherent risk profile |
| [Behavioral Score](#behavioral-score) | 35% | Runtime compliance |
| [Alignment Score](#alignment-score) | 25% | Goal consistency |

**Formula:** `Trust Score = (Risk Profile × 40%) + (Behavioral × 35%) + (Alignment × 25%)`

**Learn more:** [Trust Scores](/core-concepts/trust-scores)

---

## Trust Tier

One of four trust levels derived from the [Trust Score](#trust-score) that determines how strictly an agent is governed:

| Tier | Risk Profile Range | Risk Level | Description |
|------|-------------|------------|-------------|
| **Tier 1** | 0% – 24% | Low | Minimal oversight, most operations auto-approved |
| **Tier 2** | 25% – 49% | Medium | Standard controls, approval for sensitive operations |
| **Tier 3** | 50% – 74% | High | Enhanced monitoring, stricter enforcement |
| **Tier 4** | 75% – 100% | Critical | Strict controls, frequent HITL, rate limiting |

**Learn more:** [Trust Tiers](/core-concepts/trust-tiers)

---

## Worker

A process that hosts your [Workflow](#workflow) and [Activity](#activity) code and polls Temporal for tasks to execute. You start a Worker, register your Workflows and Activities on it, and it handles execution.

**OpenBox connection:** The Worker is the single integration point. You replace Temporal's `Worker` with `create_openbox_worker` — one code change that wraps the Worker with the [Trust Layer](#trust-layer). No changes to your Workflows or Activities.

**Learn more:** [Temporal 101](/getting-started/temporal-101#worker)

---

## Workflow

A durable function that orchestrates a sequence of steps. If the process crashes mid-execution, Temporal replays the Workflow from its event history so it can resume exactly where it left off.

**OpenBox connection:** When a Workflow starts, OpenBox creates a governance session. When it completes or fails, OpenBox closes the session and triggers [Attestation](#attestation). Every Workflow execution maps 1:1 to a governance session in your dashboard.

**Learn more:** [Temporal 101](/getting-started/temporal-101#workflow)