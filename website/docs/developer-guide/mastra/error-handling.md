---
title: Error Handling
description: "Handle OpenBox startup failures, runtime verdicts, approval states, and guardrail validation errors in Mastra."
llms_description: Mastra SDK error handling and runtime recovery patterns
sidebar_position: 5
tags:
  - sdk
  - reference
  - governance
---

# Error Handling

OpenBox decisions surface as runtime errors when execution cannot continue normally. This page covers the errors you should expect from the Mastra SDK and how to reason about them in production.

## Startup Errors

Startup validation can fail before your service begins serving traffic.

Typical configuration errors:

| Error | Cause |
| --- | --- |
| `OpenBoxConfigError` | Required configuration is missing or invalid |
| `OpenBoxAuthError` | API key is missing, malformed, or rejected |
| `OpenBoxInsecureURLError` | HTTP is used for a non-localhost OpenBox URL |

What to do:

1. Verify `OPENBOX_URL` and `OPENBOX_API_KEY`.
2. Confirm the service can reach OpenBox Core.
3. Use `validate: false` only for local mocks or tests.

## Runtime Governance Errors

The SDK raises runtime errors when a verdict or approval state requires execution to stop or pause.

| Error | Meaning |
| --- | --- |
| `GovernanceHaltError` | OpenBox returned a stop or halt-style verdict, or fail-closed converted an API failure into a halt |
| `GuardrailsValidationError` | A guardrail validation failed |
| `ApprovalPendingError` | Approval is still pending or inline polling timed out |
| `ApprovalRejectedError` | A human reviewer rejected the request |
| `ApprovalExpiredError` | Approval expired before a decision was made |

## How To Interpret Them

### `GovernanceHaltError`

This is the main error when policy blocks or halts execution. Treat it as an intentional stop, not as a transport failure.

### `GuardrailsValidationError`

This means the input or output violated a guardrail validation rule. If you are testing guardrails live, first confirm policy returned `allow` for that event.

### Approval Errors

- `ApprovalPendingError` means the decision is still unresolved.
- `ApprovalRejectedError` means a human explicitly denied the action.
- `ApprovalExpiredError` means the approval window closed without a final decision.

## Failure Policy Matters

`onApiError` or `OPENBOX_GOVERNANCE_POLICY` changes runtime behavior during OpenBox outages:

| Setting | Behavior |
| --- | --- |
| `fail_open` | Execution usually continues after retries are exhausted |
| `fail_closed` | Governed execution halts after retries are exhausted |

If behavior seems unexpected, verify the effective config at startup.

## Recommended Handling Strategy

1. Treat governance errors as intentional business-control outcomes.
2. Log the relevant workflow, run, and activity context.
3. Do not swallow approval or halt errors silently.
4. Keep your business fallback behavior explicit rather than implicit.

## Related Guides

- [Approvals and Guardrails](/developer-guide/mastra/approvals-and-guardrails)
- [Troubleshooting](/developer-guide/mastra/troubleshooting)
