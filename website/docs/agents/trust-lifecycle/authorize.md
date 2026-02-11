---
title: Authorize
description: Phase 2 - Configure guardrails, policies, and behavioral rules
sidebar_position: 2
---

# Authorize (Phase 2)

The Authorize phase defines what the agent is allowed to perform. Configure guardrails, policies, and behavioral rules to enforce governance.

Access via **Agent Detail → Authorize** tab.

## Authorization Pipeline

Operations flow through three layers:

```
Incoming Operation
       │
       ▼
┌─────────────┐
│ Guardrails  │  Input/output validation and transformation
└─────────────┘
       │
       ▼
┌─────────────┐
│ OPA Policy  │  Stateless permission checks
└─────────────┘
       │
       ▼
┌─────────────┐
│ Behavioral  │  Stateful multi-step pattern detection
│ Rules       │
└─────────────┘
       │
       ▼
  Governance Decision
```

### How Multiple Rules Execute

Guardrails, Policies, and Behavioral Rules can all have multiple rules active at the same time. The key difference is how they execute.

#### Guardrails

Guardrails run all enabled guardrails in order, like a pipeline. The output of one guardrail feeds into the next, which allows chaining transformations.

Example:

`Input → Guardrail 1 (mask PII) → Guardrail 2 (mask bad words) → Guardrail 3 (block harmful content) → Output`

#### Policies

Policies execute based on the logic defined in your Rego file. Multiple rules can exist within a single policy.

#### Behavioral Rules

Behavioral Rules are checked one by one in priority order and stop at the first rule that triggers a verdict. Remaining rules are not evaluated.

Example:

`Rule 1 (not triggered) → Rule 2 (triggered → REQUIRE_APPROVAL) → STOP`

`Rule 3, 4, 5...` are skipped.

In short:

| Feature | Multiple active? | Execution |
|--------|------------------|----------|
| Guardrails | ✅ Yes | Runs all in order (chained) |
| Policies | ✅ Yes | Executes based on Rego logic |
| Behavioral Rules | ✅ Yes | Stops at first triggered verdict |

## Sub-tabs

The Authorize tab has three sub-tabs:

### Guardrails

Pre/post-processing validation and transformation:

| Type | Purpose | Examples |
|------|---------|----------|
| **Input Guardrails** | Validate/transform incoming data | PII detection, rate limiting |
| **Output Guardrails** | Validate/transform responses | PII redaction, format enforcement |

Create guardrails under **Agent → Authorize → Guardrails**.

#### Create Guardrail

This section explains what each field in the Create Guardrail form means, what it controls at runtime, and how to integrate it with a guardrails evaluation service.

##### Core Fields

###### Name (required)

**Purpose:** Human-readable label for the guardrail policy.

**How it’s used:** Displayed in the UI and audit trails. Does not affect evaluation logic directly.

**Recommendations:** Include what + where.

Examples:
- `PII Masking — Output Responses`
- `Ban Words — User Prompt`

###### Description

**Purpose:** Optional explanation of the guardrail intent.

**How it’s used:** UI and operator context only.

###### Processing Stage

**Purpose:** Controls when the guardrail is applied.

**Common stages:**
- **Pre-processing:** Validate/transform incoming inputs before downstream processing.
- **Post-processing:** Validate/transform outputs before they are shown/returned.

**Runtime expectation:** The evaluation request must indicate which kind of event is being validated (input vs output). The stage determines which part of the payload is eligible.

**Practical rule:**
- Pre-processing typically targets `input.*`
- Post-processing typically targets `output.*`

<details>
<summary>PII Detection</summary>

##### Configuration Settings

###### Block on Violation

**Purpose:** Controls what happens when a violation is detected.

**Modes:**
- **On (Block):** The evaluation result indicates the content is not allowed. Your system should stop the operation.
- **Off (Transform/Fix):** The service attempts to sanitize the content (mask PII, replace banned words, etc.). Your system can continue using the sanitized output.

**Integration requirement:** The caller must check the evaluation response and enforce the decision consistently.

###### Log Violations

**Purpose:** Whether to record that a violation happened for monitoring and incident review.

**Recommendation:** Log at least:
- Guardrail name/type
- Activity type
- Field flagged
- Decision (allow/transform/block)
- Reason (if provided)
- Timestamps and correlation IDs

##### Targeting (Where the guardrail applies)

###### Activity Type

**Purpose:** Applies the guardrail only to specific operations (for example: validate prompt, tool call, final answer).

**How it’s used:** The evaluation payload includes an `activity_type`. Guardrails are routed by matching this value.

**Recommendations:**
- Use a stable, versioned naming scheme (example: `agent.validate_prompt.v1`)
- Keep a registry of activity types so operators can choose reliably

###### Fields to Check

**Purpose:** Specifies which fields inside the activity payload should be validated.

**How it works:** The evaluator reads values from your payload using dot-paths. In the UI, these are entered as “chips”/tags (one field per chip).

**Recommended patterns:**
- Simple fields: `input.prompt`, `output.response`
- Lists: `output.results`
- Nested list objects: `output.results.*.text`

**Recommendations:**
- Validate the smallest meaningful string field
- Keep payload schemas stable so these paths remain valid

##### Advanced Settings

###### Timeout (ms)

**Purpose:** Maximum time you’re willing to wait for evaluation.

**How to enforce:** Apply as an HTTP request timeout in the calling layer (frontend or backend).

**Recommendations:**
- Interactive testing: 3–10 seconds
- Production enforcement: tune based on latency SLOs

###### Retry Attempts

**Purpose:** How many times the caller should retry if evaluation fails due to transient errors.

**How to enforce:** Implement retries in the calling system (usually backend) with exponential backoff and caps.

**Recommendations:**
- 0–2 retries for synchronous user flows
- Ensure retries are safe and do not duplicate side effects downstream

##### Type-Specific Fields

###### PII Entities to Detect

**Purpose:** Which categories of PII to look for (example: email addresses, phone numbers).

**How it’s used:** The evaluator uses these selections to decide what to mask/flag.

**Recommendation:** Start with high-signal entities:
- `EMAIL_ADDRESS`
- `PHONE_NUMBER`

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

##### Runtime Enforcement

At runtime, call an evaluate endpoint with:

- Agent identity
- Activity payload

Example evaluate request:

```json
{
  "token": "<agent-token>",
  "logs": {
    "event_type": "ActivityCompleted",
    "activity_type": "agent_validatePrompt",
    "output": { "response": "Email me at me@example.com" }
  }
}
```

Expected response concepts:

- `validated_logs`: sanitized payload (when transformation is enabled)
- `results`: structured violations/allow decisions
- `action`: `continue` or `stop`

Caller rules:

- If `action == "stop"`: do not proceed; optionally show a policy message and log the violation
- Else: continue using `validated_logs`

</details>

<details>
<summary>Content Filtering</summary>

##### Configuration Settings

###### Block on Violation

**Purpose:** Controls what happens when a violation is detected.

**Modes:**
- **On (Block):** The evaluation result indicates the content is not allowed. Your system should stop the operation.
- **Off (Transform/Fix):** The service attempts to sanitize the content (mask PII, replace banned words, etc.). Your system can continue using the sanitized output.

**Integration requirement:** The caller must check the evaluation response and enforce the decision consistently.

###### Log Violations

**Purpose:** Whether to record that a violation happened for monitoring and incident review.

**Recommendation:** Log at least:
- Guardrail name/type
- Activity type
- Field flagged
- Decision (allow/transform/block)
- Reason (if provided)
- Timestamps and correlation IDs

##### Targeting (Where the guardrail applies)

###### Activity Type

**Purpose:** Applies the guardrail only to specific operations (for example: validate prompt, tool call, final answer).

**How it’s used:** The evaluation payload includes an `activity_type`. Guardrails are routed by matching this value.

**Recommendations:**
- Use a stable, versioned naming scheme (example: `agent.validate_prompt.v1`)
- Keep a registry of activity types so operators can choose reliably

###### Fields to Check

**Purpose:** Specifies which fields inside the activity payload should be validated.

**How it works:** The evaluator reads values from your payload using dot-paths. In the UI, these are entered as “chips”/tags (one field per chip).

**Recommended patterns:**
- Simple fields: `input.prompt`, `output.response`
- Lists: `output.results`
- Nested list objects: `output.results.*.text`

**Recommendations:**
- Validate the smallest meaningful string field
- Keep payload schemas stable so these paths remain valid

##### Advanced Settings

###### Timeout (ms)

**Purpose:** Maximum time you’re willing to wait for evaluation.

**How to enforce:** Apply as an HTTP request timeout in the calling layer (frontend or backend).

**Recommendations:**
- Interactive testing: 3–10 seconds
- Production enforcement: tune based on latency SLOs

###### Retry Attempts

**Purpose:** How many times the caller should retry if evaluation fails due to transient errors.

**How to enforce:** Implement retries in the calling system (usually backend) with exponential backoff and caps.

**Recommendations:**
- 0–2 retries for synchronous user flows
- Ensure retries are safe and do not duplicate side effects downstream

##### Type-Specific Fields

###### Detection Threshold

**Purpose:** Sensitivity of detection.

**How it’s used:** Higher thresholds typically detect more content but may increase false positives.

###### Validation Method

**Purpose:** Controls how the content is evaluated.

**Typical options:**
- **Sentence:** Analyze each sentence individually.
- **Full Text:** Analyze the entire text as a single unit.

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

##### Runtime Enforcement

At runtime, call an evaluate endpoint with:

- Agent identity
- Activity payload

Example evaluate request:

```json
{
  "token": "<agent-token>",
  "logs": {
    "event_type": "ActivityCompleted",
    "activity_type": "agent_validatePrompt",
    "output": { "response": "Email me at me@example.com" }
  }
}
```

Expected response concepts:

- `validated_logs`: sanitized payload (when transformation is enabled)
- `results`: structured violations/allow decisions
- `action`: `continue` or `stop`

Caller rules:

- If `action == "stop"`: do not proceed; optionally show a policy message and log the violation
- Else: continue using `validated_logs`

</details>

<details>
<summary>Toxicity</summary>

##### Configuration Settings

###### Block on Violation

**Purpose:** Controls what happens when a violation is detected.

**Modes:**
- **On (Block):** The evaluation result indicates the content is not allowed. Your system should stop the operation.
- **Off (Transform/Fix):** The service attempts to sanitize the content (mask PII, replace banned words, etc.). Your system can continue using the sanitized output.

**Integration requirement:** The caller must check the evaluation response and enforce the decision consistently.

###### Log Violations

**Purpose:** Whether to record that a violation happened for monitoring and incident review.

**Recommendation:** Log at least:
- Guardrail name/type
- Activity type
- Field flagged
- Decision (allow/transform/block)
- Reason (if provided)
- Timestamps and correlation IDs

##### Targeting (Where the guardrail applies)

###### Activity Type

**Purpose:** Applies the guardrail only to specific operations (for example: validate prompt, tool call, final answer).

**How it’s used:** The evaluation payload includes an `activity_type`. Guardrails are routed by matching this value.

**Recommendations:**
- Use a stable, versioned naming scheme (example: `agent.validate_prompt.v1`)
- Keep a registry of activity types so operators can choose reliably

###### Fields to Check

**Purpose:** Specifies which fields inside the activity payload should be validated.

**How it works:** The evaluator reads values from your payload using dot-paths. In the UI, these are entered as “chips”/tags (one field per chip).

**Recommended patterns:**
- Simple fields: `input.prompt`, `output.response`
- Lists: `output.results`
- Nested list objects: `output.results.*.text`

**Recommendations:**
- Validate the smallest meaningful string field
- Keep payload schemas stable so these paths remain valid

##### Advanced Settings

###### Timeout (ms)

**Purpose:** Maximum time you’re willing to wait for evaluation.

**How to enforce:** Apply as an HTTP request timeout in the calling layer (frontend or backend).

**Recommendations:**
- Interactive testing: 3–10 seconds
- Production enforcement: tune based on latency SLOs

###### Retry Attempts

**Purpose:** How many times the caller should retry if evaluation fails due to transient errors.

**How to enforce:** Implement retries in the calling system (usually backend) with exponential backoff and caps.

**Recommendations:**
- 0–2 retries for synchronous user flows
- Ensure retries are safe and do not duplicate side effects downstream

##### Type-Specific Fields

###### Toxicity Threshold

**Purpose:** Sensitivity of toxicity detection.

**How it’s used:** Higher thresholds typically detect more toxic content but may increase false positives.

###### Validation Method

**Purpose:** Controls how the content is evaluated.

**Typical options:**
- **Sentence:** Analyze each sentence individually.
- **Full Text:** Analyze the entire text as a single unit.

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

##### Runtime Enforcement

At runtime, call an evaluate endpoint with:

- Agent identity
- Activity payload

Example evaluate request:

```json
{
  "token": "<agent-token>",
  "logs": {
    "event_type": "ActivityCompleted",
    "activity_type": "agent_validatePrompt",
    "output": { "response": "Email me at me@example.com" }
  }
}
```

Expected response concepts:

- `validated_logs`: sanitized payload (when transformation is enabled)
- `results`: structured violations/allow decisions
- `action`: `continue` or `stop`

Caller rules:

- If `action == "stop"`: do not proceed; optionally show a policy message and log the violation
- Else: continue using `validated_logs`

</details>

<details>
<summary>Ban Words</summary>

##### Configuration Settings

###### Block on Violation

**Purpose:** Controls what happens when a violation is detected.

**Modes:**
- **On (Block):** The evaluation result indicates the content is not allowed. Your system should stop the operation.
- **Off (Transform/Fix):** The service attempts to sanitize the content (mask PII, replace banned words, etc.). Your system can continue using the sanitized output.

**Integration requirement:** The caller must check the evaluation response and enforce the decision consistently.

###### Log Violations

**Purpose:** Whether to record that a violation happened for monitoring and incident review.

**Recommendation:** Log at least:
- Guardrail name/type
- Activity type
- Field flagged
- Decision (allow/transform/block)
- Reason (if provided)
- Timestamps and correlation IDs

##### Targeting (Where the guardrail applies)

###### Activity Type

**Purpose:** Applies the guardrail only to specific operations (for example: validate prompt, tool call, final answer).

**How it’s used:** The evaluation payload includes an `activity_type`. Guardrails are routed by matching this value.

**Recommendations:**
- Use a stable, versioned naming scheme (example: `agent.validate_prompt.v1`)
- Keep a registry of activity types so operators can choose reliably

###### Fields to Check

**Purpose:** Specifies which fields inside the activity payload should be validated.

**How it works:** The evaluator reads values from your payload using dot-paths. In the UI, these are entered as “chips”/tags (one field per chip).

**Recommended patterns:**
- Simple fields: `input.prompt`, `output.response`
- Lists: `output.results`
- Nested list objects: `output.results.*.text`

**Recommendations:**
- Validate the smallest meaningful string field
- Keep payload schemas stable so these paths remain valid

##### Advanced Settings

###### Timeout (ms)

**Purpose:** Maximum time you’re willing to wait for evaluation.

**How to enforce:** Apply as an HTTP request timeout in the calling layer (frontend or backend).

**Recommendations:**
- Interactive testing: 3–10 seconds
- Production enforcement: tune based on latency SLOs

###### Retry Attempts

**Purpose:** How many times the caller should retry if evaluation fails due to transient errors.

**How to enforce:** Implement retries in the calling system (usually backend) with exponential backoff and caps.

**Recommendations:**
- 0–2 retries for synchronous user flows
- Ensure retries are safe and do not duplicate side effects downstream

##### Type-Specific Fields

###### Banned Words

**Purpose:** Words or phrases that must not appear in the target fields.

**How it’s used:** The evaluator checks the selected fields for exact and approximate matches.

###### Maximum Levenshtein Distance

**Purpose:** Fuzzy matching tolerance (0 = exact match).

**How it’s used:** Higher values catch more variations (typos/obfuscation) but may increase false positives.

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

##### Runtime Enforcement

At runtime, call an evaluate endpoint with:

- Agent identity
- Activity payload

Example evaluate request:

```json
{
  "token": "<agent-token>",
  "logs": {
    "event_type": "ActivityCompleted",
    "activity_type": "agent_validatePrompt",
    "output": { "response": "Email me at me@example.com" }
  }
}
```

Expected response concepts:

- `validated_logs`: sanitized payload (when transformation is enabled)
- `results`: structured violations/allow decisions
- `action`: `continue` or `stop`

Caller rules:

- If `action == "stop"`: do not proceed; optionally show a policy message and log the violation
- Else: continue using `validated_logs`

</details>

### Policies

Policies are OPA/Rego rules used for stateless permission checks.

Create and manage policies under **Agent → Authorize → Policies**.

<details>
<summary>Create Policy</summary>


If an agent has no policy yet, the Policies sub-tab shows an empty state message and a **Create Policy** button.

#### Create Policy

Use the **Create Policy** action in the Policies sub-tab.

##### Policy Editor

When you create/edit a policy you typically provide:

- A policy name (for operators/audit trails)
- Rego source code

##### Policy Result Shape

Policies should return a single object (commonly named `result`) with:

- `decision`: the policy outcome (example: `CONTINUE`, `REQUIRE_APPROVAL`)
- `reason`: optional explanation for why the decision was produced

The platform uses this result to produce an authorization decision and to explain the outcome in audit trails.

##### Testing Policies

You can test Rego using the **Rego Playground**: https://play.openpolicyagent.org/

Example policy (risk-tier-driven approvals using restricted semantic types):

```rego
package org.openboxai.policy_564f9d9cc31b408c9947e04d64dbb7aa

tier2_restricted := {"internal"}
tier3_restricted := {"database_select", "file_read", "file_open"}
tier4_restricted := {"database_select", "file_read", "file_open", "llm_completion"}

default result = {"decision": "CONTINUE", "reason": null}

result := {"decision": "CONTINUE", "reason": null} if {
  input.risk_tier == 1
}

result := {"decision": "REQUIRE_APPROVAL", "reason": "T2: internal tools blocked"} if {
  input.risk_tier == 2
  some span in input.spans
  tier2_restricted[span.semantic_type]
}

result := {"decision": "CONTINUE", "reason": null} if {
  input.risk_tier == 2
  not has_restricted_span(tier2_restricted)
}

result := {"decision": "REQUIRE_APPROVAL", "reason": "T3: db/file blocked"} if {
  input.risk_tier == 3
  some span in input.spans
  tier3_restricted[span.semantic_type]
}

result := {"decision": "CONTINUE", "reason": null} if {
  input.risk_tier == 3
  not has_restricted_span(tier3_restricted)
}

result := {"decision": "REQUIRE_APPROVAL", "reason": "T4: restricted"} if {
  input.risk_tier == 4
  some span in input.spans
  tier4_restricted[span.semantic_type]
}

result := {"decision": "CONTINUE", "reason": null} if {
  input.risk_tier == 4
  not has_restricted_span(tier4_restricted)
}

has_restricted_span(restricted_set) if {
  some span in input.spans
  restricted_set[span.semantic_type]
}
```

</details>

<details>
<summary>Edit Policy</summary>

#### Edit Policy (policy exists)

When a policy already exists, the Policies sub-tab shows:

- A large Rego editor for the policy source
- A results area that shows the evaluated decision and reason

After changes, use the **Save** action to update the policy attached to the agent.

##### Runtime Enforcement

At runtime, policies are evaluated against a single input document (`input`).

**Common input concepts:**

- Agent properties (identity, trust score/tier, risk tier)
- Operation context (what kind of action is happening)
- Activity spans (semantic types detected during execution)
- Request/session context used to decide whether an operation should proceed

Your policy should be written defensively:

- Prefer `default result = ...` so the policy always produces a decision
- Avoid assumptions about optional fields being present

</details>

### Behavioral Rules

Stateful rules that detect multi-step patterns:

| Pattern | Example |
|---------|---------|
| **Sequence** | PII access → External API call (without approval) |
| **Frequency** | More than 10 failed auth attempts in 1 minute |
| **Combination** | Database write + File export + External send |

**Creating a Behavioral Rule:**

Behavioral rules are created through a 5-step wizard.

##### Step 1 — Basic Info

- **Rule Name (required):** Human-readable label for the rule.
- **Description:** Optional operator context.
- **Priority (1–100):** Higher priority rules are evaluated first.

##### Step 2 — Trigger

Select the **Trigger semantic type**. This is the action that will be checked (for example: `file_write`, `database_select`, `llm_completion`, `http_get`).

##### Step 3 — States (Required Prior States)

Select one or more **Required Prior States**. These semantic types must occur before the trigger.

This step defines the **Prior State** prerequisite described below.

##### Step 4 — Advanced

- **Time Window (minutes):** Prior states must have occurred within this window before the trigger.
- **Apply to all agents:** Apply this rule globally (instead of only the current agent).

##### Step 5 — Enforcement

- **Verdict:** What to do when the prerequisite is not met.
- **On Reject Message (required):** Message shown/logged when the verdict is applied.

Finish by clicking **Create Rule**.

#### How Prior State and Trigger Work

A behavioral rule has two key fields:

- **Trigger:** the action being checked (example: `llm_completion`)
- **Prior State:** the action that must have happened before the trigger (example: `http_get`)

The rule is simple: the prior state acts as a prerequisite. If the prerequisite is met, the action continues. If not, the configured verdict is applied.

This applies to all verdicts:

- `BLOCK`
- `REQUIRE_APPROVAL`
- `HALT`
- `CONSTRAIN`

**Prior State → Trigger Order**

| Result | Outcome |
|--------|---------|
| Prior state happened before trigger | ✅ Continue (prerequisite met) |
| Prior state happened after trigger (or never) | ❌ Verdict applied (`BLOCK`, `REQUIRE_APPROVAL`, etc.) |

Example:

Rule:

- Trigger = `llm_completion`
- Prior State = `http_get`
- Verdict = `BLOCK`

Activity sequence:

`http_get → file_write → file_read → http_post → llm_completion`

`http_get` happened before `llm_completion` → prerequisite met → continues normally.

In contrast:

Rule:

- Trigger = `http_get`
- Prior State = `llm_completion`
- Verdict = `BLOCK`

`llm_completion` has not happened before `http_get` → prerequisite not met → `BLOCK`.

#### REQUIRE_APPROVAL visibility

When a behavioral rule is configured with `REQUIRE_APPROVAL` and triggered at runtime, the approval request appears in two places:

- **Approvals** (main sidebar)
- **Adapt** tab (on the agent page)

Note: the Approvals page does not update in real time. If you don’t see an approval immediately, refresh the page.

**Behavioral Rule Actions:**

| Action | Description |
|--------|-------------|
| `ALLOW` | Permit and log |
| `CONSTRAIN` | Apply additional limits |
| `REQUIRE_APPROVAL` | Send to HITL queue |
| `BLOCK` | Action rejected, agent continues |
| `HALT` | Terminates entire agent session |

## Governance Decisions

The authorization pipeline produces one of five decisions:

| Decision | Effect | Trust Impact |
|----------|--------|--------------|
| **HALT** | Terminates entire agent session | Significant negative |
| **BLOCK** | Action rejected, agent continues | Negative |
| **REQUIRE_APPROVAL** | Pauses for HITL | Neutral (pending) |
| **CONSTRAIN** | Proceeds with limits | Neutral |
| **ALLOW** | Operation proceeds | Positive (compliance) |

## Trust Tier-Based Defaults

Lower trust tiers receive stricter defaults:

| Tier | Default Behavior |
|------|-----------------|
| **Tier 1** | Most operations allowed, logging only |
| **Tier 2** | Standard policies enforced |
| **Tier 3** | Enhanced checks, some HITL |
| **Tier 4** | Strict controls, frequent HITL |
| **Untrusted** | All significant operations require approval |

## Next Phase

Once you've configured governance controls:

→ **[Monitor](/docs/agents/trust-lifecycle/monitor)** - Start your agent and observe its runtime behavior with Session Replay
