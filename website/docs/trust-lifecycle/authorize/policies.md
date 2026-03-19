---
title: Policies
description: "Build AI governance policies that actually enforce: Define rules once, apply to all agents, block violations before execution."
llms_description: OPA/Rego stateless permission checks
sidebar_position: 2
tags:
  - policy-authoring
  - governance
---

# Policies

Policies are stateless permission checks written in [OPA](https://www.openpolicyagent.org/) Rego. Each policy evaluates a single input document at runtime and returns a governance decision. Policies evaluate each operation independently — they don't track prior actions or session history.

Create and manage policies under **Agent → Authorize → Policies**.

### When to use policies

Policies give you fine-grained, field-level control over individual operations. Use them when the decision depends on properties of a single request — what tool is being called, what value a field contains, or what risk tier the agent belongs to. Where guardrails validate and transform content, policies answer a different question: "is this specific operation allowed right now?"

## Create Policy

If an agent has no policy yet, the Policies sub-tab shows an empty state message and a **Create Policy** button. Use the **Create Policy** action to get started.

### Policy Editor

When you create or edit a policy you provide:

- A policy name (for operators/audit trails)
- Rego source code

### Policy Result Shape

Policies should return a single object (commonly named `result`) with:

- `decision`: the policy outcome (example: `CONTINUE`, `REQUIRE_APPROVAL`)
- `reason`: optional explanation for why the decision was produced

The platform uses this result to produce an authorization decision and to explain the outcome in audit trails.

### Testing Policies

You can test Rego using the **Rego Playground**: https://play.openpolicyagent.org/

Recommendation: test the policy logic in OPA Playground first, then paste it into OpenBox Policy Editor.

## Edit Policy

When a policy already exists, the Policies sub-tab shows:

- A Rego editor for the policy source
- A results area that shows the evaluated decision and reason

After changes, use the **Save** action to update the policy attached to the agent.

## Runtime Enforcement

At runtime, policies are evaluated against a single input document (`input`).

**Common input concepts:**

- Agent properties (identity, trust score/tier, risk tier)
- Operation context (what kind of action is happening)
- Activity spans (semantic types detected during execution)
- Request/session context used to decide whether an operation should proceed

Your policy should be written defensively:

- Prefer `default result = ...` so the policy always produces a decision
- Avoid assumptions about optional fields being present

## Policy Input Fields

Before diving into examples, here are the key fields available in the policy input document:

| Field | Source | Description |
|---|---|---|
| `activity_type` | Agent-defined | The type of Temporal activity being evaluated. Your agent defines its own activity types based on how you've structured your workflow. In the demo agent, `agent_toolPlanner` is the activity that calls the LLM and returns a structured tool call. |
| `activity_output.tool` | Agent-defined | The name of the tool the agent is planning to call. Tools are custom functions that your agent registers. For example, `CreateInvoice` or `CurrentPTO`. |
| `activity_output.args` | Agent-defined | The arguments being passed to the tool. These are tool-specific and defined by your agent's tool schema. |
| `event_type` | Platform | The Temporal event type (e.g., `ActivityCompleted`). Provided by the platform. |
| `risk_tier` | Platform | The agent's assessed risk tier (1–4). Assigned in the platform under agent settings. |
| `spans` | Platform | Operation-level classifications attached to activity execution. Each span has a `semantic_type` (e.g., `database_select`, `file_read`, `llm_completion`) that describes what kind of operation occurred. |

## Examples

### Require approval for invoice creation

When every invoice must go through a human reviewer regardless of amount — a common requirement for newly deployed agents or regulated workflows.

Although behavioral rules can also enforce approvals, policies let you define more customized, field-level approval logic.

:::tip Substitute your own names
This example uses `agent_toolPlanner` (the demo agent's activity type for tool-call decisions) and `CreateInvoice` (a custom tool name from the demo's tool registry). Replace these with your own activity type and tool names.
:::

```rego
package openbox

default result := {"decision": "CONTINUE", "reason": ""}

result := {"decision": "REQUIRE_APPROVAL", "reason": "Invoice creation requires human approval before proceeding"} if {
    input.activity_type == "agent_toolPlanner"
    input.activity_output.tool == "CreateInvoice"
}
```

Test input:

```json
{
  "activity_type": "agent_toolPlanner",
  "event_type": "ActivityCompleted",
  "activity_output": {
    "tool": "CreateInvoice",
    "next": "tool",
    "args": {
      "Amount": 1395.71,
      "TripDetails": "Qantas flight from Bangkok to Melbourne",
      "UserConfirmation": "User confirmed booking"
    },
    "response": "Let's proceed with creating an invoice for the Qantas flight."
  }
}
```

Test output:

```json
{
  "result": {
    "decision": "REQUIRE_APPROVAL",
    "reason": "Invoice creation requires human approval before proceeding"
  }
}
```

Runtime result:

`temporalio.exceptions.ApplicationError: ApprovalPending: Approval required for output: Invoice creation requires human approval before proceeding`

Approval visibility in OpenBox platform:

- **Approvals** (main sidebar)
- **Adapt → Approvals** (agent page)

### Require approval for high-value invoices only

When low-value operations can proceed automatically but high-value ones need human sign-off — balancing speed with risk control.

This variant keeps normal invoice creation automatic while routing high-value invoices to human approval. As with the previous example, replace `agent_toolPlanner` and `CreateInvoice` with your own activity type and tool names.

```rego
package openbox

default result := {"decision": "CONTINUE", "reason": ""}

result := {"decision": "REQUIRE_APPROVAL", "reason": "High-value invoice requires human approval before proceeding"} if {
    input.activity_type == "agent_toolPlanner"
    input.activity_output.tool == "CreateInvoice"
    object.get(input.activity_output.args, "Amount", 0) >= 1000
}
```

Test input (approval expected):

```json
{
  "activity_type": "agent_toolPlanner",
  "event_type": "ActivityCompleted",
  "activity_output": {
    "tool": "CreateInvoice",
    "next": "tool",
    "args": {
      "Amount": 1395.71,
      "TripDetails": "Qantas flight from Bangkok to Melbourne",
      "UserConfirmation": "User confirmed booking"
    },
    "response": "Let's proceed with creating an invoice for the Qantas flight."
  }
}
```

Test output:

```json
{
  "result": {
    "decision": "REQUIRE_APPROVAL",
    "reason": "High-value invoice requires human approval before proceeding"
  }
}
```

Runtime result:

`temporalio.exceptions.ApplicationError: ApprovalPending: Approval required for output: High-value invoice requires human approval before proceeding`

### Risk-tier-driven approvals

When different agents carry different risk profiles and you want to tighten or relax controls based on the agent's assessed risk tier.

This example uses `spans` — operation-level classifications the platform attaches to activity execution. Each span carries a `semantic_type` (e.g., `database_select`, `file_read`, `llm_completion`) that describes the kind of operation that occurred. The policy restricts different semantic types at each risk tier.

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
