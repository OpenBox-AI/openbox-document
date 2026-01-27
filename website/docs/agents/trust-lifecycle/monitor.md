---
title: Monitor
description: Phase 3 - Observe runtime behavior and telemetry
sidebar_position: 3
---

# Monitor (Phase 3)

The Monitor phase provides visibility into agent runtime behavior. Observe sessions, view session replays, and track telemetry.

Access via **Agent Detail → Monitor** tab.

## Sessions

View active and completed workflow sessions.

### Active Sessions

Real-time view of running sessions:

| Field | Description |
|-------|-------------|
| **Session ID** | Unique identifier (e.g., sess_20241207_143215_abc123) |
| **Started** | Start timestamp |
| **Duration** | Running time |
| **Events** | Event count |
| **Status** | Running, Waiting (HITL), Error |

Click any active session to watch it in real-time via Session Replay.

### Recent Sessions

Completed sessions showing:

- Session ID and timestamps
- Duration and event count
- Goal alignment score
- Final status (Completed, Failed, Terminated)
- Governance verdicts summary

## Session Replay

Click any session to open the full replay view.

### Header

- **Session ID** - Unique identifier
- **Duration** - Total session time
- **Events** - Total event count
- **Goal Alignment** - Session alignment score with visual bar
- **Status** - Completed, Failed, or Terminated

### Timeline Control

Interactive timeline with:

- **Play/Pause** - Animate through the session
- **Seek** - Click anywhere on the timeline to jump
- **Speed** - 0.5x, 1x, 2x playback speed
- **Timestamps** - Start and end times

### Event Stream

Chronological list of all events in the session:

```
00:00  Session Started       User initiated support request
00:02  User Input Received   "I need help with my recent order"
00:05  LLM Inference         Intent classification (gpt-4)
00:08  Database Query        SELECT * FROM orders WHERE...
00:12  LLM Inference         Response generation
00:15  Output Generated      Response to user
```

Each event shows:
- **Timestamp** - Relative time in session
- **Event type** - Icon and name
- **Description** - What happened
- **Governance verdict** - ALLOWED, CONSTRAINED, HALTED badges

### Event Detail

Click any event to see full details:

- **Event metadata** - Type, timestamp, duration
- **Input/Output** - What went in/out (with sensitive data redacted)
- **Governance decision** - Which policies evaluated, what was the result
- **Trust impact** - How this event affected the trust score

### Goal Alignment Badge

The session header shows alignment:

| Score | Badge | Meaning |
|-------|-------|---------|
| 90-100% | Green | Well aligned with stated goal |
| 70-89% | Yellow | Minor deviations |
| Below 70% | Red | Significant drift detected |

Hover for details including:
- Alignment score breakdown
- LLM evaluation status
- Stated goal at session start

## Observability Metrics

Aggregated metrics across sessions:

### Performance

| Metric | Description |
|--------|-------------|
| **p50 Latency** | Median operation latency |
| **p95 Latency** | 95th percentile latency |
| **p99 Latency** | 99th percentile latency |
| **Throughput** | Operations per minute/hour |

### Governance

| Metric | Description |
|--------|-------------|
| **Allowed** | Operations that passed governance |
| **Constrained** | Operations modified by guardrails |
| **Halted** | Operations blocked by policies |
| **Approvals** | Operations requiring HITL |

### Trends

Charts showing:
- Session volume over time
- Latency trends
- Governance decision distribution
- Trust score changes

## Event Types in Replay

Session replay shows events with semantic types:

| Type | Icon | Example |
|------|------|---------|
| Session Started | Play | User initiated support request |
| User Input | Message | "I need help with my order" |
| LLM Inference | CPU/Brain | Intent classification with gpt-4 |
| Database Query | Database | SELECT * FROM orders |
| External API | Globe | POST to stripe.com/charges |
| Tool Call | Wrench | execute_refund() |
| Output Generated | MessageSquare | Response sent to user |
| Approval Requested | Clock | Waiting for human approval |
| Approval Granted | CheckCircle | Approved by sarah@company.com |
| Session Completed | CheckCircle | Success |

## Telemetry Export

Export telemetry data for external analysis:

- **OpenTelemetry** - OTLP export to Jaeger, Datadog, etc.
- **CSV** - Download raw event data

Configure in **Organisation → Settings → Integrations**.

## Next Phase

As sessions complete and data accumulates:

→ **[Verify](/docs/agents/trust-lifecycle/verify)** - Check that your agent's actions align with its stated goals and detect any drift
