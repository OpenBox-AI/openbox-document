---
title: OPA App
sidebar_position: 6
---

## Docker Deploy Guide 

This guide runs OPA and the FastAPI app on a user-defined Docker network named `openbox`.

## Prereqs
- Docker Desktop/Engine
- This repo checked out locally
- AWS credentials available in `~/.aws` (or update `config.yaml` to use environment credentials)

## 1) Create the Docker network
```bash
docker network create openbox
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
