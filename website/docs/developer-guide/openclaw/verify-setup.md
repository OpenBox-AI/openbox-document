---
title: Verifying Your Setup
description: "Verify the OpenBox OpenClaw plugin is loaded and governance is active: plugin logs, gateway health, tool call verdicts, dashboard sessions, and block testing."
llms_description: OpenClaw plugin setup verification checklist
sidebar_position: 4
tags:
  - sdk
  - openclaw
---

# Verifying Your Setup

After completing the [Getting Started](/getting-started/openclaw) steps, follow this guide to confirm the plugin is loaded and governance is active.

## 1. Check the plugin loaded

After restarting the gateway, check the OpenClaw logs for the plugin initialization message:

```
[openbox] plugin loaded
```

If you configured the LLM gateway, you should also see:

```
[openbox] LLM gateway started on http://127.0.0.1:18919/v1
```

If neither message appears, see [Troubleshooting - Plugin not loading](/developer-guide/openclaw/troubleshooting#plugin-not-loading).

## 2. Check the LLM gateway is running

If you configured the LLM gateway, verify it is responding:

```bash
curl http://127.0.0.1:18919/health
```

Expected response:

```json
{"status":"ok"}
```

If the health check fails, the gateway may not have started - check the logs for `[openbox] LLM gateway server error` messages. See [Troubleshooting - Gateway not starting](/developer-guide/openclaw/troubleshooting#gateway-not-starting).

## 3. Run a tool call and check the logs

Start your agent and perform a simple action - for example, ask it to read a file. In the OpenClaw logs, you should see governance evaluation output:

```
[openbox] session registered verdict=allow
[openbox] tool=Read verdict=allow reason="" ms=120
```

This confirms:
- The plugin is intercepting tool calls
- OpenBox Core is reachable
- Your API key is valid
- The session was registered

If the verdict shows `block`, your policies in the OpenBox dashboard are actively governing the action.

## 4. Check the OpenBox dashboard

Open the [OpenBox dashboard](https://platform.openbox.ai) and navigate to the sessions view. You should see a new session entry corresponding to your agent run, with:

- Session timeline showing tool calls and LLM inferences
- Governance verdicts for each action
- OTel span data attached to activities

If no session appears in the dashboard, check that your `openboxUrl` and `openboxApiKey` are correct. See [Troubleshooting - No events in dashboard](/developer-guide/openclaw/troubleshooting#no-events-appearing-in-the-dashboard).

## 5. Test a block verdict

To confirm governance enforcement is working end-to-end, create a test policy in the OpenBox dashboard that blocks a specific tool (e.g. block `Bash` tool calls). Then ask your agent to run a shell command.

You should see in the logs:

```
[openbox] tool=Bash verdict=block reason="Blocked by test policy" ms=95
```

And the agent should receive the block reason instead of executing the command.

Remove the test policy when you are done.

## What to check if something is wrong

| Symptom | Likely cause | See |
|---------|-------------|-----|
| No `[openbox] plugin loaded` in logs | Missing config, plugin not installed | [Plugin not loading](/developer-guide/openclaw/troubleshooting#plugin-not-loading) |
| Gateway health check fails | Port conflict, missing `llmBaseUrl`/`llmApiKey` | [Gateway not starting](/developer-guide/openclaw/troubleshooting#gateway-not-starting) |
| `verdict=allow` but expected block | Policy not configured in dashboard | [OpenBox Dashboard](/developer-guide/openclaw/dashboard) |
| No session in dashboard | Wrong `openboxUrl` or invalid API key | [No events in dashboard](/developer-guide/openclaw/troubleshooting#no-events-appearing-in-the-dashboard) |
| Tool calls proceed but no log output | Plugin not loaded or hooks not registered | [Plugin not loading](/developer-guide/openclaw/troubleshooting#plugin-not-loading) |
