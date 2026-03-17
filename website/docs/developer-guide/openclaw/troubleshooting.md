---
title: Troubleshooting
description: "Troubleshoot the OpenBox OpenClaw plugin: plugin not loading, gateway issues, missing dashboard events, guardrails bypass, and verification checklist."
llms_description: OpenClaw plugin common issues and verification checklist
sidebar_position: 5
tags:
  - sdk
  - openclaw
---

# Troubleshooting

Common issues when integrating the OpenBox plugin with OpenClaw, organized by symptom.

## Plugin Not Loading

**Symptom:** No `[openbox] plugin loaded` message in OpenClaw logs. Tool calls proceed without governance.

**Possible causes:**

1. **Plugin not installed.** Run `openclaw plugins install .` from the plugin directory.

2. **Gateway not restarted.** Run `openclaw gateway restart` after installing or updating the plugin.

3. **Missing required config.** Both `openboxUrl` and `openboxApiKey` must be set in the plugin config. If either is missing, the plugin logs `[openbox] Missing openboxUrl or openboxApiKey in plugin config` and does not register hooks. Check your `openclaw.json` and `.env` file.

4. **Plugin not enabled.** Ensure `"enabled": true` is set in the plugin entry:
   ```json
   {
     "plugins": {
       "entries": {
         "openbox": {
           "enabled": true,
           "config": { ... }
         }
       }
     }
   }
   ```

5. **Build not run.** The plugin needs to be compiled before installation. Run `npm run build` in the plugin directory, then reinstall and restart the gateway.

## Gateway Not Starting

**Symptom:** The LLM gateway health check (`curl http://127.0.0.1:18919/health`) fails or times out.

**Possible causes:**

1. **Missing `llmBaseUrl` or `llmApiKey`.** The gateway only starts if both are configured. If you only want tool governance without LLM guardrails, this is expected — the gateway does not need to run.

2. **Port conflict.** Another process is using port `18919`. Either stop the conflicting process or change the port via the `gatewayPort` config option. Remember to update your model provider's `baseUrl` to match the new port.

3. **Gateway already started.** If the plugin was loaded by multiple subsystems, the gateway may have already started. Check for `[openbox] LLM gateway started on http://127.0.0.1:18919/v1` in earlier log output. The plugin prevents duplicate gateway starts.

## No Events in Dashboard

**Symptom:** The agent runs and tool calls execute, but no sessions or activities appear in the OpenBox dashboard.

**Possible causes:**

1. **Wrong `openboxUrl`.** Verify the URL matches your OpenBox Core instance. Check for typos.

2. **Invalid API key.** Check that your `openboxApiKey` starts with `obx_live_` or `obx_test_` and is active. Generate a new key in the OpenBox dashboard under Settings > API Keys if needed.

3. **Network issue.** The plugin fails open on network errors, so tool calls will succeed even if Core is unreachable. Check logs for `[openbox] evaluate failed (fail-open)` or `[openbox] session registration failed`.

4. **Session not registered.** The session is registered on the first governance evaluation, not at `session_start`. If the agent exits before making any tool calls, no session appears.

## LLM Requests Bypassing Guardrails

**Symptom:** LLM calls work but guardrails (PII detection, content filtering) are not applied.

**Possible causes:**

1. **Model provider `baseUrl` not pointing to gateway.** This is the most common cause. Your model provider in `openclaw.json` must point to `http://127.0.0.1:18919/v1`. If it still points directly to the LLM provider URL (e.g. `https://api.openai.com/v1`), requests bypass the gateway entirely.

2. **Gateway not running.** Check the health endpoint and logs. See [Gateway Not Starting](#gateway-not-starting).

3. **Guardrails not configured.** Guardrails are configured in the OpenBox dashboard, not in the plugin config.

## Tools Executing Despite Block Policy

**Symptom:** You have a policy that should block a tool, but the tool executes anyway.

**Possible causes:**

1. **Fail-open in effect.** If Core is unreachable, the plugin allows all actions. Check logs for `[openbox] evaluate failed (fail-open)`.

2. **Policy not matching.** The policy may not match the exact tool name or parameters being sent. Check the dashboard for the governance event to see what was sent to Core.

3. **Policy not active.** Verify the policy is active in the OpenBox dashboard.

## Gateway Returning Errors

**Symptom:** LLM calls through the gateway return error responses.

**Possible causes:**

1. **Wrong `llmBaseUrl`.** The gateway forwards requests to this URL after governance evaluation. Verify it is correct.

2. **Invalid `llmApiKey`.** The gateway uses this key when forwarding to the LLM provider. Check it is valid and has sufficient quota.

3. **Unsupported route.** The gateway only supports `POST` requests to `/v1/chat/completions` and `/v1/responses`. Requests to other paths return a `404`.

4. **Request body parsing error.** The gateway expects a valid JSON request body. Check logs for `[openbox] llm_gateway error`.

## Verifying Your Setup

After completing the [Getting Started](/getting-started/openclaw) steps, follow this checklist:

### 1. Check the plugin loaded

Look for the initialization message in OpenClaw logs:

```
[openbox] plugin loaded
[openbox] LLM gateway started on http://127.0.0.1:18919/v1
```

### 2. Check the LLM gateway health

```bash
curl http://127.0.0.1:18919/health
# Expected: {"status":"ok"}
```

### 3. Run a tool call and check the logs

Start your agent and perform a simple action. You should see:

```
[openbox] session registered verdict=allow
[openbox] tool=Read verdict=allow reason="" ms=120
```

### 4. Check the OpenBox dashboard

Open [platform.openbox.ai](https://platform.openbox.ai) and look for a new session entry with tool calls and governance verdicts.

### 5. Test a block verdict

Create a test policy in the dashboard that blocks a specific tool, then trigger that tool. You should see:

```
[openbox] tool=Bash verdict=block reason="Blocked by test policy" ms=95
```

Remove the test policy when done.

## Log Messages Reference

| Log message | Meaning |
|-------------|---------|
| `[openbox] plugin loaded` | Plugin initialized and hooks registered |
| `[openbox] LLM gateway started on ...` | Gateway is listening |
| `[openbox] session registered verdict=...` | Session registered with Core |
| `[openbox] tool=X verdict=Y reason="Z" ms=N` | Tool call evaluated |
| `[openbox] llm_input verdict=...` | LLM inference start reported |
| `[openbox] llm_output verdict=... spans=N` | LLM inference end reported |
| `[openbox] llm_gateway verdict=... reason="..." ms=N` | Gateway guardrails evaluated |
| `[openbox] llm_gateway applying guardrails redaction` | Sensitive content was redacted |
| `[openbox] evaluate failed (fail-open): ...` | Core unreachable, tool allowed |
| `[openbox] session registration failed: ...` | Could not register session with Core |
| `[openbox] session close failed: ...` | Could not report session end to Core |
| `[openbox] LLM gateway server error: ...` | Gateway server error (port conflict, etc.) |
| `[openbox] Missing openboxUrl or openboxApiKey ...` | Required config missing |
