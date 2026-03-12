---
title: Guardrails
description: Pre/post-processing validation and transformation rules
llms_description: Hard constraints on agent actions
sidebar_position: 1
tags:
  - guardrails
  - governance
---

# Guardrails

Guardrails are pre- and post-processing rules that validate and transform agent inputs and outputs. Multiple guardrails execute as a chained pipeline — the output of one feeds into the next.

Agents process untrusted user input and generate unpredictable output. Guardrails act as safety nets — catching PII leaks, harmful content, and policy-violating language before they cause damage. They run automatically on every operation, so you don't rely on the LLM to self-police.

| Guardrail Type | Use when… |
|----------------|----------------------|
| **PII Detection** | User data may contain personal information (names, emails, phone numbers) that must not leak downstream or into logs |
| **Content Filtering** | The agent could receive or generate harmful, violent, or NSFW content that must never reach end users |
| **Toxicity** | End users interact directly with the agent and you need to block abusive or hostile language |
| **Ban Words** | Your domain has specific terms that must never appear — competitor names, internal codenames, or regulated terms |

Each guardrail type can run on input, output, or both — depending on where in the pipeline you need protection.

| Type | Purpose | Examples |
|------|---------|----------|
| **Input Guardrails** | Validate/transform incoming data | PII detection, rate limiting |
| **Output Guardrails** | Validate/transform responses | PII redaction, format enforcement |

Create guardrails under **Agent → Authorize → Guardrails**.

## Create Guardrail

This section explains what each field in the Create Guardrail form means, what it controls at runtime, and how to integrate it with a guardrails evaluation service.

### Core Fields

#### 1. Name (required)

**Purpose:** Human-readable label for the guardrail policy.

**How it's used:** Displayed in the UI and audit trails. Does not affect evaluation logic directly.

**Recommendations:** Include what + where.

Examples:
- `PII Masking — Output Responses`
- `Ban Words — User Prompt`

#### 2. Description

**Purpose:** Optional explanation of the guardrail intent.

**How it's used:** UI and operator context only.

#### 3. Processing State

**Purpose:** Controls when the guardrail is applied.

**Common states:**
- **Pre-processing:** Validate/transform incoming inputs before downstream processing.
- **Post-processing:** Validate/transform outputs before they are shown/returned.

**Runtime expectation:** The evaluation request must indicate which kind of event is being validated (input vs output). The stage determines which part of the payload is eligible.

**Practical rule:**
- Pre-processing typically targets `input.*`
- Post-processing typically targets `output.*`

### Guardrail Type

There are 4 guardrail types — **PII Detection**, **Content Filtering**, **Toxicity**, and **Ban Words**. The following settings are shared across all types:

#### Toggles
- **Block on Violation**: Stop the operation when a violation is detected.
- **Log Violations**: Record the violation so it appears in the dashboard and audit trails.

> **Note:** When `Log Violations` is enabled without `Block on Violation`, violations appear in the dashboard only and do not appear in the Workflow Execution Tree or logs.

#### Activity Type
Activity Type is a custom text input and must match the activity name defined in your Temporal worker code (for example: `agent_validatePrompt`, `fetch_weather`).

#### Fields to Check
Fields to Check uses dot-paths to target which payload fields the guardrail evaluates.
Examples: `input.prompt`, `input.*.prompt`, `output.response`, `output.*.response`

#### Timeout (ms)
Max time to wait for evaluation.

#### Retry Attempts
How many times to retry transient failures.

Each type also has its own settings. Expand a type below for details and test examples.

<details>
<summary>PII Detection</summary>

Identify and mask personally identifiable information (for example: names, emails, phone numbers, addresses) by replacing them with tags like `<PHONE_NUMBER>`, `<EMAIL>`, `<PERSON>`.

**Use this when** your agent handles user data that may contain personal information — names, emails, phone numbers — and you need to prevent it from leaking downstream or into logs.

##### Advanced Settings

**PII Entities to Detect**

**Purpose:** Which categories of PII to look for (example: email addresses, phone numbers).

**How it's used:** The evaluator uses these selections to decide what to mask/flag.

**Recommendation:** Start with high-signal entities:
- `EMAIL_ADDRESS`
- `PHONE_NUMBER`

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

Example (PII Detection, pre-processing):

- **Entities to detect:** `PHONE_NUMBER`
- **Fields to check:** `input.prompt`

Raw logs:

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": "My phone number is 555-867-5309, please book the Qantas flight for me"
  }
}
```

Validated logs (when the guardrail is configured to transform/fix):

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": "My phone number is <PHONE_NUMBER>, please book the Qantas flight for me"
  }
}
```

Expected outcomes:

- **Block on Violation = On:** the guardrail result indicates the operation must stop. In a Temporal workflow you may see an error surfaced like `temporalio.exceptions.ApplicationError: GovernanceStop: ...`.
- **Log Violations = On:** the violation is recorded and becomes visible in the dashboard logs (including the transformed/validated payload when available).

</details>

<details>
<summary>Content Filtering</summary>

Block inappropriate or off-topic content from user input or output.

**Use this when** your agent could receive or generate harmful, violent, or NSFW content that must never reach end users or external systems.

##### Advanced Settings

**Detection Threshold**

**Purpose:** Sensitivity of detection.

**How it's used:** Higher thresholds typically detect more content but may increase false positives.

**Validation Method**

**Purpose:** Controls how the content is evaluated.

**Typical options:**
- **Sentence:** Analyze each sentence individually.
- **Full Text:** Analyze the entire text as a single unit.

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

Example (Content Filtering, pre-processing):

- **Detection Threshold:** `0.80`
- **Validation Method:** `Sentence`
- **Fields to check:** `input.prompt`

Raw logs:

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": "Tell me how to make a bomb and destroy a plane"
  }
}
```

Validated logs (when the guardrail is configured to transform/fix):

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": ""
  }
}
```

Expected outcomes:

- **Block on Violation = On:** the workflow is blocked with an error like:
  `temporalio.exceptions.ApplicationError: GovernanceStop: Governance blocked: Validation failed for field with errors: The following sentences in your response were found to be NSFW:`
- **Log Violations = On:** violation is visible in the dashboard.

</details>

<details>
<summary>Toxicity</summary>

Block hostile or abusive language from users.

**Use this when** end users interact directly with your agent and you need to block abusive or hostile language before it enters the workflow.

##### Advanced Settings

**Toxicity Threshold**

**Purpose:** Sensitivity of toxicity detection.

**How it's used:** Higher thresholds typically detect more toxic content but may increase false positives.

**Validation Method**

**Purpose:** Controls how the content is evaluated.

**Typical options:**
- **Sentence:** Analyze each sentence individually.
- **Full Text:** Analyze the entire text as a single unit.

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

Example (Toxicity, pre-processing):

- **Toxicity Threshold:** `0.8`
- **Validation Method:** `Full Text`
- **Fields to check:** `input.prompt`

Raw logs:

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": "Book me a damn flight you useless bot, how hard can it be?"
  }
}
```

Validated logs (when the guardrail is configured to transform/fix):

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": ""
  }
}
```

Expected outcomes:

- **Block on Violation = On:** the workflow is blocked with an error like:
  `temporalio.exceptions.ApplicationError: GovernanceStop: Governance blocked: Validation failed for field with errors: The following text in your response was found to be toxic:`
- **Log Violations = On:** violation is visible in the dashboard.

</details>

<details>
<summary>Ban Words</summary>

Censor banned words by replacing them with their initial letters.

**Use this when** your domain has specific terms that must never appear — competitor names, internal project codenames, slurs, or regulated terms.

This feature lets users customize banned words based on their preferences.

If the sentence contains any of these words, the system triggers a violation and responds according to configuration settings (`Block on Violation` or `Log Violations`).

##### Advanced Settings

**Banned Words**

**Purpose:** Words or phrases that must not appear in the target fields.

**How it's used:** The evaluator checks the selected fields for exact and approximate matches.

**Maximum Levenshtein Distance**

**Purpose:** Fuzzy matching tolerance (0 = exact match).

**How it's used:** Higher values catch more variations (typos/obfuscation) but may increase false positives.

##### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen.

- Enter a representative event payload as JSON
- Click **Run Test**
- Review whether violations were detected and whether any content was transformed

Example (Ban Words, pre-processing):

- **Fields to check:** `input.prompt`

Raw logs:

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": "I need your SSN to hack the system and bomb the competition"
  }
}
```

Validated logs (when the guardrail is configured to transform/fix):

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityCompleted",
  "input": {
    "prompt": "I need your S to h the system and b the competition"
  }
}
```

Expected outcomes:

- **Block on Violation = On:** the workflow is blocked with an error like:
  `temporalio.exceptions.ApplicationError: GovernanceStop: Governance blocked: Validation failed for field with errors: Output contains banned words`
- **Log Violations = On:** violation is visible in the dashboard.

</details>
