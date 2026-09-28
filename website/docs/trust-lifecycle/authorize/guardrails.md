---
title: Guardrails
description: "Configure all eight guardrail types to detect personal data, secrets, unsafe content, and invalid formats in agent inputs and outputs."
llms_description: Eight guardrail types and runtime behavior
sidebar_position: 2
tags:
  - guardrails
  - governance
---

# Guardrails

Guardrails are pre- and post-processing rules that validate and transform agent inputs and outputs. Multiple guardrails execute as a chained pipeline: corrected output from one feeds into the next.

Active guardrails check supported input and output events. They can block an operation when a violation is detected or apply the evaluator's correction and continue.

The platform supports **eight guardrail types**. In API configurations, `guardrail_type` is a string from `"1"` to `"8"`.

| Type ID | Guardrail Type | Use when… | Type-specific `params` |
|---------|----------------|-----------|------------------------|
| `"1"` | **PII Detection (basic)** | Inputs or outputs may contain personal information such as names, emails, or phone numbers | `entities` |
| `"2"` | **Content Filtering (NSFW)** | You need to detect and filter NSFW text | `threshold`, `validation_method` |
| `"3"` | **Toxicity** | You need to detect abusive or hostile language | `threshold`, `validation_method` |
| `"4"` | **Ban Words (Ban List)** | Specific words or phrases must not appear | `banned_words`, `max_l_dist` |
| `"5"` | **Regex Match** | Text must satisfy a required pattern or format | `regex`, `match_type` |
| `"6"` | **Secrets Detection** | Inputs or outputs may expose credentials or other recognized secret formats | `{}` |
| `"7"` | **PII — Advanced** | You need expanded personal-data detection, including jurisdiction-specific identifiers | `entities` |
| `"8"` | **Web Sanitization** | Agent content may contain unsafe HTML, scripts, or XSS markup | `{}` |

The catalog's **PII Protection** template creates type **7**, not basic PII type **1**. The **Secrets Detection** template creates type **6**.

Create guardrails under **Agent → Authorize → Guardrails**. To cover both input and output, create a guardrail for each processing stage; a single guardrail has one stage.

## Create Guardrail

### Core Fields

#### 1. Name (required)

A human-readable label displayed in the UI and audit trails. It does not change evaluation logic. Include what the guardrail checks and where it applies, for example `PII Masking: Output Responses` or `Ban Words: User Prompt`.

#### 2. Description

An optional explanation of the guardrail's purpose for other operators.

#### 3. Processing State

The processing stage determines which part of an event is evaluated:

| Stage | API value | Matching event | Evaluated data |
|-------|-----------|----------------|----------------|
| Pre-processing | `"0"` | `ActivityStarted` or `SignalReceived` | String fields under `input` |
| Post-processing | `"1"` | `ActivityCompleted` | String fields under `output` |

A stage mismatch skips the guardrail. For example, an `ActivityCompleted` event containing only `input` is not a valid test of an input guardrail.

### Guardrail Type

Choose one of the eight types above. The JSON snippets below show the `guardrail_type` and `params` portion of a configuration; set the name, processing stage, and shared settings separately.

#### Toggles

- **Block on Violation:** Enabled means `settings.on_fail: 1`. A detected violation blocks the operation. Disabled means `settings.on_fail: 0`: apply a correction when the evaluator provides one and continue. Regex Match reports a mismatch without rewriting the value.
- **Log Violations:** Stores `settings.log_violation`. The current runtime stores returned evaluation results regardless of this toggle, so it is not a control for suppressing evaluation records.

#### Activity Type

The form can store an activity name, such as `agent_validatePrompt` or `fetch_weather`.

#### Fields to Check

The form can store dot-paths such as `input.prompt`, `input.*.prompt`, `output.response`, and `output.*.response`.

:::note Current evaluation scope
The current runtime evaluates all string fields under the matching stage's `input` or `output`, including nested fields. The stored activity name and field selections do not narrow that scope.
:::

#### Timeout (ms)

The form stores this value as `settings.timeout`.

#### Retry Attempts

The form stores this value as `settings.retry_attempts`.

The current evaluation path uses service-level request deadlines and workflow retry settings. It does not apply these per-guardrail timeout and retry values.

### Violations and Evaluation Failures

A detected violation and a failure to evaluate content have different outcomes:

| Result | Block on Violation enabled (`on_fail: 1`) | Block on Violation disabled (`on_fail: 0`) |
|--------|-------------------------------------------|--------------------------------------------|
| Content passes | Continue with the original value | Continue with the original value |
| Violation detected | Block the operation | Continue with the evaluator's correction; Regex Match leaves the value unchanged |
| Evaluator returns an error for an individual text | Block the operation (fail closed for that error) | Record an error and continue with the original value (fail open for that error) |
| Evaluation request fails, for example due to a timeout, unavailable service, or rejected parameters | Return an evaluation error | Return an evaluation error |

A request-level failure is not a successful guardrail check or a normal blocking verdict. Whether an agent continues after that API error depends on its SDK or integration's error handling. **Block on Violation does not configure SDK fail-open or fail-closed behavior.**

### Test Guardrail

Use the built-in **Test Guardrail** panel in the Create Guardrail screen:

1. Select the guardrail type and set its parameters.
2. Enter a representative event payload as JSON.
3. Click **Run Test**.
4. Check that the test succeeded, whether it detected a violation, and the validated payload.

For example, select basic PII or Advanced PII with `entities: ["EMAIL_ADDRESS"]` and test this input event:

```json
{
  "activity_type": "agent_validatePrompt",
  "event_type": "ActivityStarted",
  "input": {
    "prompt": "Contact me at jane@example.com"
  }
}
```

When the email is detected, the validated preview contains a replacement such as `Contact me at <EMAIL_ADDRESS>`.

The test panel previews detection and corrected content; it does not stop a running agent or prove that SDK blocking works. It infers input or output from `event_type`. Use `ActivityStarted` with `input` for input tests and `ActivityCompleted` with `output` for output tests. A failed test is an evaluation error, not evidence that the content passed.

### Type Settings and Examples

<details>
<summary>PII Detection (basic, type 1)</summary>

Detect personally identifiable information with the basic Presidio-based evaluator. Detected values can be replaced with entity tags such as `<PHONE_NUMBER>`, `<EMAIL_ADDRESS>`, or `<PERSON>` when blocking is disabled.

**Parameters:**

- `entities`: A non-empty array of entity names to detect. Start with `EMAIL_ADDRESS` and `PHONE_NUMBER`.

```json
{
  "guardrail_type": "1",
  "params": {
    "entities": ["EMAIL_ADDRESS", "PHONE_NUMBER"]
  }
}
```

The basic PII selector offers `DATE_TIME`, `EMAIL_ADDRESS`, `IP_ADDRESS`, `LOCATION`, `PERSON`, `PHONE_NUMBER`, `US_DRIVER_LICENSE`, and `US_PASSPORT`. Choose type **7** for the expanded entity selector and additional recognizers.

The dashboard also stores a `replace_values` array alongside selected entities. For both PII types, current runtime redaction uses the evaluator's replacement tags; custom `replace_values` are not applied.

**Test:** Use the email input example above. A detected email is a violation: blocking stops the operation; automatic correction replaces the email with its entity tag.

</details>

<details>
<summary>Content Filtering (NSFW, type 2)</summary>

Detect NSFW text in agent inputs or outputs. This detector is not a general check for off-topic content or arbitrary business rules.

**Parameters:**

- `threshold`: A score from `0` to `1`. Lower values flag more content; higher values require a higher model score before flagging.
- `validation_method`: `"sentence"` checks individual sentences; `"full"` checks the whole text.

```json
{
  "guardrail_type": "2",
  "params": {
    "threshold": 0.8,
    "validation_method": "sentence"
  }
}
```

**Test:** Compare a benign sample with a representative NSFW sample. Detection depends on the model score and threshold. A detected violation blocks when blocking is enabled; automatic correction replaces flagged sentences, or the whole value for full-text validation, with `<REDACTED_BY_OPENBOX>`.

</details>

<details>
<summary>Toxicity (type 3)</summary>

Detect hostile or abusive language in agent inputs or outputs.

**Parameters:**

- `threshold`: A score from `0` to `1`. Lower values flag more content; higher values require a higher toxicity score before flagging.
- `validation_method`: `"sentence"` checks individual sentences; `"full"` checks the whole text.

```json
{
  "guardrail_type": "3",
  "params": {
    "threshold": 0.8,
    "validation_method": "full"
  }
}
```

**Test:** Compare a neutral request with a representative abusive request. A detected violation blocks when blocking is enabled; automatic correction removes flagged sentences or clears the text for full-text validation.

</details>

<details>
<summary>Ban Words (Ban List, type 4)</summary>

Detect words or phrases from a list you provide. Use this for restricted terms, internal codenames, or domain-specific language.

**Parameters:**

- `banned_words`: A non-empty array of words or phrases to detect.
- `max_l_dist`: Maximum Levenshtein distance for approximate matching. Use `0` for exact matching. Higher values allow more typos or variations and may increase false positives; the default is `1`.

```json
{
  "guardrail_type": "4",
  "params": {
    "banned_words": ["secret", "internal-codename"],
    "max_l_dist": 0
  }
}
```

**Test:** Compare `"this is public information"` with `"this is secret information"`. The second should trigger a violation. Blocking stops the operation; automatic correction masks the spans reported by the detector with asterisks. Inspect the validated preview to confirm the masked span covers what you need to protect.

</details>

<details>
<summary>Regex Match (type 5)</summary>

Require text to match a regular expression. **A match passes; a non-match is a violation.** Use Ban Words to detect forbidden terms rather than treating the regex as a list of prohibited patterns.

**Parameters:**

- `regex`: A non-empty regular expression.
- `match_type`: `"search"` requires a match anywhere in the text; `"fullmatch"` requires the entire value to match. Set this explicitly: the form initially selects `"search"`, while the evaluator defaults to `"fullmatch"` if it is omitted.

```json
{
  "guardrail_type": "5",
  "params": {
    "regex": "[A-Z]{3}-[0-9]{4}",
    "match_type": "fullmatch"
  }
}
```

**Test:** `"ABC-1234"` passes; `"ABC-12"` is a violation. With `"search"`, `"Reference ABC-1234 received"` also passes.

Regex Match reports mismatches without generating a corrected value. Enable **Block on Violation** when a mismatch must prevent execution; disabling it allows the original value to continue.

Patterns use RE2 syntax: lookarounds and backreferences are unsupported. Patterns are limited to 512 characters and each evaluated value to 16,384 characters. An invalid or oversized pattern fails the evaluation request; an oversized value produces an individual-text evaluation error.

</details>

<details>
<summary>Secrets Detection (type 6)</summary>

Detect exposed credentials and recognized secret formats, such as API keys, tokens, and private keys. The evaluator uses built-in detection rules.

**Parameters:** No type-specific parameters are required; use an empty object.

```json
{
  "guardrail_type": "6",
  "params": {}
}
```

**Test:** Compare ordinary text with a synthetic credential in a recognized format. A detected secret blocks the operation when blocking is enabled; automatic correction applies the evaluator's redaction. Inspect the validated preview for the formats your agent handles.

The catalog's **Secrets Detection** template uses this type with blocking enabled for input and output.

</details>

<details>
<summary>PII — Advanced (type 7)</summary>

Detect personal data using Presidio plus GLiNER and additional jurisdiction-specific recognizers. Both type **1** and type **7** use Presidio; Advanced PII adds detection capabilities and an expanded entity selector.

**Parameters:**

- `entities`: A non-empty array of entity names to detect. The Advanced selector includes contact data, financial identifiers, and jurisdiction-specific identifiers such as `CREDIT_CARD`, `IBAN_CODE`, `US_SSN`, `UK_NHS`, `SG_NRIC_FIN`, and `AU_TFN`.

```json
{
  "guardrail_type": "7",
  "params": {
    "entities": ["EMAIL_ADDRESS", "CREDIT_CARD", "US_SSN"]
  }
}
```

Select the entities relevant to your data. The evaluator only checks the requested entities; choosing Advanced PII does not automatically select every category.

**Test:** Start with the email input example, then test representative synthetic data for each additional selected entity. Blocking stops the operation on a finding; automatic correction replaces detected personal data with entity tags. As with basic PII, custom `replace_values` are not applied by the current runtime.

The catalog's **PII Protection** template uses type **7**. Its default configuration creates input and output guardrails with automatic correction enabled.

</details>

<details>
<summary>Web Sanitization (type 8)</summary>

Detect unsafe HTML or XSS markup and produce sanitized HTML. The evaluator uses the default HTML sanitization rules; ordinary text without HTML is left unchanged.

**Parameters:** No type-specific parameters are required; use an empty object.

```json
{
  "guardrail_type": "8",
  "params": {}
}
```

**Test:** Select post-processing and use this output event:

```json
{
  "activity_type": "render_response",
  "event_type": "ActivityCompleted",
  "output": {
    "html": "<script>alert(1)</script><b>Hello</b>"
  }
}
```

The validated preview removes the script and retains the safe markup, `<b>Hello</b>`. At runtime, blocking rejects content that requires sanitization; automatic correction continues with the sanitized HTML.

</details>
