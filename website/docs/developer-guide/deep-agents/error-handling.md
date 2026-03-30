---
title: Error Handling
description: "Handle OpenBox governance errors in DeepAgents: exception types, try/except patterns, and debugging guidance."
llms_description: Error codes and recovery patterns for the Deep Agents SDK
sidebar_position: 3
tags:
  - sdk
  - reference
  - deep-agents
  - governance
---

# Error Handling

Governance decisions surface as Python exceptions raised inside your agent's tool calls. The SDK raises typed exceptions that you can catch and handle in your own code.

All governance exceptions are re-exported from `openbox_langgraph` and available directly from `openbox_deepagent`.

## Governance Exceptions

| Exception | Raised when | Description |
|-----------|-------------|-------------|
| `GovernanceBlockedError` | Policy verdict is `BLOCK` | A single tool call was blocked. The agent can continue. |
| `GovernanceHaltError` | Policy verdict is `HALT`, or approval rejected/expired | The entire agent session is terminated. |
| `GuardrailsValidationError` | Guardrails detect PII, toxic content, or policy violation | The model call or tool input was rejected before execution. |
| `ApprovalRejectedError` | A human rejected an approval request | Automatically converted to `GovernanceHaltError` by the middleware. |
| `ApprovalExpiredError` | Approval timed out without a decision | Automatically converted to `GovernanceHaltError` by the middleware. |

:::note ApprovalRejectedError and ApprovalExpiredError
These two exceptions are caught and re-raised as `GovernanceHaltError` by the middleware. You will never see them directly unless you inspect the `__cause__` of a `GovernanceHaltError`. Handle `GovernanceHaltError` to cover all approval failure cases.
:::

## Import

```python
from openbox_deepagent import (
    GovernanceBlockedError,
    GovernanceHaltError,
    GuardrailsValidationError,
)
```

## Handling Patterns

### Wrapping ainvoke()

The simplest approach — catch governance errors at the top level:

```python
from openbox_deepagent import GovernanceBlockedError, GovernanceHaltError, GuardrailsValidationError

try:
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Research AI safety"}]},
        config={"configurable": {"thread_id": "session-001"}},
    )
except GovernanceHaltError as e:
    # Session terminated — HALT verdict, or approval rejected/expired
    logger.error(f"Agent session halted: {str(e)}")
    # Clean up session state, notify the user, etc.
    return {"status": "halted", "reason": str(e)}

except GovernanceBlockedError as e:
    # A tool was blocked but the session is still live
    # Typically surfaces here only if the agent re-raises it
    logger.warning(f"Tool blocked: {str(e)}")
    return {"status": "blocked", "reason": str(e)}

except GuardrailsValidationError as e:
    # PII or content policy violation in a model call or tool input
    logger.warning(f"Guardrails triggered: {str(e)}")
    return {"status": "guardrails", "detail": str(e)}
```

### Per-Tool Error Handling

If you wrap individual tool calls (e.g. in a custom tool executor), handle errors at that level:

```python
from openbox_deepagent import GovernanceBlockedError

async def safe_tool_call(tool_fn, *args, **kwargs):
    try:
        return await tool_fn(*args, **kwargs)
    except GovernanceBlockedError as e:
        logger.warning(f"Tool blocked by governance: {str(e)}")
        # Return a safe fallback instead of raising
        return f"[Tool blocked: {str(e)}]"
```

## Configuration Exceptions

These are raised during `create_openbox_middleware()` initialization — not during agent execution. Handle them where you set up your agent:

| Exception | Cause |
|-----------|-------|
| `OpenBoxError` | Base class for all SDK configuration errors |
| `OpenBoxAuthError` | Invalid or missing API key |
| `OpenBoxNetworkError` | Cannot reach OpenBox Core at startup |
| `OpenBoxInsecureURLError` | HTTP URL used for a non-localhost address |

```python
from openbox_deepagent import (
    OpenBoxError,
    OpenBoxAuthError,
    OpenBoxNetworkError,
    OpenBoxInsecureURLError,
)

try:
    middleware = create_openbox_middleware(
        api_url=os.getenv("OPENBOX_URL"),
        api_key=os.getenv("OPENBOX_API_KEY"),
    )
except OpenBoxAuthError:
    logger.error("Invalid OPENBOX_API_KEY — check your credentials")
    raise
except OpenBoxInsecureURLError:
    logger.error("OPENBOX_URL must use HTTPS for non-localhost URLs")
    raise
except OpenBoxNetworkError:
    logger.error("Cannot reach OpenBox Core — check OPENBOX_URL and network")
    raise
```

## Best Practices

1. **Catch `GovernanceHaltError` at the session level** — it means the agent should not continue running
2. **Treat `GovernanceBlockedError` as recoverable** — a single blocked tool does not end the session
3. **Log with context** — include the full exception message to correlate with the Dashboard event log
4. **Don't catch and ignore** — governance exceptions are intentional; suppressing them defeats the purpose
5. **Handle `GuardrailsValidationError` separately** — it fires before execution, so no side effects have occurred

## Debugging

Enable verbose SDK logging to see governance decisions as they happen:

```bash
OPENBOX_DEBUG=1 python agent.py
```

This logs every middleware hook invocation, governance request, and decision verdict to stderr.

You can also inspect the full event trace in the OpenBox Dashboard under **Agents** → your agent → **Details** → **Event Log Timeline**.

## Next Steps

1. **[Event Types](/developer-guide/event-types)** — Understand the semantic event types that trigger governance decisions
2. **[Approvals](/approvals)** — Review and process HITL requests in the dashboard
3. **[Policies](/trust-lifecycle/authorize/policies)** — Write Rego policies that produce these decisions
