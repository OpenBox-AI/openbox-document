---
title: OpenBox FE
sidebar_position: 8
---

# OpenBox FE

Next.js frontend for OpenBox.

## Environment setup

Create `.env` from `.env.example` and fill in the values.

```
NEXT_PUBLIC_API_URL=http://openbox-api.node.lat

APP_BASE_URL='http://openbox-fe-stag.vercel.app'

# NextAuth
NEXTAUTH_URL=http://localhost:3233
NEXTAUTH_SECRET=

# Keycloak
KEYCLOAK_CLIENT_ID=
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ISSUER=

# The base URL of your Keycloak instance (e.g., https://identity.node.lat)
KEYCLOAK_BASE_URL=

# Credentials for the Keycloak Admin API (used to validate realms)
# This should be a client in the 'master' realm with 'realm-admin' permissions.
KEYCLOAK_ADMIN_CLIENT_ID=
KEYCLOAK_ADMIN_CLIENT_SECRET=

```

## Docker deploy

Create the network (if not exist):
```bash
docker network create openbox
```

```bash
docker build -t openbox-fe .
docker run -p 3233:3233 openbox-fe 
```

Open `http://localhost:3233` to view the app.
