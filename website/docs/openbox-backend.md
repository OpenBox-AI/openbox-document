---
title: OpenBox Backend
sidebar_position: 4
---

Backend API built with NestJS for running OpenBox services.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Services and ports

| Service | Port | Notes |
|---------|------|-------|
| `openbox-backend` | `3000` | Backend API |
| `openbox-postgres` | `5432` | PostgreSQL for backend data |
| `openbox-redis` | `6379` | Redis cache |

## Environment variables

Create a `.env` file with the variables below before running the backend:

```dotenv
NODE_ENV=development
PORT=3000

AUTH0_DOMAIN=yourdomain.com
AUTH0_CLIENT_ID=
AUTH0_AUDIENCE=
AUTH0_NAMESPACE=https://yourdomain.com
AUTH0_CONNECTION_ID=
AUTH0_MGMT_CLIENT_ID=
AUTH0_MGMT_CLIENT_SECRET=
AUTH0_MGMT_AUDIENCE=https://yourdomain.com/api/v2/

SUPABASE_DB_URI=postgresql://

KMS_ACCESS_KEY_ID=
KMS_SECRET_ACCESS_KEY=
KMS_REGION=
KMS_ROLE_ARN=

S3_BUCKET_NAME=
S3_REGION=

REDIS_URL=

GUARDRAIL_API_URL=https://example.com/api/v1
```

### Docker Deployment

Prerequisite: Docker installed.

Create the network (if not exist):
```bash
docker network create openbox
```


Deploy a Postgres DB with a volume:
```bash
docker volume create openbox-postgres-data
docker run --name openbox-postgres --network openbox -p 5432:5432 \
  -e POSTGRES_DB=openbox \
  -e POSTGRES_USER=openbox \
  -e POSTGRES_PASSWORD=openbox \
  -v openbox-postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

Deploy a Redis instance:
```bash
docker run --name openbox-redis --network openbox -p 6379:6379 redis:7-alpine
```

Update SUPABASE_DB_URI & REDIS_URL in .env with postgresDB credentials

Run the container (map port 3000):
```bash
docker run --name openbox-backend -p 3000:3000 --env-file .env -e NODE_ENV=production openbox-backend:<tag>
```

Run the container in the `openbox` network:
```bash
docker run --name openbox-backend --network openbox -p 3000:3000 --env-file .env -e NODE_ENV=production openbox-backend:<tag>
```

Optional OPA configuration (override if needed):
```bash
docker run --name openbox-backend -p 3000:3000 \
  -e OPA_BINARY_PATH=/usr/local/bin/opa \
  -e OPA_TEMP_DIR=/tmp/opa-eval \
  -e OPA_TIMEOUT=30000 \
  openbox-backend:<tag>
```

View logs / stop / remove the container:
```bash
docker logs -f openbox-backend
docker stop openbox-backend
docker rm openbox-backend
```
