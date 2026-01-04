---
sidebar_position: 3
---

# OpenBox Core

A Go-based backend API service for AI agent governance, identity management, and compliance tracking.

## Overview

OpenBox Core provides infrastructure for managing AI agents with secure token-based authentication, request logging, and governance evaluation. It serves as the core API layer for the OpenBox platform, orchestrating governance workflows via Temporal.

## Features

- **Agent Identity Management**: Register and manage AI agents with unique tokens
- **Token-Based Authentication**: Secure API keys with `obx_live_*` and `obx_test_*` prefixes
- **Workflow Telemetry**: Track workflow/activity lifecycle events with OTel span data
- **Governance Workflow**: Temporal-based workflow orchestration for governance evaluation
  - **Policy Evaluation**: Evaluate events against governance policies (OPA-based)
  - **Guardrails**: Real-time validation and redaction of activity inputs/outputs
  - **Merkle Tree Attestation**: 2-level merkle tree (spans → events → session) with KMS signing
  - **Event Storage**: Persist governance events with verdicts
- **Observability Workflow**: Asynchronous metrics collection and aggregation (fire-and-forget)
  - **Invocation Metrics**: Workflow counts, API response times
  - **Token Metrics**: Input/output token consumption extracted from spans
  - **Error Metrics**: Policy blocks, guardrail blocks, rate limits, timeouts, server errors
  - **Tool Metrics**: Tool call counts and success/failure rates per tool
  - **Model Usage**: Per-model token consumption with provider tracking (OpenAI, Anthropic, Google)
  - **Latency Buckets**: API response time distribution histograms
  - **Cost Calculation**: Token-based cost estimation using model pricing tables (calculated at query time)
- **Caching Layer**: Redis-backed caching with 24-hour TTL for agent validation

### Supported Event Types

| Event Type | Description |
|------------|-------------|
| `WorkflowStarted` | Workflow execution begins |
| `WorkflowCompleted` | Workflow finishes successfully (includes all buffered spans) |
| `WorkflowFailed` | Workflow execution failed (includes error details) |
| `SignalReceived` | External signal received by workflow |
| `ActivityStarted` | Activity execution begins |
| `ActivityCompleted` | Activity finishes (includes span data) |

## Tech Stack

- **Language**: Go 1.24
- **Web Framework**: [Echo](https://echo.labstack.com/) v4
- **Workflow Engine**: [Temporal](https://temporal.io/) for durable workflow orchestration
- **Database**: PostgreSQL (via [pgx](https://github.com/jackc/pgx) v5)
- **Cache**: Redis (via [go-redis](https://github.com/redis/go-redis) v9)
- **ORM**: [Bob](https://github.com/stephenafamo/bob) (SQL query builder)
- **DI Container**: [samber/do](https://github.com/samber/do) v2
- **Validation**: [go-playground/validator](https://github.com/go-playground/validator) v10
- **KMS**: AWS KMS with ECC NIST P-256 for cryptographic attestation signing

## Project Structure

```
openbox-core/
├── cmd/
│   └── core/                    # Application entry point (server, governance-worker, attestation-worker)
├── internal/
│   ├── api/                     # HTTP handlers and routing
│   ├── bob/                     # Generated database models (Bob ORM)
│   ├── container/               # Dependency injection setup
│   ├── content/                 # Domain types and contracts
│   ├── datastore/               # Database access layer
│   └── services/
│       ├── agent.go             # Agent validation service
│       ├── governance.go        # Governance service (workflow orchestration)
│       ├── governance_workflow.go   # GovernanceEventWorkflow + activities
│       ├── attestation_workflow.go  # AttestationWorkflow + activities
│       ├── observability_workflow.go # ObservabilityWorkflow + metrics activities
│       ├── guardrail.go         # Guardrail client for input/output validation
│       ├── kms.go               # KMS signer implementation
│       └── opa.go               # OPA client for policy evaluation
└── pkg/
    ├── caching/                 # Redis caching utilities
    ├── db/                      # Database connection helpers
    ├── env/                     # Environment variable helpers
    ├── errorx/                  # Error handling utilities
    ├── httpx/                   # HTTP response helpers
    └── merkle/                  # Merkle tree implementation (OpenZeppelin compatible)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/api/v1/auth/validate` | Validate agent token |
| `POST` | `/api/v1/agent/validate` | Validate agent request (authenticated) |
| `POST` | `/api/v1/governance/evaluate` | Log request and evaluate governance (authenticated) |

### Authentication

Endpoints marked as "authenticated" require a Bearer token in the Authorization header:

```
Authorization: Bearer obx_live_<your_token>
```

Token formats:
- `obx_live_*` - Production environment
- `obx_test_*` - Test environment

## Getting Started

### Prerequisites

- Go 1.24+
- PostgreSQL
- Redis
- Temporal Server

### Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `MODE` | Application mode (`debug` or `release`) |
| `ORIGINS` | Comma-separated list of allowed CORS origins |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_DATABASE` | PostgreSQL database name |
| `REDIS_URL` | Redis connection URL |
| `TEMPORAL_HOST` | Temporal server address (e.g., `localhost:7233`) |
| `WORKFLOW_ID_PREFIX` | Prefix for governance workflow IDs (default: `gov`) |
| `OPA_URL` | OPA server URL (default: `http://localhost:8181`) |
| `OPA_TOKEN` | Optional Bearer token for OPA authentication |
| `AWS_ACCESS_KEY_ID` | AWS access key for KMS signing (credentials mode) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for KMS signing (credentials mode) |
| `AWS_ROLE_ARN` | IAM role ARN for KMS operations (optional for credentials, required for webidentity) |
| `KMS_AUTH_MODE` | KMS authentication mode: `credentials` (default) or `webidentity` |
| `AWS_WEB_IDENTITY_TOKEN_FILE` | Path to OIDC token file (required for webidentity mode) |
| `OBSERVABILITY_TASK_QUEUE` | Temporal task queue for observability workflows |
| `OBSERVABILITY_WORKFLOW_TYPE` | Workflow type name for observability (e.g., `ObservabilityWorkflow`) |

### Running the Application

The application consists of four separate processes that should be run together:

```bash
# Install dependencies
go mod download

# 1. Start the HTTP API server
go run cmd/core/main.go server
# Or with custom address:
go run cmd/core/main.go server --addr 0.0.0.0:8080

# 2. Start the Governance Worker (processes governance workflows)
go run cmd/core/main.go governance-worker
# Or with custom options:
go run cmd/core/main.go governance-worker --temporal-host localhost:7233 --task-queue governance-task-queue

# 3. Start the Attestation Worker (processes attestation workflows)
go run cmd/core/main.go attestation-worker
# Or with custom options:
go run cmd/core/main.go attestation-worker --temporal-host localhost:7233 --task-queue attestation-task-queue

# 4. Start the Observability Worker (processes metrics collection)
go run cmd/core/main.go observability-worker
# Or with custom options:
go run cmd/core/main.go observability-worker --temporal-host localhost:7233 --task-queue observability-task-queue
```

| Process | Default Port/Queue | Description |
|---------|-------------------|-------------|
| `server` | `0.0.0.0:8086` | HTTP API server |
| `governance-worker` | `governance-task-queue` | Temporal worker for governance workflows |
| `attestation-worker` | `attestation-task-queue` | Temporal worker for attestation workflows |
| `observability-worker` | `observability-task-queue` | Temporal worker for metrics collection |

### Docker Deployment

This repo ships with a `Dockerfile` and `docker-compose.yml` for running the core services in containers.

Prerequisites:
- Docker Engine + Docker Compose v2
- PostgreSQL, Temporal, and OPA (run externally or extend the compose file)

Steps:

```bash
# 1) Configure environment
cp .env.example .env

# 2) Build and start services (server + workers + redis)
docker compose up -d --build

# 3) Verify the API
curl http://localhost:8086/
```

Notes:
- The compose file starts `openbox-server`, `governance-worker`, `attestation-worker`, and `redis`.
- If you need `observability-worker`, add another service with `command: ["observability-worker"]` or run it as a separate container.
- Update `.env` to point at your external dependencies, e.g. `DB_HOST`, `TEMPORAL_HOST`, and `OPA_URL`.

To stop:

```bash
docker compose down
```

### Database Setup

This project uses [Bob](https://bob.stephenafamo.com/) for database models. To regenerate models after schema changes:

```bash
bobgen-psql
```

## Architecture

### Split Worker Architecture

The system uses a **split worker architecture** with two independent Temporal workflows running on separate task queues. This design decouples governance evaluation from attestation processing, enabling:
- **Fast verdict delivery**: Governance verdicts return immediately without waiting for KMS signing
- **Independent scaling**: Workers can be scaled independently based on load
- **Fault isolation**: Attestation failures don't block governance processing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OpenBox Core                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────────────┐    ┌─────────────────────┐    │
│   │   server    │    │  governance-worker  │    │ attestation-worker  │    │
│   │  (HTTP API) │    │   (Task Queue: gov) │    │ (Task Queue: attest)│    │
│   └──────┬──────┘    └──────────┬──────────┘    └──────────┬──────────┘    │
│          │                      │                          │               │
│          │  Start Workflow      │                          │               │
│          │─────────────────────►│                          │               │
│          │                      │                          │               │
│          │                      │  Trigger Async           │               │
│          │                      │─────────────────────────►│               │
│          │                      │                          │               │
│          │◄─────────────────────│                          │               │
│          │  Return Verdict      │                          │               │
│          │  (non-blocking)      │     ┌────────────────────┤               │
│          │                      │     │ Process Attestation│               │
│          │                      │     │ (independent)      │               │
│          │                      │     └────────────────────┤               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Governance Event Workflow

The governance evaluation is orchestrated via a Temporal workflow (`GovernanceEventWorkflow`) that processes workflow telemetry events and triggers attestation asynchronously:

```
┌──────────────────────────────────────┐
│         SDK Telemetry Event          │
│  (WorkflowStarted/Completed/Signal)  │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│    POST /api/v1/governance/evaluate  │
│         GovernanceEventPayload       │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│      GovernanceEventWorkflow         │
│    (governance-task-queue)           │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│        ValidateAgentActivity         │
│    Verify API key, retrieve agent    │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│      PolicyEvaluationActivity        │
│         (OPA-based)                  │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│      GuardrailsCheckActivity         │
│   Validate inputs/outputs            │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│      StoreGovernanceEvent            │
│   Persist event with verdict         │
└─────────────────┬────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────────────────┐
│ Return Verdict│   │ StartAttestationWorkflow │
│ (immediate)   │   │ Activity (fire-and-forget)│
└───────────────┘   └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │   AttestationWorkflow    │
                    │ (attestation-task-queue) │
                    │    (runs independently)  │
                    └──────────────────────────┘
```

### Request Payload

```json
{
  "source": "workflow-telemetry",
  "event_type": "WorkflowCompleted",
  "workflow_id": "order-processing-123",
  "run_id": "abc-def-ghi",
  "workflow_type": "OrderWorkflow",
  "task_queue": "order-queue",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "completed",
  "duration_ms": 1500.5,
  "span_count": 5,
  "spans": [...]
}
```

### Response

```json
{
  "action": "continue",
  "risk_score": 0.0,
  "policy_id": null,
  "reason": null,
  "metadata": {
    "event_type": "WorkflowCompleted",
    "workflow_id": "order-processing-123",
    "attestation": "verified"
  }
}
```

**Governance Worker Activities** (`governance-task-queue`):
- `ValidateAgentActivity`: Validates API key format (SHA-256 hashed) and retrieves agent from database
- `SessionLifecycleActivity`: Creates/updates sessions based on workflow lifecycle events
- `PolicyEvaluationActivity`: Evaluates event against OPA governance policies
- `GuardrailsCheckActivity`: Validates and redacts activity inputs/outputs via external guardrail service
- `StoreGovernanceEvent`: Persists the event with governance verdict
- `StorePolicyEvaluationActivity`: Persists policy evaluation input/output for audit trail
- `StoreGuardrailsEvaluationActivity`: Persists guardrails evaluation results for audit trail
- `StartAttestationWorkflowActivity`: Triggers independent attestation workflow (fire-and-forget)

**Attestation Worker Activities** (`attestation-task-queue`):
- `GetSessionActivity`: Finds session by workflow_id + run_id, returns event index
- `BuildEventMerkleNodeActivity`: Builds span tree, computes event hash, stores merkle node
- `FinalizeSessionActivity`: Builds session tree from all events (on terminal events)
- `SignSessionRootActivity`: Signs session root with KMS, stores attestation

**Observability Worker Activities** (`observability-task-queue`):
- `UpdateInvocationMetricsActivity`: Tracks workflow counts and API response times
- `UpdateTokenMetricsActivity`: Extracts and aggregates input/output token counts from spans
- `UpdateErrorMetricsActivity`: Tracks policy blocks, guardrail blocks, rate limits, timeouts
- `UpdateToolMetricsActivity`: Tracks tool call counts and success/failure rates
- `UpdateModelUsageActivity`: Tracks per-model token consumption with provider detection
- `UpdateLatencyMetricsActivity`: Buckets API response times into histogram ranges

### Observability Workflow Architecture

The observability workflow runs asynchronously (fire-and-forget) after each governance evaluation, collecting metrics into time-bucketed aggregates:

```
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/v1/governance/evaluate                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              GovernanceEventWorkflow completes                    │
│              Returns verdict with internal fields                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌───────────────────────┐    ┌───────────────────────────────────┐
│   Return API Response │    │   Start ObservabilityWorkflow     │
│   (immediate)         │    │   (fire-and-forget goroutine)     │
└───────────────────────┘    └──────────────┬────────────────────┘
                                            │
                                            ▼
                             ┌───────────────────────────────────┐
                             │      ObservabilityWorkflow        │
                             │   (observability-task-queue)      │
                             └──────────────┬────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
          ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
          │   Invocation    │    │     Token       │    │     Error       │
          │   Metrics       │    │    Metrics      │    │    Metrics      │
          └─────────────────┘    └─────────────────┘    └─────────────────┘
                    │                       │                       │
                    ▼                       ▼                       ▼
          ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
          │      Tool       │    │     Model       │    │    Latency      │
          │    Metrics      │    │     Usage       │    │    Buckets      │
          └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Metrics Storage:**
- Metrics are stored in `observability_metrics` table with hourly time buckets
- Uses atomic upsert (INSERT ... ON CONFLICT DO UPDATE) for concurrent aggregation
- Each metric has: `agent_id`, `bucket_time`, `metric_type`, `metric_key`, `metric_value`

**Metric Types:**

| Type | Keys | Description |
|------|------|-------------|
| `invocation` | `workflow_count`, `api_response_sum_ms`, `api_response_count` | Request counts and timing |
| `token` | `input_tokens`, `output_tokens` | Token consumption |
| `error` | `policy_block`, `guardrail_block`, `rate_limit`, `timeout`, `server_error` | Error tracking |
| `tool` | `{tool_name}.call_count`, `{tool_name}.success_count`, `{tool_name}.failure_count` | Per-tool metrics |
| `model` | `{model}:{provider}.input_tokens`, `{model}:{provider}.output_tokens` | Per-model usage |
| `latency` | `bucket_0_500`, `bucket_500_1000`, `bucket_1000_2000`, `bucket_2000_5000`, `bucket_5000_plus` | Response time distribution |

**Cost Calculation:**
- Costs are calculated at query time using `content.CalculateTokenCost()`
- Model pricing table in `internal/content/const.go` with per-million-token rates
- Supports OpenAI (gpt-4o, o1, etc.), Anthropic (claude-3, claude-4), and Google (gemini) models

### OPA Policy Evaluation Architecture

Policy evaluation uses [Open Policy Agent (OPA)](https://www.openpolicyagent.org/) for flexible, declarative governance rules.

```
┌─────────────────────────────────────────────────────────────┐
│                  PolicyEvaluationActivity                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Check event_type                                         │
│     Workflow events → bypass OPA, return "continue"         │
│     (WorkflowStarted/Completed/Failed skip OPA for latency) │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Get Policy by Agent ID                                   │
│     If no policy found → bypass check, return "continue"    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Query OPA: POST /v1/data/org/openbox/governance/result  │
│     Input: GovernanceEventPayload                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Governance Policy Routes by event_type:                  │
│     • SignalReceived    → signal_policy                     │
│     • ActivityStarted   → activity_policy                   │
│     • ActivityCompleted → activity_policy                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Store & Return PolicyEvaluationResult                    │
│     {action: "continue"|"stop", reason, risk_score}         │
│     Persists input (payload) and output (result) for audit  │
└─────────────────────────────────────────────────────────────┘
```

**Policy Structure (Rego):**

```
bundle/
├── governance.rego              # Main router (org.openbox.governance)
└── policies/
    ├── signal_policy.rego       # Signal event rules (bad word filtering)
    └── activity_policy.rego     # Activity event rules (auto-allow)
```

**Example Signal Policy:**
```rego
package org.openbox.policies.signal_policy

bad_words := {"war", "hack"}

# Deny if signal_name or signal_args contain bad words
has_bad_word_in_args if {
    some arg in input.signal_args
    some word in bad_words
    contains(lower(arg), word)
}

default allow := false
allow if {
    not has_bad_word_in_name
    not has_bad_word_in_args
}
```

**Key Features:**
- **Per-Agent Policies**: Each agent can have its own policy configuration
- **Policy Bypass**: Agents without policies automatically pass evaluation
- **Workflow Bypass**: Workflow events skip OPA entirely for reduced latency
- **Event Routing**: Different policies for signals vs activities
- **Detailed Reasons**: Policy violations include human-readable reasons
- **Audit Trail**: Input/output of each policy evaluation is persisted

### Guardrails Architecture

Guardrails provide real-time validation and redaction of activity inputs/outputs. The system integrates with an external Guardrail service to validate data before it's processed.

```
┌─────────────────────────────────────────────────────────────────┐
│                  GuardrailsCheckActivity                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Event Type Filter                                            │
│     • ActivityStarted  → Check input                             │
│     • ActivityCompleted → Check output                           │
│     • Other events     → Bypass (return nil)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Build Guardrail Request                                      │
│     {                                                            │
│       "token": "<agent_token>",                                  │
│       "logs": {                                                  │
│         "activity_type": "agent_toolPlanner",                    │
│         "signal_name": null,                                     │
│         "input": <activity_input_json>,  // ActivityStarted      │
│         "output": <activity_output_json> // ActivityCompleted    │
│       }                                                          │
│     }                                                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. POST /api/v1/guardrails/evaluate                             │
│     → External Guardrail Service                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Process Response                                             │
│     {                                                            │
│       "validated_logs": {                                        │
│         "input": <redacted_input>,                               │
│         "output": <redacted_output>                              │
│       },                                                         │
│       "validation_passed": true/false,                           │
│       "reasons": ["PII detected", ...]                           │
│     }                                                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Return GuardrailsResponse                                    │
│     {                                                            │
│       "redacted_input": <validated_data>,                        │
│       "input_type": "activity_input" | "activity_output",        │
│       "raw_logs": <original_input>,                              │
│       "validation_passed": true/false,                           │
│       "reasons": [{"type": "...", "field": "...", "reason": "..."}]│
│     }                                                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. StoreGuardrailsEvaluationActivity                            │
│     • Persist evaluation to guardrails_evaluations table         │
│     • Store raw input, redacted output, pass/fail status         │
│     • Store validation reasons as JSON details                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Structure Preservation**: Input/output JSON structure is preserved (not extracted)
- **Per-Agent Validation**: Each agent can have custom guardrail configurations
- **Real-time Redaction**: Sensitive data is redacted before storage
- **SDK Integration**: Redacted data is returned to SDK for safe logging
- **Audit Trail**: Guardrails evaluations are persisted with pass/fail status and reasons

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `GUARDRAIL_URL` | Guardrail service URL (default: `http://localhost:8182`) |
| `GUARDRAIL_TOKEN` | Optional Bearer token for authentication |

### Merkle Tree Attestation Architecture

The attestation system uses a **2-level merkle tree** structure to create tamper-evident audit trails:

```
                    ┌─────────────────────┐
                    │   Session Root      │ ← KMS Signed (1 signature per session)
                    │   (merkle root)     │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │ Event Hash 1│     │ Event Hash 2│     │ Event Hash N│
    │ (event_0)   │     │ (event_1)   │     │ (event_n)   │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │ Span Root 1 │     │ Span Root 2 │     │ Span Root N │
    │ (spans)     │     │ (spans)     │     │ (spans)     │
    └─────────────┘     └─────────────┘     └─────────────┘
```

**Tree Levels:**
1. **Span Level**: Each event's spans are hashed into a `span_root`
2. **Event Level**: `event_hash = SHA256(metadata_json + span_root_hex)`
3. **Session Level**: All event hashes form the `session_root` (KMS signed)

### Attestation Workflow

The attestation workflow runs independently on its own task queue (`attestation-task-queue`), triggered asynchronously by the governance workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AttestationWorkflow                           │
│               (attestation-task-queue)                           │
│                                                                  │
│  Retry Policy: 3 attempts                                        │
│  Timeout: 30 seconds per activity                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: GetSessionActivity                                      │
│  • Find session by workflow_id + run_id                          │
│  • Get current event count for indexing                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: BuildEventMerkleNodeActivity                            │
│  • Build span tree from payload.Spans                            │
│  • Extract event metadata (event_type, workflow_id, etc.)        │
│  • Compute event_hash = SHA256(metadata_json + span_root_hex)    │
│  • Store span proofs and event merkle node                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Terminal Event? (WorkflowCompleted/WorkflowFailed)      │
└──────────────────────────┬──────────────────────────────────────┘
         No                │                Yes
          │                │                 │
          ▼                │                 ▼
    ┌───────────┐          │    ┌───────────────────────────────┐
    │  Done     │          │    │ FinalizeSessionActivity       │
    │  (merkle  │          │    │ • Fetch all event hashes      │
    │   node    │          │    │ • Build session merkle tree   │
    │  stored)  │          │    │ • Update event proofs         │
    └───────────┘          │    └──────────────┬────────────────┘
                           │                   │
                           │                   ▼
                           │    ┌───────────────────────────────┐
                           │    │ SignSessionRootActivity       │
                           │    │ • Get KMS key ARN by Agent ID │
                           │    │ • Sign session_root with KMS  │
                           │    │ • Store session attestation   │
                           │    └───────────────────────────────┘
```

**Key Features:**
- **Fire-and-forget**: Governance workflow doesn't wait for attestation completion
- **Incremental Building**: Merkle nodes built per-event, finalized on session end
- **Single KMS Signature**: Only the session root is signed (cost optimization)
- **OpenZeppelin Compatible**: Sorted sibling pairs for on-chain verification

### Session Lifecycle

Sessions track workflow executions and are managed by the governance workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                              │
└─────────────────────────────────────────────────────────────────┘

  WorkflowStarted          ActivityStarted/Completed        WorkflowCompleted
       │                           │                              │
       ▼                           ▼                              ▼
┌─────────────────┐        ┌─────────────────┐           ┌───────────────┐
│ Create          │        │ Build merkle    │           │ Finalize +    │
│ Session         │───────►│ nodes for each  │──────────►│ Sign session  │
│ (pending)       │        │ event           │           │ root          │
└─────────────────┘        └─────────────────┘           └───────────────┘
                                                                  │
                                                                  ▼
                                                         ┌───────────────┐
                                                         │ Session       │
                                                         │ (completed)   │
                                                         └───────────────┘
```

**Database Tables:**
- `sessions`: Tracks workflow executions (workflow_id, run_id, status)
- `governance_events`: Stores governance events with verdicts
- `policy_evaluations`: Stores policy evaluation input/output for audit
- `guardrails_evaluations`: Stores guardrails evaluation results (pass/fail, reasons)
- `event_merkle_nodes`: Stores per-event hashes and proofs
- `span_proofs`: Stores per-span proofs within events
- `session_attestations`: Stores signed session roots
- `agent_attestation_configs`: Stores per-agent external attestation provider configuration
- `observability_metrics`: Stores time-bucketed metrics aggregates per agent

### Attestation Provider Architecture

The system supports **multiple attestation providers** for signing session roots. Each agent can be configured to use either an external attestation service or AWS KMS (default fallback).

```
┌─────────────────────────────────────────────────────────────────┐
│                  SignSessionRootActivity                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Check agent_attestation_configs for Agent ID                 │
│     Look for external attestation_url + attestation_token        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │ External Config Found?  │
              └────────────┬────────────┘
         Yes               │              No
          │                │               │
          ▼                │               ▼
┌───────────────────┐      │    ┌───────────────────────────────┐
│ External KMS      │      │    │ AWS KMS (Fallback)            │
│ POST attestation_ │      │    │ 1. Get KMS Key ARN by Agent   │
│ url with Bearer   │      │    │ 2. Extract region from ARN    │
│ token             │      │    │ 3. AssumeRole (if configured) │
│                   │      │    │ 4. Sign with ECDSA_SHA_256    │
└─────────┬─────────┘      │    └──────────────┬────────────────┘
          │                │                   │
          └────────────────┴───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Store Session Attestation                                       │
│  {session_id, merkle_root, signature, event_count}               │
└─────────────────────────────────────────────────────────────────┘
```

#### External Attestation Provider

Agents can be configured to use an external KMS/signing service by storing credentials in the `agent_attestation_configs` table:

| Field | Description |
|-------|-------------|
| `agent_id` | Agent UUID |
| `attestation_url` | External signing service endpoint |
| `attestation_token` | Bearer token for authentication |

**External KMS API Contract:**

Request:
```http
POST <attestation_url>
Authorization: Bearer <attestation_token>
Content-Type: application/json

{
  "data": "<session_root_hex>"
}
```

Response:
```json
{
  "signature": "<signature_string>"
}
```

#### AWS KMS (Default Fallback)

If no external attestation config exists, the system falls back to AWS KMS:

1. **Get KMS Key ARN** from `agents` table by Agent ID
2. **Extract Region** from ARN (format: `arn:aws:kms:REGION:ACCOUNT:key/KEY_ID`)
3. **Authenticate** via credentials or Web Identity (OIDC)
4. **Sign** session root with ECDSA_SHA_256 (ECC NIST P-256)

**AWS Authentication Modes** (`KMS_AUTH_MODE` env var):
- `credentials` (default): Uses `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, then optionally `AssumeRole` with `AWS_ROLE_ARN`
- `webidentity`: Uses Web Identity (OIDC) via `AWS_ROLE_ARN` + `AWS_WEB_IDENTITY_TOKEN_FILE`

**Key Features:**
- **Provider Flexibility**: External attestation service or AWS KMS per agent
- **Per-Agent Configuration**: Each agent can have its own attestation provider
- **Automatic Fallback**: Seamlessly falls back to AWS KMS if no external config
- **Region-Aware**: AWS KMS region extracted from key ARN automatically
- **Cost Optimized**: One signing call per session (not per event)

**Database Tables:**
- `agents`: Stores `kms_key_arn` for AWS KMS fallback
- `agent_attestation_configs`: Stores external attestation URL + token per agent

### Token Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SDK Request with Bearer Token                               │
│  Authorization: Bearer obx_live_xxxxx                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Validate Format                                          │
│     Must start with obx_live_ or obx_test_                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Hash Token                                               │
│     SHA-256(token) → hashedToken                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Cache Lookup (24h TTL)                                   │
│     Key: agent:validation:{hashedToken}                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │ Cache Hit?              │
              └────────────┬────────────┘
         No ┌──────────────┴──────────────┐ Yes
            ▼                             ▼
┌───────────────────────┐    ┌───────────────────────┐
│  Query DB by          │    │  Return cached Agent  │
│  hashed token         │    │                       │
└───────────┬───────────┘    └───────────────────────┘
            │
            ▼
┌───────────────────────┐
│  Cache & Return Agent │
└───────────────────────┘
```

## Development

### Debug Mode

When `MODE=debug`, the server enables:
- Verbose logging
- [pprof](https://pkg.go.dev/net/http/pprof) profiling endpoints at `/debug/pprof/`

### Project Dependencies

Key dependencies are managed via `go.mod`. Notable packages:

- `github.com/labstack/echo/v4` - HTTP routing
- `github.com/jackc/pgx/v5` - PostgreSQL driver
- `github.com/redis/go-redis/v9` - Redis client
- `github.com/stephenafamo/bob` - SQL query builder
- `github.com/samber/do/v2` - Dependency injection
- `go.temporal.io/sdk` - Temporal workflow SDK
- `github.com/ory/ladon` - Policy-based access control

## License

Proprietary - All rights reserved.
