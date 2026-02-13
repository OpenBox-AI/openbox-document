---
title: Monitor
description: Phase 3 - Observe runtime behavior and telemetry
sidebar_position: 3
---

# Monitor (Phase 3)

The Monitor phase provides visibility into agent runtime behavior. Observe sessions, view session replays, and track telemetry.

Access via **Agent Detail → Monitor** tab.

## Operational Dashboard

The Monitor tab provides operational observability into performance, cost, and health.

### Total Invocations

Total number of agent invocations, with trend and average response time.

### Token Consumption

Total tokens consumed, with trend and associated cost for the current day.

### Total Errors

Total error count, with today's error count and overall success rate.

### Goal Alignment Trend

Trend chart of alignment across sessions over time.

### Recent Drift Events

Recent sessions where goal drift was detected, including session ID, score, and drift summary.

### Tool Health Matrix

Health table for tools/MCP servers (success rate, latency, status) to identify degraded dependencies.

### Request Volume

Request volume chart (last 24h) with total requests, peak per hour, and average per hour.

### Model Usage

Model usage view with token and cost breakdown by model.

### Latency Distribution

Response-time distribution with percentiles (P50, P95, P99, Max).

### Error Breakdown

Error categories with counts/percentages (for example: timeout, rate limit, server error, policy violation).

### Cost Analytics

Spending view with today's spend, projection, and budget utilization split by input tokens, output tokens, and tool calls.

### Recent Issues

Latest issues requiring action (policy violations, workflow failures, timeouts), with links to details.

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

Goal Alignment tracks whether your agent's actions and outputs match the user's original request. OpenBox compares the user's goal (sent via Temporal signal) against the agent's LLM responses and tool outputs.

Goal Alignment requires you to implement goal context propagation in your workflow. In practice, this is done by sending a Temporal **Signal** into the running workflow and handling it with a signal handler that stores the user request input (goal context) in workflow state. Signals are asynchronous (the send returns when the server accepts it, not when the workflow processes it) and appear in workflow history as `WorkflowExecutionSignaled`. Without this signal, OpenBox cannot detect a goal session, and no stated goal is available for alignment scoring.

#### How to implement goal context propagation (Temporal Python)

**Step 1: Add a signal handler to your workflow**

```python
from datetime import timedelta

from temporalio import workflow


@workflow.defn
class YourAgentWorkflow:
    def __init__(self):
        self.user_goal = None

    @workflow.signal
    async def user_prompt(self, prompt: str) -> None:
        self.user_goal = prompt

    @workflow.run
    async def run(self, input_data: str) -> dict:
        await workflow.wait_condition(lambda: self.user_goal is not None)

        result = await workflow.execute_activity(
            "your_activity",
            input_data,
            start_to_close_timeout=timedelta(minutes=10),
        )

        return result
```

**Step 2: Send the signal when starting the workflow**

Option A: Signal-With-Start (recommended)

```python
handle = await client.start_workflow(
    YourAgentWorkflow.run,
    "your input data",
    id="your-workflow-id",
    task_queue="your-task-queue",
    start_signal="user_prompt",
    start_signal_args=["The user's goal or request goes here"],
)
```

Option B: Separate signal call

```python
handle = await client.start_workflow(
    YourAgentWorkflow.run,
    "your input data",
    id="your-workflow-id",
    task_queue="your-task-queue",
)

await handle.signal("user_prompt", "The user's goal or request goes here")
```

**Step 3: Return the full LLM response in activity output**

Your activity should return the complete LLM response so OpenBox can compare it against the goal.

| Score | Badge | Meaning |
|-------|-------|---------|
| 90-100% | Green | Well aligned with stated goal |
| 70-89% | Yellow | Minor deviations |
| Below 70% | Red | Significant drift detected |

Hover for details including:
- Alignment score breakdown
- LLM evaluation status
- Stated goal at session start

Notes:

- The signal name can be anything (it does not have to be `user_prompt`).
- If your activities do file operations, ensure your worker has `instrument_file_io=True` enabled.

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


## Next Phase

As sessions complete and data accumulates:

→ **[Verify](/docs/agents/trust-lifecycle/verify)** - Check that your agent's actions align with its stated goals and detect any drift
