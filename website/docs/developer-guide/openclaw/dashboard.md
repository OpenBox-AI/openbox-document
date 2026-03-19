---
title: OpenBox Dashboard
description: "What you see in the OpenBox dashboard after integrating the OpenClaw plugin: session timelines, policy configuration, guardrails, and usage analytics."
llms_description: OpenClaw dashboard features and data flow
sidebar_position: 5
tags:
  - sdk
  - openclaw
---

# OpenBox Dashboard

OpenBox dashboard at [openbox.ai](https://openbox.ai) is where you configure policies and guardrails, and where you see the results of governance evaluation. This page explains what you will see in the dashboard after integrating the OpenClaw plugin.

## Session Timelines

Each agent session appears as a workflow in the dashboard. The timeline shows the full lifecycle:

- **WorkflowStarted** - when the session began
- **ActivityStarted / ActivityCompleted** - each tool call and LLM inference, with timing and verdict
- **WorkflowCompleted / WorkflowFailed** - how the session ended

Each activity entry includes:
- Tool name or `llm_inference`
- Input parameters sent to the tool
- Output or error returned by the tool
- Governance verdict (`allow`, `block`)
- Duration
- OTel spans (HTTP requests and filesystem operations that occurred during the activity)

## Policy Configuration

Policies are configured in the OpenBox dashboard and take effect immediately - no plugin or agent restart needed.

Policies evaluate each tool call and LLM inference event and return a verdict. You define the rules; the plugin enforces the results.

### Verdicts

| Verdict | Effect |
|---------|--------|
| `allow` | Action proceeds normally |
| `block` | Current action is prevented; agent can continue with other actions |

For details on how verdicts are enforced, see [How It Works - Governance Verdicts](/developer-guide/openclaw/how-it-works#governance-verdicts).

## Guardrails Configuration

Guardrails are also configured in the dashboard. They apply to LLM requests routed through the OpenBox gateway and evaluate input content for sensitive data or policy violations.

Available guardrail types:

| Type | What it does |
|------|-------------|
| **PII Detection** | Detects and redacts personally identifiable information (emails, phone numbers, SSNs, etc.) |
| **Content Filtering** | Blocks requests matching specific content categories |
| **Toxicity** | Blocks abusive or hostile language from user interactions |
| **Ban Words** | Censors or blocks domain-specific banned terms (competitor names, internal codenames, regulated terms) |

When you configure a guardrail:
- It applies to all LLM requests passing through the gateway
- No plugin configuration changes are needed
- Results appear in the session timeline as part of the LLM activity events

### Redaction behavior

When PII detection is configured in redaction mode, the dashboard shows:
- The original content that triggered the guardrail
- The redacted version that was sent to the LLM
- Which guardrail rule matched

## Usage Analytics

The dashboard provides visibility into:
- Number of tool calls and LLM inferences per session
- Governance verdicts over time
- Guardrail triggers and redaction events
- Session success/failure rates

## What flows from the plugin to the dashboard

| Data | When it is sent | Purpose |
|------|----------------|---------|
| Session registration | First call in session | Creates the workflow entry |
| Tool call + parameters | Before each tool executes | Policy evaluation |
| Tool result + OTel spans | After each tool executes | Audit trail, telemetry |
| LLM inference metadata | On each LLM input/output | Usage tracking |
| LLM request content | Through gateway | Guardrails evaluation |
| Session outcome | On session end | Workflow completion status |
