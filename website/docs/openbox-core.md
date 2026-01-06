---
sidebar_position: 3
---

# OpenBox Core

A Go-based backend API service for AI agent governance, identity management, and compliance tracking.

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

Example `.env`:

```dotenv
MODE=debug
ORIGINS=*

DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=your_database
REDIS_URL=redis://localhost:6379
TEMPORAL_HOST=localhost:7233
WORKFLOW_ID_PREFIX=gov
KMS_AUTH_MODE=webidentity

# Governance Worker
GOVERNANCE_TASK_QUEUE=governance-task-queue
GOVERNANCE_WORKFLOW_TYPE=GovernanceEventWorkflow

# Attestation Worker
ATTESTATION_TASK_QUEUE=attestation-task-queue
ATTESTATION_WORKFLOW_TYPE=AttestationWorkflow

# Observability Worker
OBSERVABILITY_TASK_QUEUE=observability-task-queue
OBSERVABILITY_WORKFLOW_TYPE=ObservabilityWorkflow

# OPA Configuration
OPA_URL=http://localhost:8181
GUARDRAIL_URL=http://localhost:8182
# OPA_TOKEN=optional-bearer-token

# AWS KMS Configuration - ECC NIST P-256 key for signing
# In production, use IAM roles attached to EC2/ECS/EKS instead
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
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

Docker Compose (core services + redis):

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  openbox-server:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["server", "--addr", "0.0.0.0:8086"]
    ports:
      - "8086:8086"
    env_file:
      - .env
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

  governance-worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["governance-worker"]
    env_file:
      - .env
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

  attestation-worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["attestation-worker"]
    env_file:
      - .env
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

  observability-worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["observability-worker"]
    env_file:
      - .env
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy

volumes:
  redis_data:
```

Services and ports:

| Service | Port | Notes |
|---------|------|-------|
| `openbox-server` | `8086` | HTTP API |
| `redis` | `6379` | Redis cache |
| `governance-worker` | N/A | Worker process (no exposed port) |
| `attestation-worker` | N/A | Worker process (no exposed port) |
| `observability-worker` | N/A | Worker process (no exposed port) |

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