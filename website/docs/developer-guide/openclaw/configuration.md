---
title: Configuration
description: "Configure the OpenBox OpenClaw plugin: plugin config, environment variables, LLM gateway setup, and critical requirements."
llms_description: OpenClaw plugin configuration options and gateway setup
sidebar_position: 3
tags:
  - sdk
  - openclaw
  - reference
---

# Configuration

The OpenBox plugin is configured through the `openclaw.json` plugin block and environment variables.

## Plugin Configuration

The plugin config lives under `plugins.entries.openbox` in your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "openbox": {
        "enabled": true,
        "config": {
          "openboxUrl": "${OPENBOX_URL}",
          "openboxApiKey": "${OPENBOX_API_KEY}",
          "llmBaseUrl": "https://api.openai.com/v1",
          "llmApiKey": "${OPENAI_API_KEY}",
          "gatewayPort": 18919
        }
      }
    }
  }
}
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `openboxUrl` | string | Yes | — | OpenBox Core API URL |
| `openboxApiKey` | string | Yes | — | OpenBox API key (`obx_live_*` or `obx_test_*`) |
| `gatewayPort` | number | No | `18919` | Local LLM governance gateway port |
| `llmBaseUrl` | string | No | — | LLM provider base URL (e.g. `https://api.openai.com/v1`) |
| `llmApiKey` | string | No | — | LLM provider API key |

- `openboxUrl` and `openboxApiKey` are required. The plugin will log an error and not load if either is missing.
- `llmBaseUrl` and `llmApiKey` are only needed if you want to use the LLM governance gateway for guardrails. If omitted, the gateway will not start, and tool governance still works independently.

## Environment Variables

Store sensitive values in your `.env` file in OpenClaw rather than hardcoding them in `openclaw.json`:

```bash
OPENBOX_URL=https://core.openbox.ai
OPENBOX_API_KEY=obx_live_your_key_here
OPENAI_API_KEY=sk-your_openai_key_here
```

Reference them in `openclaw.json` using `${VAR_NAME}` syntax.

## LLM Gateway Setup

The LLM governance gateway is a local reverse proxy that intercepts LLM API calls for guardrails evaluation. To enable it:

1. **Set `llmBaseUrl` and `llmApiKey`** in the plugin config — this tells the gateway where to forward LLM requests after governance evaluation.

2. **Point your model provider's `baseUrl` to the gateway** — this routes LLM traffic through the gateway.

```json
{
  "models": {
    "providers": {
      "openai": {
        "baseUrl": "http://127.0.0.1:18919/v1",
        "apiKey": "${OPENAI_API_KEY}",
        "api": "openai-responses",
        "models": [
          {
            "id": "openai/gpt-5-mini",
            "name": "openai/gpt-5-mini"
          }
        ]
      }
    }
  }
}
```

The gateway supports:
- **Chat Completions API** (`/v1/chat/completions`)
- **Responses API** (`/v1/responses`)
- **Streaming** (SSE) and non-streaming responses
- **Health check** at `/health`

Any OpenAI-compatible model and provider will work.

### Gateway port

The default port is `18919`. If this conflicts with another service, change it via the `gatewayPort` config option and update the `baseUrl` in your model provider config to match.

## Web Control UI

All configuration options can also be set through the OpenClaw web control UI. The plugin provides UI hints (labels, placeholders, sensitive field masking) for a guided configuration experience.

## Critical Requirements

These are easy to miss and will cause the plugin to silently not work:

1. **Gateway restart required** — After installing the plugin or changing configuration, you must run `openclaw gateway restart`. The gateway does not pick up plugin changes automatically.

2. **Both `openboxUrl` and `openboxApiKey` must be set** — If either is missing, the plugin logs an error and does not register any governance hooks. Tool calls and LLM inferences will proceed ungoverned.

3. **LLM `baseUrl` must point to the gateway** — If your model provider's `baseUrl` still points directly to the LLM provider (e.g. `https://api.openai.com/v1`), LLM requests bypass the gateway entirely and guardrails will not be applied.

## Full Configuration Example

A complete `openclaw.json` with both plugin configuration and model provider routing:

```json
{
  "plugins": {
    "entries": {
      "openbox": {
        "enabled": true,
        "config": {
          "openboxUrl": "${OPENBOX_URL}",
          "openboxApiKey": "${OPENBOX_API_KEY}",
          "llmBaseUrl": "https://api.openai.com/v1",
          "llmApiKey": "${OPENAI_API_KEY}",
          "gatewayPort": 18919
        }
      }
    }
  },
  "models": {
    "providers": {
      "openai": {
        "baseUrl": "http://127.0.0.1:18919/v1",
        "apiKey": "${OPENAI_API_KEY}",
        "api": "openai-responses",
        "models": [
          {
            "id": "openai/gpt-5-mini",
            "name": "openai/gpt-5-mini"
          }
        ]
      }
    }
  }
}
```
