---
title: Approvals and Guardrails
description: "How OpenBox enforces approvals, blocks, halts, and guardrail outcomes in CrewAI runs."
llms_description: CrewAI verdict enforcement and guardrails
tags:
  - sdk
  - crewai
  - python
---

# Approvals and Guardrails

## Verdicts

| Verdict | Effect |
| --- | --- |
| `ALLOW` | continue |
| `REQUIRE_APPROVAL` | poll for approval if `hitl_enabled`, otherwise follow fallback behavior |
| `BLOCK` | raise `GovernanceHaltError` at task boundary or `GovernanceBlockedError` at Layer 3 |
| `HALT` | raise `GovernanceHaltError` and short-circuit future tasks on that agent |

## Error Surfaces

| Class | When |
| --- | --- |
| `GovernanceHaltError` | `BLOCK` or `HALT` at governed task boundaries |
| `GovernanceBlockedError` | `BLOCK` or `HALT` at Layer 3 hooks |
| `GovernanceAPIError` | API failure with `governance_policy=fail_closed` |
| `GovernanceApprovalExpiredError` | approval window expired |

## Approvals

When OpenBox returns `REQUIRE_APPROVAL`:

- `hitl_enabled=True` — the SDK polls until the approval resolves
- `hitl_enabled=False` — approval handling falls back to configured fallback behavior
- `exclude_crews_hitl` — lets you disable approval polling for selected crews

## Guardrail Redaction

OpenBox responses can include guardrail output that:

- redacts `activity_input` before task execution
- redacts `activity_output` before returning results
- raises validation errors when the payload is rejected and no redacted fallback is provided

## Policy Before Guardrails

Policy runs before guardrails. If policy already returns a non-`ALLOW` verdict, guardrails for that same event may not run.

If a guardrail you expect does not fire:

- inspect the earlier policy verdict first
- verify you are matching the correct governed boundary

## Layer 3 Caveat

CrewAI may swallow `GovernanceBlockedError` raised from inside a tool path and surface a later `ValueError` from the before-LLM-call hook instead.

If you want a cleaner task-boundary failure:

- write the policy to trigger at `ActivityStarted`
- keep Layer 3 policy as a defense-in-depth fallback

## OPA Matching Shortlist

| Boundary | Match against |
| --- | --- |
| `ActivityStarted` | `input.activity_input[*].description` |
| `ActivityCompleted` | `input.activity_output.result` |
| DB hook | `input.spans[*].attributes["db.operation"]` |
| File hook | `input.spans[*].name == "file.write"` plus file path |
