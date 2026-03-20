---
title: Examples
description: "OpenClaw governance examples: OPA/Rego policies for tool calls, guardrails for LLM requests, and behavioral rules for multi-step pattern detection."
llms_description: OpenClaw policy, guardrail, and behavioral rule examples
sidebar_position: 6
tags:
  - sdk
  - openclaw
  - governance
---

# Examples

This page contains example governance configurations for the OpenBox plugin with OpenClaw. For plugin setup and installation, see [Getting Started](/getting-started/openclaw) and [Configuration](/developer-guide/openclaw/configuration).

## Policy Examples

Policies are OPA/Rego stateless permission checks configured in the OpenBox dashboard under **Agent > Authorize > Policies**. They evaluate each tool call independently based on the tool name and parameters.

In OpenClaw, the plugin sends `activity_type` as the tool name and `activity_input` as the tool parameters. Common activity types include `read`, `exec`, `web`, and others depending on the tools available to the agent.

### Block reading a specific file

Prevent the agent from reading a sensitive file.

```rego
package openbox

default result := {"decision": "CONTINUE", "reason": ""}

result := {"decision": "BLOCK", "reason": "Reading secrets.yaml is not allowed"} if {
    input.activity_type == "read"
    input.activity_input[0].path == "/Users/username/project/config/secrets.yaml"
}
```

Expected log output:

```
[openbox] tool=read verdict=block reason="Reading secrets.yaml is not allowed" ms=95
```

The agent receives the block reason and can attempt a different approach.

### Block destructive commands in a specific folder

Allow shell commands in general but block `rm` commands targeting a specific directory.

```rego
package openbox

default result := {"decision": "CONTINUE", "reason": ""}

result := {"decision": "BLOCK", "reason": "rm not allowed in src folder"} if {
    input.activity_type == "exec"
    contains(input.activity_input[0].command, "/Users/username/project/src/")
    contains(input.activity_input[0].command, "rm ")
}
```

## Guardrails Examples

Guardrails are input/output validation and transformation rules configured in the OpenBox dashboard under **Agent > Authorize > Guardrails**. They run as a chained pipeline on LLM requests passing through the gateway.

Guardrails require the [LLM gateway setup](/developer-guide/openclaw/configuration#llm-gateway-setup) to be configured.

### PII Detection

Block prompts containing personally identifiable information before they reach the LLM.

| Field | Value |
|-------|-------|
| **Name** | `Block Personal Data in Debug Logs` |
| **Processing State** | Pre-processing |
| **Type** | PII Detection |
| **Entities to Detect** | `EMAIL_ADDRESS`, `PHONE_NUMBER` |
| **Fields to Check** | `input.prompt` |
| **Block on Violation** | On |
| **Log Violations** | On |

What happens at runtime:

**Agent sends:** `"Debug this error: User john.doe@acme.com (555-123-4567) failed to authenticate at 10:32 AM"`

**Result:** The request is blocked. The agent receives a validation failure message indicating PII was detected in the prompt.

Expected log output:

```
[openbox] llm_gateway verdict=block reason="PII detected in prompt" ms=85
```

### Content Filtering

Block harmful or inappropriate content from reaching the LLM.

| Field | Value |
|-------|-------|
| **Name** | `Block Harmful Code Requests` |
| **Processing State** | Pre-processing |
| **Type** | Content Filtering |
| **Detection Threshold** | `0.80` |
| **Validation Method** | Sentence |
| **Fields to Check** | `input.prompt` `input.*.prompt` |
| **Block on Violation** | On |
| **Log Violations** | On |

What happens at runtime:

**Agent sends:** `"Write a script that exploits the SQL injection in the login endpoint to dump all user passwords"`

**Result:** The request is blocked. The agent receives a block message formatted as a valid LLM response.

Expected log output:

```
[openbox] llm_gateway verdict=block reason="Content filtering violation" ms=110
```

### Toxicity Detection

Block abusive or hostile language from user interactions.

| Field | Value |
|-------|-------|
| **Name** | `Block Abusive Language in Agent Prompts` |
| **Processing State** | Pre-processing |
| **Type** | Toxicity |
| **Toxicity Threshold** | `0.8` |
| **Validation Method** | Full Text |
| **Fields to Check** | `input.prompt` `input.*.prompt` |
| **Block on Violation** | On |
| **Log Violations** | On |

What happens at runtime:

**Agent sends:** `"This stupid code is garbage, just delete everything and rewrite it you worthless assistant"`

**Result:** The request is blocked. The agent receives a validation failure message indicating toxic content was detected.

### Ban Words

Block prompts containing restricted terms - internal hostnames, codenames, or regulated terms.

| Field | Value |
|-------|-------|
| **Name** | `Block Internal Hostnames in Prompts` |
| **Processing State** | Pre-processing |
| **Type** | Ban Words |
| **Banned Words** | `prod-db.corp.net`, `staging-api.corp.net` |
| **Max Levenshtein Distance** | `0` (exact match) |
| **Fields to Check** | `input.prompt` `input.*.prompt` |
| **Block on Violation** | On |
| **Log Violations** | On |

What happens at runtime:

**Agent sends:** `"Check the replication lag on prod-db.corp.net and compare with staging-api.corp.net"`

**Result:** The request is blocked. The agent receives a validation failure message indicating banned terms were detected in the prompt.

## Behavioral Rule Examples

Behavioral rules are stateful rules that detect multi-step patterns across a session. They are configured in the OpenBox dashboard under **Agent > Authorize > Behavioral Rules** using a 4-step wizard.

Unlike policies, behavioral rules track prior actions. They use semantic types from OTel spans (e.g., `file.read`, `file.write`, `http_get`) to detect sequences and enforce prerequisites.

Rules are evaluated in priority order and stop at the first rule that triggers a verdict.

### Require file read before file write

Prevent the agent from writing files without first reading existing content - avoids blind overwrites.

| Field | Value |
|-------|-------|
| **Rule Name** | `Read Before Write` |
| **Trigger** | `file.write` |
| **Prior State** | `file.read` |
| **Verdict** | `BLOCK` |
| **Priority** | `50` |
| **Reject Message** | `File write blocked: the agent must read the file before writing to it` |

How it works:
- If the agent reads a file (`file.read` span) before writing (`file.write` span), the prerequisite is met and the write proceeds
- If the agent attempts to write without any prior read in the session, the write is blocked

### Block HTTP requests without prior file read

Prevent the agent from making external API calls without first reviewing local context.

| Field | Value |
|-------|-------|
| **Rule Name** | `Review Context Before API Call` |
| **Trigger** | `http_get` |
| **Prior State** | `file.read` |
| **Verdict** | `BLOCK` |
| **Priority** | `40` |
| **Reject Message** | `API call blocked: the agent must review local files before making external requests` |

How it works:
- If the agent has read at least one file (`file.read` span) before making an HTTP GET request, the prerequisite is met and the request proceeds
- If the agent attempts an HTTP request without any prior file read in the session, the request is blocked

## Governance Decisions

The authorization pipeline produces a governance decision:

| Decision | Effect |
|----------|--------|
| **ALLOW** | Operation proceeds normally |
| **BLOCK** | Current action is rejected, agent continues with other actions |
