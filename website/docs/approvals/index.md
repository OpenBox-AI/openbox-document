---
title: Approvals
description: Human-in-the-Loop approval queue
sidebar_position: 5
---

# Approvals

The Approvals page is the organization-wide Human-in-the-Loop (HITL) queue. Review and act on pending approval requests.

Access from the sidebar by clicking **Approvals**. The badge shows the number of pending requests.

![Approvals](/img/Approvals.png)

## Real-Time Updates

The page updates in real-time. A green indicator shows "Real-time Updates" / "Live" status. Click **Refresh** to manually reload.

## Stats Cards

Five metrics across the top:

| Metric | Description |
|--------|-------------|
| **Pending** | Approval requests awaiting review (orange) |
| **Approved Today** | Requests approved in the last 24h (green) |
| **Rejected Today** | Requests rejected in the last 24h (red) |
| **Expired Today** | Requests that timed out (gray) |
| **Avg Response Time** | Average time to respond with trend indicator |

## SLA Summary

A summary bar shows SLA performance:

- **Within** - Percentage of approvals resolved within SLA target (green)
- **At Risk** - Approaching SLA deadline (orange)
- **Breached** - Exceeded SLA target (red)
- **SLA Target** - Configured target time (default: 5 min)

Click **Analytics** to view detailed SLA analytics.

## Approval Queue

### Queue Tabs

- **Pending** - Requests awaiting action
- **Approved** - Recently approved requests
- **Rejected** - Recently rejected requests
- **Expired** - Requests that timed out

### Approval Cards

Each pending approval shows:

| Field | Description |
|-------|-------------|
| **Agent** | Agent name, icon, and Trust Tier badge |
| **Operation** | What the agent is attempting |
| **Session** | Link to session for context |
| **Time Pending** | How long it's been waiting |
| **SLA Status** | Within SLA, At Risk, or Breached |
| **Priority** | Low, Medium, High, or Critical |

### SLA Indicators

Each card shows SLA status:

- **Green border** - Within SLA target
- **Orange border** - At risk (>80% of SLA time elapsed)
- **Red border** - SLA breached

### Approval Actions

For each pending request:

| Action | Description |
|--------|-------------|
| **Approve** | Allow operation to proceed |
| **Reject** | Block operation (requires reason) |
| **View Session** | Open session replay for full context |

## Processing Approvals

### Approving

1. Review the operation details
2. Click **Approve**
3. Optionally add a comment
4. The operation resumes

**Result:**
- Activity retries and succeeds
- Event logged in audit trail
- Trust score unchanged

### Rejecting

1. Review the operation details
2. Click **Reject**
3. Enter a rejection reason (required)
4. Confirm rejection

**Result:**
- Operation is rejected
- Trust score decreases (-2)
- Event logged in audit trail

### Timeout

If no action is taken:

- Default timeout: 5 minutes per approval request (configurable per behavioral rule, 5-60 min range)
- Request expires and the operation does not proceed
- Trust score slightly decreases (-1)
- Appears in "Expired Today" stat

## Filtering

Filter the queue by:

- **Priority** - Low, Medium, High, Critical
- **Agent** - Specific agent
- **Team** - Owning team
- **SLA Status** - Within, At Risk, Breached

## Next Steps

1. **[Review Approvals](/docs/approvals)** - Manage pending requests and approval history
2. **[Monitor Sessions](/docs/agents/trust-lifecycle/monitor)** - Review the full session context before approving or rejecting
