---
title: Error Handling
description: "Handle OpenBox LangGraph SDK errors: governance blocks, guardrail violations, HITL rejections, and network failures."
llms_description: Error codes and recovery patterns for the LangGraph SDK
sidebar_position: 3
tags:
  - sdk
  - reference
  - langgraph
  - governance
---

# Error Handling

Governance decisions surface as Python exceptions. The SDK raises typed exceptions you can catch and handle in your agent code.

## Import

```python
from openbox_langgraph import (
    GovernanceBlockedError,
    GovernanceHaltError,
    GuardrailsValidationError,
    ApprovalRejectedError,
    ApprovalExpiredError,
)
```

## Governance Exception Hierarchy

| Exception | Cause | Description |
|-----------|-------|-------------|
| `GovernanceBlockedError` | BLOCK verdict | Operation blocked by an OPA/Rego policy |
| `GovernanceHaltError` | HALT verdict | Entire agent session terminated by policy |
| `GuardrailsValidationError` | Guardrails match | PII, toxic content, or restricted data detected |
| `ApprovalRejectedError` | HITL rejected | A human rejected the approval request |
| `ApprovalExpiredError` | HITL timeout | No human decision before the approval deadline |

All governance exceptions carry the human-readable decision message from OpenBox as the exception message (`str(e)`).

## Handling Each Type

### GovernanceBlockedError

Raised when a tool call or LLM invocation is blocked by policy. The graph execution stops at the blocked operation.

```python
from openbox_langgraph import GovernanceBlockedError, create_openbox_graph_handler

governed = create_openbox_graph_handler(
    graph=app,
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
)

try:
    result = await governed.ainvoke({"messages": [("user", input)]})
except GovernanceBlockedError as e:
    logger.warning(f"Operation blocked by policy: {str(e)}")
    # Return a safe fallback response
    return {"response": "That action is not permitted."}
```

### GovernanceHaltError

Raised when OpenBox issues a HALT verdict — the entire session is terminated, not just a single operation. Treat this as unrecoverable for the current session.

```python
from openbox_langgraph import GovernanceHaltError

try:
    result = await governed.ainvoke({"messages": [("user", input)]})
except GovernanceHaltError as e:
    logger.error(f"Agent session halted: {str(e)}")
    await notify_ops_team(str(e))
    # Do not retry — start a new session if needed
    raise
```

### GuardrailsValidationError

Raised when a guardrail detects a policy violation — PII in a tool output, toxic content in an LLM response, or restricted data patterns.

```python
from openbox_langgraph import GuardrailsValidationError

try:
    result = await governed.ainvoke({"messages": [("user", input)]})
except GuardrailsValidationError as e:
    logger.warning(f"Guardrail triggered: {str(e)}")
    # Optionally inspect which guardrail fired
    return {"response": "I can't process that content."}
```

### ApprovalRejectedError

Raised when a human reviewer rejects the HITL approval request. The operation does not proceed.

```python
from openbox_langgraph import ApprovalRejectedError

try:
    result = await governed.ainvoke({"messages": [("user", input)]})
except ApprovalRejectedError as e:
    logger.info(f"Human rejected approval: {str(e)}")
    return {"response": f"Your request was reviewed and declined: {str(e)}"}
```

### ApprovalExpiredError

Raised when no human decision is made before the approval deadline.

```python
from openbox_langgraph import ApprovalExpiredError

try:
    result = await governed.ainvoke({"messages": [("user", input)]})
except ApprovalExpiredError as e:
    logger.warning(f"Approval timed out: {str(e)}")
    # Retry or escalate
    return {"response": "Your request is pending review. Please try again later."}
```

### Catching All Governance Errors

For a single catch-all handler, use the `OpenBoxError` base class:

```python
from openbox_langgraph import OpenBoxError

try:
    result = await governed.ainvoke({"messages": [("user", input)]})
except OpenBoxError as e:
    logger.warning(f"Governance decision: {type(e).__name__}: {str(e)}")
    return {"response": "This action was not permitted."}
```

## Configuration Exceptions

These are raised during `create_openbox_graph_handler()` — at initialization time, not during graph execution. Handle them where you set up your handler.

| Exception | Cause |
|-----------|-------|
| `OpenBoxError` | Base class for all SDK errors |
| `OpenBoxAuthError` | Invalid or missing API key |
| `OpenBoxNetworkError` | Cannot reach OpenBox Core |
| `OpenBoxInsecureURLError` | HTTP used for a non-localhost URL |

```python
from openbox_langgraph import (
    OpenBoxAuthError,
    OpenBoxNetworkError,
    OpenBoxInsecureURLError,
)

try:
    governed = create_openbox_graph_handler(
        graph=app,
        api_url=os.getenv("OPENBOX_URL"),
        api_key=os.getenv("OPENBOX_API_KEY"),
    )
except OpenBoxInsecureURLError:
    raise RuntimeError("OPENBOX_URL must use HTTPS in production")
except OpenBoxAuthError:
    raise RuntimeError("Invalid OPENBOX_API_KEY — check your credentials")
except OpenBoxNetworkError as e:
    raise RuntimeError(f"Cannot reach OpenBox Core: {e}")
```

## Best Practices

1. **Catch `GovernanceHaltError` separately** — it signals session termination; do not retry the same session
2. **Log governance exceptions** — the message comes from your policy and aids debugging
3. **Provide fallback responses** — not every block should surface as an unhandled exception to the user
4. **Clean up resources on HALT** — release connections and notify downstream systems before exiting
5. **Never catch and ignore** — governance exceptions are intentional decisions; swallowing them defeats the purpose

## Debugging

Enable verbose SDK logging to trace governance decisions:

```bash
OPENBOX_DEBUG=1 python agent.py
```

This logs the full event payload sent to OpenBox and the raw verdict received, which helps diagnose unexpected blocks or missing events.

## Next Steps

1. **[Configuration](/developer-guide/langgraph/configuration)** — Configure `on_api_error`, timeouts, and HITL behavior
2. **[Event Types](/developer-guide/event-types)** — Understand the semantic event types that trigger governance decisions
3. **[Approvals](/approvals)** — Review and process HITL requests in the dashboard
