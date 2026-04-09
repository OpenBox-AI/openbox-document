---
title: Error Handling
description: "Handle governance decisions in LangChain Python agents: GovernanceBlockedError, GovernanceHaltError, GuardrailsValidationError, and configuration exceptions."
llms_description: LangChain Python SDK error handling patterns
sidebar_position: 3
tags:
  - sdk
  - langchain
  - python
---

# Error Handling

The SDK raises typed exceptions when governance policies block, halt, or flag agent operations. This page covers each exception type and recommended handling patterns.

## Governance Exceptions

These exceptions are raised during agent execution when a governance policy fires. All are re-exported from `openbox_langgraph`.

### GovernanceBlockedError

Raised when a policy returns a `BLOCK` verdict. The specific tool or LLM call is blocked, but the agent can continue with other operations.

```python
from openbox_langchain import GovernanceBlockedError
```

### GovernanceHaltError

Raised when a policy returns `HALT`, or when a human-in-the-loop approval is rejected or expires. The entire agent session should stop.

```python
from openbox_langchain import GovernanceHaltError
```

### GuardrailsValidationError

Raised when guardrails detect a policy violation in the user's input (PII, toxic content, restricted topics). Fires during the pre-screen check in `before_agent` or during `wrap_model_call`.

```python
from openbox_langchain import GuardrailsValidationError
```

## Handling Patterns

### Top-Level Wrapping

Wrap the `invoke()` or `ainvoke()` call to catch governance decisions:

```python
from openbox_langchain import (
    GovernanceBlockedError,
    GovernanceHaltError,
    GuardrailsValidationError,
)

try:
    result = agent.invoke({"messages": [("user", prompt)]})
except GovernanceHaltError as e:
    # Session terminated — do not retry
    print(f"Session halted: {e}")
except GovernanceBlockedError as e:
    # Single tool blocked — agent may have continued
    print(f"Tool blocked: {e}")
except GuardrailsValidationError as e:
    # Input rejected by guardrails
    print(f"Input violation: {e}")
```

### Async Pattern

Same exceptions work with `ainvoke()`:

```python
try:
    result = await agent.ainvoke({"messages": [("user", prompt)]})
except GovernanceHaltError as e:
    print(f"Session halted: {e}")
except GovernanceBlockedError as e:
    print(f"Tool blocked: {e}")
except GuardrailsValidationError as e:
    print(f"Input violation: {e}")
```

### Per-Tool Error Handling

Wrap individual tools with a fallback to make your agent resilient to governance blocks:

```python
from langchain_core.tools import tool
from openbox_langchain import GovernanceBlockedError

@tool
def safe_search(query: str) -> str:
    """Search the web with governance fallback."""
    try:
        return web_search.invoke({"query": query})
    except GovernanceBlockedError:
        return "Search blocked by governance policy. Using cached data instead."
```

## Configuration Exceptions

These exceptions are raised during `create_openbox_langchain_middleware()` initialization — before any agent runs.

| Exception | Cause |
|-----------|-------|
| `OpenBoxError` | Base class for all OpenBox exceptions |
| `OpenBoxAuthError` | Invalid or missing API key |
| `OpenBoxNetworkError` | Cannot reach OpenBox Core |
| `OpenBoxInsecureURLError` | HTTP used for non-localhost address |

```python
from openbox_langchain import (
    OpenBoxAuthError,
    OpenBoxNetworkError,
    OpenBoxInsecureURLError,
)

try:
    middleware = create_openbox_langchain_middleware(
        api_url=os.environ["OPENBOX_URL"],
        api_key=os.environ["OPENBOX_API_KEY"],
    )
except OpenBoxAuthError:
    print("Invalid API key — check OPENBOX_API_KEY")
except OpenBoxNetworkError:
    print("Cannot reach OpenBox — check OPENBOX_URL")
except OpenBoxInsecureURLError:
    print("HTTPS required for non-localhost URLs")
```

## HITL Approval Exceptions

When a governance policy returns `REQUIRE_APPROVAL`, the middleware polls for a human decision. If the approval is rejected or expires, the middleware catches the approval exception and re-raises it as `GovernanceHaltError`:

| Internal Exception | Re-raised As |
|-------------------|-------------|
| `ApprovalRejectedError` | `GovernanceHaltError` |
| `ApprovalExpiredError` | `GovernanceHaltError` |
| `ApprovalTimeoutError` | `GovernanceHaltError` |

You only need to catch `GovernanceHaltError` — the middleware handles the conversion.

## Best Practices

1. **Catch `GovernanceHaltError` at the session level** — the agent should not continue after a halt
2. **Treat `GovernanceBlockedError` as recoverable** — a single tool was blocked, the agent can still use other tools
3. **Log with context** — correlate errors with the Dashboard event log for full visibility
4. **Don't catch and ignore** — governance decisions are intentional; swallowing them defeats the purpose
5. **Handle `GuardrailsValidationError` separately** — it fires before execution, so no work was done

## Debugging

Enable verbose logging to see governance decisions as they happen:

```bash
OPENBOX_DEBUG=1 python agent.py
```

This logs every middleware hook invocation, governance request, and decision verdict to stderr.

You can also inspect the full event trace in the OpenBox Dashboard under **Agents** → your agent → **Details** → **Event Log Timeline**.

## Next Steps

1. **[Event Types](/developer-guide/event-types)** — Understand the semantic event types that trigger governance decisions
2. **[Approvals](/approvals)** — Review and process HITL requests in the dashboard
3. **[Policies](/trust-lifecycle/authorize/policies)** — Write Rego policies that produce these decisions
