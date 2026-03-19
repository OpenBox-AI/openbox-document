---
title: Session Replay
description: "Replay any AI agent session step-by-step: Audit every decision, investigate policy violations, and reconstruct complete execution history."
llms_description: Replay and audit agent sessions
sidebar_position: 1
tags:
  - session
  - observability
  - audit
---

# Session Replay

Session Replay provides a step-by-step walkthrough of an agent's session execution. Inspect every event, tool call, governance decision, and full JSON payload to understand exactly what happened and why.

## Accessing Session Replay

- **Agent Detail → Verify → Watch Replay** — opens replay for the selected session

![Session Replay](/img/SessionReplay.webp)

## Session Header

The header bar at the top of the replay summarizes the session:

| Field | Description |
|-------|-------------|
| **Session ID** | Unique session identifier |
| **Duration** | Total wall-clock time for the session |
| **Events** | Total number of events recorded |
| **Status** | Badge showing current state — Completed, Failed, Halted, or In Progress |

## Playback Controls

Controls beneath the header let you navigate through the session timeline:

| Control | Description |
|---------|-------------|
| **Play / Pause** | Start or pause automatic playback through events |
| **Progress bar** | Scrub to any point in the session timeline |
| **Timestamps** | Current position and total duration |
| **Speed toggle** | Switch between 0.5x, 1x, and 2x playback speed |

## Event Stream

The event stream on the left lists all events that occurred during the session in chronological order, including user prompts and tool calls. Each event shows its name and a timestamp offset from the start of the session. Some events include a summary line (e.g. "Transfer exceeds $5,000 threshold — requires approval").

Click any event to view its full details.

## Event Details

The event details panel on the right shows the full information for the selected event:

- **Activity type and timestamp** — the event name and when it occurred
- **Event ID** — unique identifier for the event
- **Context** — the full JSON payload, including fields such as prompt, agent goal, tools, and arguments

## Related

- **[Verify](/trust-lifecycle/verify)** — Goal alignment scoring and execution evidence
- **[Monitor](/trust-lifecycle/monitor)** — Operational metrics and session overview
- **[Governance Decisions](/core-concepts/governance-decisions)** — The four decision types shown in replay
- **[Event Types](/developer-guide/event-types)** — Semantic event types that appear in the stream
- **[Approvals](/approvals)** — Human-in-the-loop approval queue
