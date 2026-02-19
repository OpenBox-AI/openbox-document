---
title: Event Types
description: The 21 semantic event types for agent operations
sidebar_position: 3
---

# Event Types

OpenBox classifies agent operations into 21 semantic event types. These types enable precise policy writing and meaningful analytics.

## Event Categories

### LLM Operations

| Type | Description | Risk Level |
|------|-------------|------------|
| `LLM_CALL` | Call to language model for completion/chat | Medium |
| `LLM_EMBEDDING` | Generate embeddings from text | Low |

### Data Operations

| Type | Description | Risk Level |
|------|-------------|------------|
| `DATABASE_READ` | Read from database | Low-Medium |
| `DATABASE_WRITE` | Write/update/delete database records | Medium-High |
| `FILE_READ` | Read from filesystem | Low-Medium |
| `FILE_WRITE` | Write to filesystem | Medium-High |
| `CACHE_READ` | Read from cache layer | Low |
| `CACHE_WRITE` | Write to cache layer | Low |

### External Operations

| Type | Description | Risk Level |
|------|-------------|------------|
| `EXTERNAL_API_CALL` | Call to external API | Medium-High |
| `WEBHOOK_SEND` | Send webhook to external system | Medium-High |
| `EMAIL_SEND` | Send email | Medium |

### Messaging Operations

| Type | Description | Risk Level |
|------|-------------|------------|
| `MESSAGE_QUEUE_SEND` | Publish to message queue | Medium |
| `MESSAGE_QUEUE_RECEIVE` | Consume from message queue | Low |

### Authentication Operations

| Type | Description | Risk Level |
|------|-------------|------------|
| `AUTH_REQUEST` | Request authentication/authorization | Low |
| `AUTH_GRANT` | Authentication granted | Low |
| `AUTH_DENY` | Authentication denied | Low |

### Workflow Operations

| Type | Description | Risk Level |
|------|-------------|------------|
| `WORKFLOW_START` | Workflow execution begins | Low |
| `WORKFLOW_COMPLETE` | Workflow execution ends | Low |
| `ACTIVITY_START` | Activity execution begins | Low |
| `ACTIVITY_COMPLETE` | Activity execution ends | Low |

### Agent Operations

| Type | Description | Risk Level |
|------|-------------|------------|
| `AGENT_GOAL_SET` | Agent goal defined | Low |
| `AGENT_GOAL_UPDATE` | Agent goal modified | Medium |
| `AGENT_DECISION` | Agent makes autonomous decision | Medium |
| `AGENT_ACTION` | Agent takes action | Variable |

## Using Event Types

### In Policies

Reference event types in OPA policies:

```rego
package openbox

default result := {"decision": "CONTINUE", "reason": ""}

# Allow all read operations
result := {"decision": "CONTINUE", "reason": "Database read allowed"} if {
    input.operation.type == "DATABASE_READ"
}

# Require approval for external calls
result := {"decision": "REQUIRE_APPROVAL", "reason": "External API calls require review"} if {
    input.operation.type == "EXTERNAL_API_CALL"
}

# Block file writes for low-trust agents
result := {"decision": "BLOCK", "reason": "File writes blocked for lower-tier agents"} if {
    input.operation.type == "FILE_WRITE"
    input.agent.trust_tier >= 3
}
```

### In Behavioral Rules

Detect patterns across event types:

```yaml
rule:
  name: "PII Exfiltration Pattern"
  trigger:
    type: DATABASE_READ
    target: "*.pii_*"
  condition:
    within: 60s
    followed_by:
      - type: EXTERNAL_API_CALL
      - type: WEBHOOK_SEND
      - type: EMAIL_SEND
  action: REQUIRE_APPROVAL
```

### In Monitoring

Filter sessions by event type:

- View all `EXTERNAL_API_CALL` events
- Track `DATABASE_WRITE` frequency
- Alert on `AUTH_DENY` spikes

## Event Metadata

Each event includes:

```json
{
  "event_id": "evt_abc123",
  "type": "DATABASE_WRITE",
  "timestamp": "2024-01-15T09:14:32.001Z",
  "session_id": "ses_xyz789",
  "agent_id": "agt_def456",

  "target": "customers.update",
  "parameters": {
    "table": "customers",
    "operation": "update",
    "record_count": 1
  },

  "governance": {
    "decision": "ALLOW",
    "policies_evaluated": ["default", "customer-data"],
    "trust_score_at_time": 87
  },

  "telemetry": {
    "duration_ms": 45,
    "trace_id": "abc123def456"
  }
}
```

## Custom Event Types

For operations not covered by the 21 standard types, use `AGENT_ACTION` with custom metadata:

```python
# In your activity
openbox.emit_event(
    type="AGENT_ACTION",
    metadata={
        "custom_type": "payment_processing",
        "amount": 99.99,
        "currency": "USD"
    }
)
```

Then reference in policies:

```rego
default result := {"decision": "CONTINUE", "reason": ""}

result := {"decision": "REQUIRE_APPROVAL", "reason": "High-value payment processing requires approval"} if {
    input.operation.type == "AGENT_ACTION"
    input.operation.metadata.custom_type == "payment_processing"
    object.get(input.operation.metadata, "amount", 0) > 100
}
```

## Related

- **[Governance Decisions](/docs/concepts/governance-decisions)** - What decisions can be made for each event
- **[Authorize Phase](/docs/agents/trust-lifecycle/authorize)** - Write policies that reference event types
- **[Monitor Phase](/docs/agents/trust-lifecycle/monitor)** - See events in [Session Replay](/docs/agents/trust-lifecycle/session-replay)
