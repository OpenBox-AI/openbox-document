---
title: Behavioral Rules
description: "Define allowed AI agent behaviors: Specify permitted actions, data access patterns, API calls, and interaction boundaries per agent."
llms_description: Stateful multi-step pattern detection
sidebar_position: 3
tags:
  - policy-authoring
  - governance
  - hitl
---

# Behavioral Rules

Behavioral rules are stateful authorization rules that detect multi-step patterns across an agent's session. Unlike [policies](./policies), behavioral rules track prior actions to identify sequences, frequencies, or combinations.

| Pattern | Example |
|---------|---------|
| **Sequence** | PII access → External API call (without approval) |
| **Frequency** | More than 10 failed auth attempts in 1 minute |
| **Combination** | Database write + File export + External send |

Rules are evaluated in priority order and stop at the first rule that triggers a verdict. Remaining rules are not evaluated.

## Create a Behavioral Rule

Behavioral rules are created through a 4-step wizard under **Agent → Authorize → Behavioral Rules**.

### Step 1 — Basic Info

- **Rule Name (required):** Human-readable label for the rule.
- **Description:** Optional operator context.
- **Priority (1–100):** Higher priority rules are evaluated first.

### Step 2 — Trigger

Select the **Trigger semantic type**. This is the action that will be checked (for example: `file_write`, `database_select`, `llm_completion`, `http_get`).

### Step 3 — States (Required Prior States)

Select one or more **Required Prior States**. These semantic types must occur before the trigger. When multiple prior states are selected, **all** of them must have occurred (AND logic) for the prerequisite to be met.

This step defines the **Prior State** prerequisite described below.

### Step 4 — Enforcement

- **Verdict:** What to do when the prerequisite is not met.
- **On Reject Message (required):** Message shown/logged when the verdict is applied.

Finish by clicking **Create Rule**.

:::info Important
Governance decisions from behavioral rules (and all authorization layers) surface as **exceptions** in your code. You must handle these in your activities to avoid unexpected crashes — see [Error Handling](/developer-guide/temporal-python/error-handling) for the full list of exception types (`GovernanceStop`, `ApprovalPending`, etc.) and how to handle them.
:::

## Verdicts

When a behavioral rule fires, it produces one of the following verdicts:

| Verdict | Description |
|--------|-------------|
| `ALLOW` | Permit and log |
| `REQUIRE_APPROVAL` | Send to HITL queue |
| `BLOCK` | Action rejected, agent continues |
| `HALT` | Terminates entire agent session |

When a rule is configured with `REQUIRE_APPROVAL` and triggered at runtime, the approval request appears in:

- **Approvals** (main sidebar)
- **Adapt** tab (on the agent page)

Note: the Approvals page does not update in real time. If you don't see an approval immediately, refresh the page.

## How Prior State and Trigger Work

A behavioral rule has two key fields:

- **Trigger:** the action being checked (example: `llm_completion`)
- **Prior State:** the action(s) that must have happened before the trigger (example: `http_get`)

The prior state acts as a prerequisite. If the prerequisite is met, the action continues. If not, the configured verdict is applied. When a rule has multiple prior states, all of them must have occurred for the prerequisite to be satisfied.

| Result | Outcome |
|--------|---------|
| Prior state happened before trigger | Continue (prerequisite met) |
| Prior state happened after trigger (or never) | Verdict applied (`BLOCK`, `REQUIRE_APPROVAL`, etc.) |

**Example — prerequisite met:**

- Trigger = `llm_completion`
- Prior State = `http_get`
- Verdict = `BLOCK`

Activity sequence: `http_get → file_write → file_read → http_post → llm_completion`

`http_get` happened before `llm_completion` → prerequisite met → continues normally.

**Example — prerequisite not met:**

- Trigger = `http_get`
- Prior State = `llm_completion`
- Verdict = `BLOCK`

`llm_completion` has not happened before `http_get` → prerequisite not met → `BLOCK`.

## Test Examples

Use these two sample rules to make runtime behavior obvious while testing. Enable only one rule at a time.

### Rule 1 — `HALT`

- **Rule Name:** `Query Data Before Generating Reports`
- **Trigger:** `file_write`
- **Prior State:** `database_select`
- **Verdict:** `HALT`
- **Priority:** `50`
- **Reject Message:** `File write halted: the agent must have queried the database before generating any file output. Prevent reports built on fabricated data`

Why this matters: a reporting agent skips the database query and goes straight to file generation. The LLM fills in convincing figures from its own knowledge — properly formatted, realistic numbers, but entirely fabricated. This rule ensures the agent has queried real data before producing any file output.

Result in terminal:

`temporalio.exceptions.ApplicationError: GovernanceStop: Governance blocked: Behavioral violation: File write halted: the agent must have queried the database before generating any file output. Prevent reports built on fabricated data`

The chat/session ends immediately after the halt.

### Rule 2 — `REQUIRE_APPROVAL`

- **Rule Name:** `Review Payment Before Processing`
- **Trigger:** `http_post`
- **Prior State:** `file_read`
- **Verdict:** `REQUIRE_APPROVAL`
- **Priority:** `50`
- **Reject Message:** `Payment submission paused: the agent has not read the invoice document before attempting payment. Review required before funds are released`

Why this matters: an accounts payable agent attempts to submit a payment without reading the invoice first. A finance controller reviews the payment amount and recipient, and decides whether to approve or reject it.
