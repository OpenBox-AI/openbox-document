---
title: Cursor Hooks (TypeScript)
description: "Developer reference for governing Cursor IDE agents with OpenBox: hook handler architecture, lifecycle events, span instrumentation, and configuration."
llms_description: Cursor Hooks TypeScript SDK reference and architecture
tags:
  - sdk
  - cursor
  - typescript
---

# Cursor Hooks (TypeScript)

The `cursor-hooks` package provides real-time governance and observability for [Cursor IDE](https://cursor.com) agents — powered by [OpenBox](https://openbox.ai).

**[OpenBox-AI/cursor-hooks](https://github.com/OpenBox-AI/cursor-hooks)**

## Architecture

`cursor-hooks` operates as a set of **external hook scripts** invoked by Cursor at each point in the agent loop. Each hook invocation is a separate Node.js process that:

1. Reads JSON from stdin (Cursor's hook payload)
2. Routes to the correct handler based on `hook_event_name`
3. Calls OpenBox's governance API
4. Writes JSON to stdout (Cursor's expected response format)

```
Cursor Agent Loop                    cursor-hooks                    OpenBox Core
  │                                      │                               │
  ├─ beforeSubmitPrompt ──stdin──►  hook-handler.ts                      │
  │                                  ├─ sendGoalSignal() ─────────►  SignalReceived
  │                                  ├─ governInput() ────────────►  ActivityStarted
  │                                  │                          ◄──  verdict
  │                          ◄──stdout── mapPromptVerdict()          │
  │                                      │                               │
  ├─ afterAgentResponse ──stdin──►  hook-handler.ts                      │
  │                                  ├─ completeActivity() ───────►  ActivityStarted (hook_trigger, llm span)
  │                                  ├─ observe() ────────────────►  ActivityStarted
  │                          ◄──stdout── null (observe only)             │
  │                                      │                               │
  └─ stop ────────────────stdin──►  hook-handler.ts                      │
                                     └─ endSession() ─────────────►  WorkflowCompleted
```

## Event lifecycle

All hooks within a Cursor conversation share one `workflow_id`. This maps to a single OpenBox session:

```
sessionStart         → WorkflowStarted
beforeSubmitPrompt   → SignalReceived (user goal) + ActivityStarted (PromptSubmission)
afterAgentResponse   → ActivityStarted (hook_trigger, llm_completion span) + ActivityStarted (AgentResponse)
beforeShellExecution → ActivityStarted (ShellExecution)
afterShellExecution  → ActivityCompleted (ShellExecution) + ActivityStarted (ShellOutput)
stop                 → WorkflowCompleted
```

### Session persistence

Each hook runs as a separate process. Sessions are persisted to `~/.cursor-hooks/sessions/` as JSON files, keyed by `{conversation_id}:{activity_type}`. This allows `afterAgentResponse` to complete the activity started by `beforeSubmitPrompt`.

## Hook handlers

### Before-hooks (can block)

| Hook | Handler | What it does |
|------|---------|-------------|
| `beforeSubmitPrompt` | `mappers/prompt.ts` | Sends user goal via `SignalReceived`. Governs prompt input. Can block or pass through. |
| `beforeReadFile` | `mappers/file-read.ts` | Governs file content. Can block, allow, or redact (constrain). |
| `beforeShellExecution` | `mappers/shell.ts` | Governs shell commands. Can block dangerous commands via Rego policies. |
| `beforeMCPExecution` | `mappers/mcp.ts` | Governs MCP tool calls. Can block unauthorized tools. |

### After-hooks (observe only)

| Hook | Handler | What it does |
|------|---------|-------------|
| `afterAgentResponse` | `mappers/observe.ts` | Completes prompt lifecycle. Sends `llm_completion` span for goal alignment scoring. |
| `afterAgentThought` | `mappers/observe.ts` | Observes agent reasoning for drift detection. |
| `afterShellExecution` | `mappers/observe.ts` | Completes shell lifecycle with output and exit code. |
| `afterMCPExecution` | `mappers/mcp-response.ts` | Governs MCP response. Can redact PII from tool output. |
| `afterFileEdit` | `mappers/observe.ts` | Observes file changes for behavioral rules. |

## Span instrumentation

### LLM completion span

The `afterAgentResponse` handler sends an `llm_completion` span as a hook trigger for goal alignment:

```json
{
  "event_type": "ActivityStarted",
  "hook_trigger": true,
  "span_count": 1,
  "spans": [{
    "name": "POST https://api.openai.com/v1/chat/completions",
    "kind": "CLIENT",
    "stage": "completed",
    "start_time": 1711526130000000000,
    "end_time": 1711526133000000000,
    "attributes": {
      "http.method": "POST",
      "http.url": "https://api.openai.com/v1/chat/completions",
      "http.status_code": 200
    },
    "request_body": "{\"messages\":[{\"role\":\"user\",\"content\":\"fix the bug\"}]}",
    "response_body": "{\"choices\":[{\"message\":{\"content\":\"I fixed the bug by...\"}}]}"
  }]
}
```

The `request_body` contains the original user prompt (stored during `beforeSubmitPrompt`), and `response_body` contains the agent's response. OpenBox compares these for goal alignment scoring.

### Semantic type mapping

OpenBox classifies spans by their attributes. The hook handler sets appropriate span attributes so the server can compute the correct semantic type:

| Activity type | Span attributes | Server classification |
|--------------|----------------|----------------------|
| `PromptSubmission` | `http.url` = LLM domain | `llm_completion` |
| `FileRead` | `file.path` set | `file_read` |
| `ShellExecution` | No HTTP/file/DB attrs | `internal` |
| `MCPToolCall` | `http.method` + `http.url` set | `http_post` |

## Goal alignment (drift detection)

Goal alignment compares the user's stated intent against the agent's actual response:

1. **`beforeSubmitPrompt`** sends a `SignalReceived` event with the user's prompt as the goal
2. **`afterAgentResponse`** sends an `llm_completion` span (via hook trigger) with:
   - `request_body` = original user prompt
   - `response_body` = agent's response
3. OpenBox scores alignment 0-100%. Below 50% = drift detected.

The alignment score is returned in the `age_result.span_results[].alignment_result` field of the API response.

## Configuration reference

Config file: `~/.cursor-hooks/config.json`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `OPENBOX_API_KEY` | string | — | API key (required) |
| `OPENBOX_ENDPOINT` | string | `https://core.openbox.ai` | Core API URL |
| `GOVERNANCE_POLICY` | string | `fail_open` | `fail_open` or `fail_closed` |
| `GOVERNANCE_TIMEOUT` | number | `15` | API timeout in seconds |
| `VERBOSE` | boolean | `false` | Debug logging to stderr and log file |
| `DRY_RUN` | boolean | `false` | Allow all actions, skip API calls |
| `HITL_ENABLED` | boolean | `true` | Enable HITL approval polling |
| `HITL_POLL_INTERVAL` | number | `5` | Approval poll interval (seconds) |
| `HITL_MAX_WAIT` | number | `300` | Approval timeout (seconds) |
| `TASK_QUEUE` | string | `cursor-hooks` | Task queue name |
| `SEND_START_EVENT` | boolean | `true` | Send WorkflowStarted events |
| `SEND_ACTIVITY_START_EVENT` | boolean | `true` | Send ActivityStarted events |
| `MAX_BODY_SIZE` | number | unlimited | Max bytes for input/output body |
| `SKIP_ACTIVITY_TYPES` | string | — | Comma-separated activity types to skip |

## Project structure

```
src/
  hook-handler.ts      Entry point — reads stdin, routes, writes stdout
  config.ts            Config from env vars / config.json / .env
  governance.ts        OpenBox bridge — lifecycle, API calls, metadata
  session-store.ts     Disk-based session persistence across hook invocations
  verdict-mapper.ts    Verdict → Cursor hook JSON response
  types.ts             Type definitions
  logger.ts            Structured logging (file + stderr)
  mappers/
    prompt.ts          beforeSubmitPrompt
    file-read.ts       beforeReadFile
    shell.ts           beforeShellExecution
    mcp.ts             beforeMCPExecution
    mcp-response.ts    afterMCPExecution
    observe.ts         After-hooks + sessionStart + stop
  __tests__/
```

## Troubleshooting

### Hooks not firing

Check that `~/.cursor/hooks.json` exists and points to a valid handler:
```bash
cat ~/.cursor/hooks.json
```

The command should reference `~/.cursor-hooks/hook-handler.js`. If the path is wrong, re-run:
```bash
npm run install-hooks -- --key obx_live_your_key
```

### No log output

Ensure the hook handler is executable and the config directory exists:
```bash
ls -la ~/.cursor-hooks/hook-handler.js
node ~/.cursor-hooks/hook-handler.js  # should exit silently with no API key
```

### File reads getting blocked

Check your guardrail configuration for the `FileRead` activity type on the OpenBox dashboard. PII detection may flag API keys or tokens found in file content.

### Alignment score is null

Ensure:
1. `beforeSubmitPrompt` fires before `afterAgentResponse` (check hook.log)
2. The `llm_completion` span has `stage: "completed"` (not `"started"`)
3. Goal alignment is enabled on your OpenBox dashboard
