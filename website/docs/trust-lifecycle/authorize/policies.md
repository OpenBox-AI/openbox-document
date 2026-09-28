---
title: Policies
description: "Build AI governance policies that actually enforce: Define rules once, apply to all agents, block violations before execution."
llms_description: OPA/Rego stateless permission checks
sidebar_position: 3
tags:
  - policy-authoring
  - governance
---

# Policies

Policies are stateless permission checks written in [OPA](https://www.openpolicyagent.org/) Rego. Each policy evaluates a single input document at runtime and returns a governance decision. Policies evaluate each operation independently: they don't track prior actions or session history.

Create and manage policies under **Agent → Authorize → Policies**.

### When to use policies

Policies give you fine-grained, field-level control over individual operations. Use them when the decision depends on properties of a single request: what tool is being called, what value a field contains, or what trust tier the agent belongs to. Where guardrails validate and transform content, policies answer a different question: "is this specific operation allowed right now?"

## Fail-Closed by Design

If the policy engine is ever unreachable, OpenBox fails closed: an unknown policy state never silently permits an action. During an engine outage, the affected operation resolves to `BLOCK`, and the response is flagged so the fallback path is distinguishable from a normal policy decision. This is the deliberate opposite of how [Behavioral Rules](./behaviors) fail open on outage; see [Authorize → Fail-Safe By Design](./#fail-safe-by-design) for how the layers compare.

## Create Policy

If an agent has no policy yet, the Policies sub-tab shows an empty state message and a **Create Policy** button. Use the **Create Policy** action to get started.

Policies can be authored either through a visual builder or by writing raw Rego directly. The rest of this page documents the Rego authoring path.

### Policy Editor

When you create or edit a policy you provide:

- A policy name (for operators/audit trails)
- Rego source code

### Policy Result Shape

Policies should return a single object named `result` with:

- `decision`: one of `ALLOW`, `CONSTRAIN`, `REQUIRE_APPROVAL`, `BLOCK`, or `HALT`
- `reason`: optional explanation for why the decision was produced; a string or `null`
- `constraints`: required for `CONSTRAIN`, with exactly `["run_in_sandbox"]`; omit it for other decisions

The platform uses this result to produce an authorization decision and to explain the outcome in audit trails.

| Decision | Effect |
|---|---|
| `ALLOW` | Permit the operation to proceed normally. |
| `CONSTRAIN` | Request sandbox execution for the operation, using `constraints: ["run_in_sandbox"]`. |
| `REQUIRE_APPROVAL` | Pause the operation for human review. |
| `BLOCK` | Reject the current operation. |
| `HALT` | Terminate the agent session. |

Use `ALLOW` in new policies. Core also accepts `CONTINUE` as a legacy alias for `ALLOW`.

See [Governance Decisions](/core-concepts/governance-decisions) for decision handling and [Sandbox Execution](/trust-lifecycle/authorize/sandbox-execution) for sandbox execution requirements.

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

- Agent properties (identity and trust score/tier)
- Operation context (what kind of action is happening)
- Activity spans (semantic types detected during execution)
- Request/session context used to decide whether an operation should proceed

Your policy should be written defensively:

- Prefer `default result = ...` so the policy always produces a decision
- Avoid assumptions about optional fields being present

## Policy Input Fields

Core builds the policy input from the current governance event and the agent's stored trust data. Optional fields are present only when supplied; the examples below use a Temporal demo agent's payload shape.

| Field | Source | Description |
|---|---|---|
| `event_type` | SDK event | The governance event type, such as `ActivityStarted`, `ActivityCompleted`, or `SignalReceived`. |
| `activity_type` | Agent/SDK | The activity or operation name, when supplied. In the demo agent, `agent_toolPlanner` calls the LLM and returns a structured tool call. |
| `activity_input` | Agent/SDK | The activity input, parsed from JSON when supplied. Its shape is defined by the integration: it can be an object, array, or scalar. |
| `activity_output` | Agent/SDK | The activity output, parsed from JSON when supplied. Its shape is also defined by the integration. |
| `activity_output.tool` | Demo agent | The planned tool name in the demo planner's output, such as `CreateInvoice` or `CurrentPTO`. This nested field is specific to that output schema. |
| `activity_output.args` | Demo agent | The planned tool's arguments in the demo planner's output. The argument names follow the agent's tool schema. |
| `trust_tier` | Platform | The agent's current trust tier (1–4), when available. |
| `risk_tier` | Platform | An alias of `trust_tier`, with the same value and availability. |
| `spans` | SDK event | Spans supplied with the current event. Omitted when no spans are supplied. Each span has a `semantic_type`, such as `database_select`, `file_read`, or `llm_completion`. |

Match the shape your integration sends. For an array of activity arguments, use `input.activity_input[_]`; for an object containing a prompt, use `input.activity_input.prompt`. The demo planner's tool arguments are under `input.activity_output.args`.

A direct reference to a missing field is undefined in Rego, so a rule that requires that value will not match. If no rule matches, the policy returns its default result. Test with representative events from your integration, including events where optional input, output, or spans are absent.

## Examples

### Require approval for invoice creation

When every invoice must go through a human reviewer regardless of amount, a common requirement for newly deployed agents or regulated workflows.

Although behavioral rules can also enforce approvals, policies let you define more customized, field-level approval logic.

:::tip Substitute your own names
This example uses `agent_toolPlanner` (the demo agent's activity type for tool-call decisions) and `CreateInvoice` (a custom tool name from the demo's tool registry). Replace these with your own activity type and tool names.
:::

```rego
package openbox

default result := {"decision": "ALLOW", "reason": ""}

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

When low-value operations can proceed automatically but high-value ones need human sign-off, balancing speed with risk control.

This variant keeps normal invoice creation automatic while routing high-value invoices to human approval. As with the previous example, replace `agent_toolPlanner` and `CreateInvoice` with your own activity type and tool names.

```rego
package openbox

default result := {"decision": "ALLOW", "reason": ""}

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

Use this pattern to tighten or relax controls based on the agent's current trust tier. The `risk_tier` input used here carries the same value as `trust_tier`.

This example uses `spans` supplied with the current event. Each span carries a `semantic_type` (e.g., `database_select`, `file_read`, `llm_completion`) that describes the kind of operation that occurred. The policy requires approval for different semantic types at each tier.

```rego
package org.openboxai.policy_564f9d9cc31b408c9947e04d64dbb7aa

tier2_restricted := {"internal"}
tier3_restricted := {"database_select", "file_read", "file_open"}
tier4_restricted := {"database_select", "file_read", "file_open", "llm_completion"}

default result = {"decision": "ALLOW", "reason": null}

result := {"decision": "ALLOW", "reason": null} if {
  input.risk_tier == 1
}

result := {"decision": "REQUIRE_APPROVAL", "reason": "T2: internal tools require approval"} if {
  input.risk_tier == 2
  some span in input.spans
  tier2_restricted[span.semantic_type]
}

result := {"decision": "ALLOW", "reason": null} if {
  input.risk_tier == 2
  not has_restricted_span(tier2_restricted)
}

result := {"decision": "REQUIRE_APPROVAL", "reason": "T3: db/file operations require approval"} if {
  input.risk_tier == 3
  some span in input.spans
  tier3_restricted[span.semantic_type]
}

result := {"decision": "ALLOW", "reason": null} if {
  input.risk_tier == 3
  not has_restricted_span(tier3_restricted)
}

result := {"decision": "REQUIRE_APPROVAL", "reason": "T4: restricted operations require approval"} if {
  input.risk_tier == 4
  some span in input.spans
  tier4_restricted[span.semantic_type]
}

result := {"decision": "ALLOW", "reason": null} if {
  input.risk_tier == 4
  not has_restricted_span(tier4_restricted)
}

has_restricted_span(restricted_set) if {
  some span in input.spans
  restricted_set[span.semantic_type]
}
```
