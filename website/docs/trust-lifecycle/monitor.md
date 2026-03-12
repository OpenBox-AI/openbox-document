---
title: Monitor
description: Phase 3 - Observe runtime behavior and telemetry
llms_description: Real-time agent observability
sidebar_position: 3
tags:
  - observability
  - goal-alignment
  - trust-scoring
  - session
---

# Monitor (Phase 3)

The Monitor phase provides visibility into agent runtime behavior. Track performance, cost, errors, and goal alignment across sessions.

Access via **Agent Detail → Monitor** tab.

### Time Range Selector

Use the time range selector in the top-right corner to control the reporting period for all dashboard widgets.

| Option | Period |
|--------|--------|
| **24H** | Last 24 hours |
| **7D** | Last 7 days |
| **30D** | Last 30 days |
| **90D** | Last 90 days |
| **Custom** | Select a custom date range |

The default view is **7D**. Changing the time range updates all metrics, charts, and issue lists on the dashboard.

## Operational Dashboard

The Monitor tab provides operational observability into performance, cost, and health.

### Total Invocations

Displays the total number of agent invocations for the selected period.
- **Trend** — percentage change compared to the previous period (e.g. -87.9%)
- **Avg response** — average response time across all invocations (e.g. Avg 1.1s response)


### Token Consumption

Displays the total tokens consumed across all invocations for the selected period.

- **Trend** — percentage change compared to the previous period (e.g. +8%)
- **Today's cost** — estimated spend for the current day (e.g. $3.83 today)


### Total Errors
Displays the total error count for the selected period.

- **Today's errors** — number of errors recorded today (e.g. +5 today)
- **Success rate** — overall success rate across all invocations (e.g. 97.8%)


### Goal Alignment Trend
Line chart showing goal alignment scores across all sessions over time.

- **Threshold line** — 70% alignment threshold shown as a dashed line
- **Color bands:**

| Color | Range | Meaning |
|-------|-------|---------|
| Green | 70% and above | Aligned |
| Orange | 50% – 69% | Warning |
| Red | Below 50% | Misaligned |


### Recent Drift Events
Lists recent sessions where goal drift was detected. A count badge shows the total number of drift events.

Each entry displays:

| Field | Description |
|-------|-------------|
| **Session ID** | Truncated session identifier |
| **Score** | Alignment score as a percentage (e.g. 89%) |
| **Summary** | Brief description of the detected drift |
| **Timestamp** | Relative time (e.g. 5 days ago) |

Click an event to view session details.


### Tool Health Matrix

Health table for tools/MCP servers (success rate, latency, status) to identify degraded dependencies.

### Request Volume

Request volume chart for the selected time range, with total requests, peak per hour, average per hour, and success rate.


### Model Usage

Model usage view with token and cost breakdown by model.

### Latency Distribution

Response-time distribution with percentiles (P50, P95, P99, Max).

### Error Breakdown

Donut chart of error categories with counts and percentages (for example: Span Failed, Other Error, Workflow Failed, Guardrail Block).

### Cost Analytics

Spending view with today's spend, projection, and budget utilization split by input tokens, output tokens, and tool calls.

### Recent Issues

List of recent issues requiring attention. Click **Refresh** to reload the list.

Each entry displays:

| Field | Description |
|-------|-------------|
| **Type** | Issue tag — `workflow_failed` (red) or `guardrail_violation` (orange) |
| **Description** | Summary of the issue (e.g. "Workflow execution failed" or blocked validation details) |
| **Source** | Originating activity and workflow |
| **Timestamp** | Relative time (e.g. 5 days ago) |
| **Session Status** | Current session state (e.g. halted) |

Click an issue row to view the full session details.


### Goal Alignment Badge

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
| 90% – 100% | Green | Well aligned with stated goal |
| 70% – 89% | Yellow | Minor deviations |
| Below 70% | Red | Significant drift detected |

Hover for details including:
- Alignment score breakdown
- LLM evaluation status
- Stated goal at session start

Notes:

- The signal name can be anything (it does not have to be `user_prompt`).
- If your activities do file operations, ensure your worker has `instrument_file_io=True` enabled.

## Observability Metrics Reference

The dashboard widgets above surface the following underlying metrics. This reference describes the full set of metrics OpenBox tracks for each agent.

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

## Next Phase

As sessions complete and data accumulates:

→ **[Verify](/trust-lifecycle/verify)** - Check that your agent's actions align with its stated goals and detect any drift
