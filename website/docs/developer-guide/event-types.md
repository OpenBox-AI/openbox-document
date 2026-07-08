---
title: Event Types
description: "Track every operation your AI agents make: 21 semantic operation types for governance decisions, policy checks, and analytics."
llms_description: Reference for all emitted event types
sidebar_position: 6
tags:
  - reference
  - policy-authoring
  - observability
---

# Event Types

OpenBox classifies every agent operation into one of **21 semantic operation types**, grouped as HTTP (6), LLM (4), DB (5), File (4), and Other (2). The platform derives them from raw SDK telemetry (OpenTelemetry spans) for observability and analytics. Governance policies can also gate on them: each operation's `semantic_type` is carried on the activity's telemetry spans, so a Rego rule can match specific operations via `input.spans[_].semantic_type` (see [Policies](/trust-lifecycle/authorize/policies)). The types here describe *what* an operation did.

## Operation Categories

### HTTP
| Type | Description |
|------|-------------|
| `http_get` | HTTP GET request |
| `http_post` | HTTP POST request |
| `http_put` | HTTP PUT request |
| `http_patch` | HTTP PATCH request |
| `http_delete` | HTTP DELETE request |
| `http` | Generic/unclassified HTTP request |

### LLM
| Type | Description |
|------|-------------|
| `llm_completion` | Completion / chat call to a language model |
| `llm_embedding` | Generate embeddings from text |
| `llm_tool_call` | Model-invoked tool/function call |
| `llm_gen_ai` | Generative-AI operation (OTel `gen_ai.*`) |

### Database
| Type | Description |
|------|-------------|
| `database_select` | Read rows (SELECT) |
| `database_insert` | Insert rows |
| `database_update` | Update rows |
| `database_delete` | Delete rows |
| `database_query` | Other/unclassified query |

### File
| Type | Description |
|------|-------------|
| `file_read` | Read from filesystem |
| `file_write` | Write to filesystem |
| `file_open` | Open a file handle |
| `file_delete` | Delete a file |

### Other
| Type | Description |
|------|-------------|
| `mcp_tool_call` | Model Context Protocol client tool call |
| `internal` | Fallback for spans with no specific classification |

## Using Event Types

### In Policies

Policies gate on the agent's risk tier and match an operation's semantic type via its telemetry spans:

```rego
package openbox

import future.keywords.if
import future.keywords.in

default result := {"decision": "ALLOW", "reason": ""}

# Require approval for database writes by Tier 2+ agents
result := {"decision": "REQUIRE_APPROVAL", "reason": "Database writes require review"} if {
    input.risk_tier >= 2
    some span in input.spans
    span.semantic_type in {"database_insert", "database_update", "database_delete"}
}

# Block destructive file operations for the lowest-trust tier
result := {"decision": "BLOCK", "reason": "Destructive file operations blocked for Tier 4"} if {
    input.risk_tier == 4
    some span in input.spans
    span.semantic_type == "file_delete"
}
```

### In Monitoring

Filter sessions by event type:

- View all `http_post` events
- Track `database_update` frequency
- Alert on `file_delete` spikes

## Event Metadata

Each event includes:

```json
{
  "event_id": "evt_abc123",
  "type": "database_update",
  "timestamp": "2026-02-26T09:14:32.001Z",
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

## Related

- **[Troubleshooting](/developer-guide/temporal-python/troubleshooting)** - Common issues and solutions when integrating
- **[Governance Decisions](/core-concepts/governance-decisions)** - What decisions can be made for each event
- **[Authorize Phase](/trust-lifecycle/authorize)** - Write policies that reference event types
