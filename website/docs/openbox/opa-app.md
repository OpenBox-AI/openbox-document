---
title: OPA App
sidebar_position: 6
---

### Docker Deployment

This guide runs OPA and the FastAPI app on a user-defined Docker network named `openbox`.

## Services and ports

| Service | Port | Notes |
|---------|------|-------|
| `opa` | `8181` | OPA API server |

## Prereqs
- Docker Desktop/Engine
- This repo checked out locally
- AWS credentials available in `~/.aws` (or update `config.yaml` to use environment credentials)

## 1) Create the Docker network
```bash
docker network create openbox
```

## config.yaml

Use the following `config.yaml` to point OPA at the OpenBox policy bundle in S3:

```yaml
server2:
  address: :::8181

services:
  - name: openbox-bundle
    url: https://opa-policies-krnl.s3.ap-southeast-1.amazonaws.com
    credentials:
      s3_signing:
        profile_credentials:
          profile: "krnl"
        # environment_credentials: {}

bundles:
  openbox:
    service: openbox-bundle
    resource: bundle.tar.gz
    polling:
      min_delay_seconds: 10
      max_delay_seconds: 20

decision_logs:
  console: true
  traces: true
```

## 2) Start OPA (config.yaml + S3 bundles)
OPA pulls bundles from S3 based on `config.yaml`.
```bash
docker run --name opa --network openbox -p 8181:8181 \
  -v "$PWD/config.yaml:/config/config.yaml" \
  -v "$HOME/.aws:/root/.aws:ro" \
  -e AWS_PROFILE=krnl \
  openpolicyagent/opa:latest run --server --config-file=/config/config.yaml
```
