---
sidebar_position: 5
---

# OpenBox Guardrails

OpenBox Guardrails is a robust API service designed to evaluate and enforce safety and content moderation for AI agents. It provides a set of guardrails to ensure AI-generated content adheres to safety guidelines and content policies.

## Services and ports

| Service | Port | Notes |
|---------|------|-------|
| `openbox-guardrails` | `8000` | Guardrails API |
| `openbox-postgres` | `5432` | PostgreSQL for guardrails data |

### Docker Deployment

Build and run using Docker:

```bash
docker build --build-arg GUARDRAILS_TOKEN=$GUARDRAILS_TOKEN -t guardrails-openbox .
docker run -p 8000:8000 guardrails-openbox
```

### Docker + Postgres (openbox network)

1. Create the network (if not exist):
   ```bash
   docker network create openbox
   ```

2. Deploy Postgres with a named volume:
   ```bash
   docker volume create openbox-postgres-data
   docker run --name openbox-postgres --network openbox -p 5432:5432 \
     -e POSTGRES_DB=openbox \
     -e POSTGRES_USER=openbox \
     -e POSTGRES_PASSWORD=openbox \
     -v openbox-postgres-data:/var/lib/postgresql/data \
     postgres:16-alpine
   ```

3. Build the API image:

   Update the .env with postgres credentials

   ```bash
   docker build --build-arg GUARDRAILS_TOKEN=$GUARDRAILS_TOKEN -t guardrails-openbox .
   ```

4. Run the API container:
   ```bash
   docker run --name openbox-guardrails --network openbox -p 8000:8000 \
     -e DB_HOST=openbox-postgres \
     -e DB_PORT=5432 \
     -e DB_USER=openbox \
     -e DB_PASSWORD=openbox \
     -e DB_NAME=openbox \
     guardrails-openbox
   ```
