---
title: Error Handling
description: "Handle OpenBox governance errors in LangChain agents: exception types, try/except patterns, and debugging guidance."
llms_description: Error codes and recovery patterns for the LangChain SDK
sidebar_position: 5
tags:
  - sdk
  - reference
  - governance
---

# Error Handling

Governance decisions surface as Python exceptions raised inside your LangChain
agent run. The SDK re-exports the OpenBox exception hierarchy from
`openbox_langgraph`, so you can import errors directly from `openbox_langchain`.

## Import

```python
from openbox_langchain import (
    ApprovalExpiredError,
    ApprovalRejectedError,
    GovernanceBlockedError,
    GovernanceHaltError,
    GuardrailsValidationError,
    OpenBoxAuthError,
    OpenBoxError,
    OpenBoxInsecureURLError,
    OpenBoxNetworkError,
)
```

## Governance Exceptions

| Exception | Raised when | Description |
|-----------|-------------|-------------|
| `GovernanceBlockedError` | Policy verdict is `BLOCK` | A model call, tool call, or hook operation was blocked. |
| `GovernanceHaltError` | Policy verdict is `HALT`, or approval rejection/expiry halted execution | The entire agent session should stop. |
| `GuardrailsValidationError` | Guardrails detect restricted content | PII, toxic content, or other configured guardrail matched. |
| `ApprovalRejectedError` | Lower-level approval polling receives a rejection | Re-exported for direct OpenBox approval polling integrations. |
| `ApprovalExpiredError` | Lower-level approval polling times out | Re-exported for direct OpenBox approval polling integrations. |

All governance exceptions include the human-readable policy or guardrail message
as `str(error)`.

## Handling Patterns

### Wrap agent.invoke()

For synchronous LangChain agents:

```python
from openbox_langchain import GovernanceBlockedError, GovernanceHaltError

try:
    result = agent.invoke({"messages": [("user", user_input)]})
except GovernanceBlockedError as error:
    logger.warning("OpenBox blocked operation: %s", error)
    result = {"messages": [("assistant", "That action is not permitted.")]}
except GovernanceHaltError as error:
    logger.error("OpenBox halted session: %s", error)
    raise
```

### Wrap agent.ainvoke()

For asynchronous agents:

```python
from openbox_langchain import GuardrailsValidationError, OpenBoxError

try:
    result = await agent.ainvoke({"messages": [("user", user_input)]})
except GuardrailsValidationError as error:
    logger.warning("Guardrail triggered: %s", error)
    return {"response": "I cannot process that content."}
except OpenBoxError as error:
    logger.warning("OpenBox governance decision: %s", error)
    return {"response": "This request was not allowed."}
```

### Approval Outcomes

If a policy returns `REQUIRE_APPROVAL`, OpenBox creates a human approval request.
When approval is enabled, the middleware polls for the reviewer decision. In the
standard LangChain middleware path, rejection or expiry is surfaced as
`GovernanceHaltError` so the agent run stops consistently.

```python
from openbox_langchain import GovernanceHaltError

try:
    result = agent.invoke({"messages": [("user", user_input)]})
except GovernanceHaltError as error:
    return {"response": f"Approval did not continue execution: {error}"}
```

## Configuration Exceptions

These exceptions are raised when creating the middleware, before the agent run
starts.

| Exception | Cause |
|-----------|-------|
| `OpenBoxAuthError` | Invalid or missing OpenBox API key |
| `OpenBoxNetworkError` | OpenBox Core cannot be reached during startup validation |
| `OpenBoxInsecureURLError` | Non-localhost OpenBox URL uses HTTP instead of HTTPS |
| `OpenBoxError` | Base class for all SDK errors |

```python
from openbox_langchain import (
    OpenBoxAuthError,
    OpenBoxInsecureURLError,
    OpenBoxNetworkError,
    create_openbox_langchain_middleware,
)

try:
    middleware = create_openbox_langchain_middleware(
        api_url=os.environ["OPENBOX_URL"],
        api_key=os.environ["OPENBOX_API_KEY"],
        agent_did=os.environ["OPENBOX_AGENT_DID"],
        agent_private_key=os.environ["OPENBOX_AGENT_PRIVATE_KEY"],
        agent_name="SupportAgent",
    )
except OpenBoxInsecureURLError:
    raise RuntimeError("OPENBOX_URL must use HTTPS outside localhost")
except OpenBoxAuthError:
    raise RuntimeError("Invalid OPENBOX_API_KEY")
except OpenBoxNetworkError as error:
    raise RuntimeError(f"Cannot reach OpenBox Core: {error}") from error
```

## DID Configuration Errors

DID signing is enabled by default for newly registered agents. If signing is
enabled, provide both `OPENBOX_AGENT_DID` and `OPENBOX_AGENT_PRIVATE_KEY`, or
pass both `agent_did` and `agent_private_key` directly.

Supplying only one value fails during SDK configuration. This prevents sending
unsigned or partially identified governance requests for agents that require
cryptographic identity.

## Best Practices

1. **Catch `GovernanceHaltError` separately** — it means the current session should stop
2. **Treat `GovernanceBlockedError` as intentional** — return a safe fallback instead of retrying blindly
3. **Log the exception message** — it contains the policy or guardrail reason
4. **Do not swallow governance exceptions silently** — doing so hides policy decisions from operators
5. **Validate on startup in production** — keep `validate=True` unless you are writing tests
6. **Use `fail_closed` for high-risk agents** — prefer availability with `fail_open` only when appropriate

## Debugging

Enable verbose SDK logging:

```bash
OPENBOX_DEBUG=1 python agent.py
```

Then check the OpenBox Dashboard:

1. Go to **Agents**
2. Open the agent you are testing
3. Open the latest run
4. Review the event timeline and governance decisions

## Next Steps

1. **[Configuration](/developer-guide/langchain/configuration)** — Configure fail policies, identity, and telemetry
2. **[Integration Walkthrough](/developer-guide/langchain/integration-walkthrough)** — Wire and verify an existing LangChain agent
3. **[Event Model](/developer-guide/langchain/event-model)** — Understand the events that trigger governance decisions
4. **[Approvals and Guardrails](/developer-guide/langchain/approvals-and-guardrails)** — Understand verdict and guardrail behavior
5. **[Troubleshooting](/developer-guide/langchain/troubleshooting)** — Diagnose common integration issues
