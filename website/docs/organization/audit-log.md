---
title: Audit Log
description: Organization activity audit trail
sidebar_position: 1
---

# Audit Log

The Audit Log provides a complete record of all organization activity. Use it for security monitoring, compliance, and incident investigation.

Access via **Organization → Audit Log**.

## Event Types

### Authentication Events

| Event | Description |
|-------|-------------|
| `user.login` | User logged in |
| `user.logout` | User logged out |
| `user.login_failed` | Failed login attempt |
| `user.mfa_enabled` | MFA enabled |
| `user.password_changed` | Password changed |
| `sso.login` | SSO authentication |

### Member Events

| Event | Description |
|-------|-------------|
| `member.invited` | Invitation sent |
| `member.joined` | Accepted invitation |
| `member.role_changed` | Role updated |
| `member.removed` | Removed from org |
| `member.suspended` | Account suspended |

### Agent Events

| Event | Description |
|-------|-------------|
| `agent.created` | New agent registered |
| `agent.updated` | Agent configuration changed |
| `agent.deleted` | Agent removed |
| `agent.blocked` | Agent blocked |
| `agent.unblocked` | Agent unblocked |
| `agent.trust_tier_changed` | Trust tier changed |

### Policy Events

| Event | Description |
|-------|-------------|
| `policy.created` | New policy created |
| `policy.updated` | Policy modified |
| `policy.deleted` | Policy removed |
| `policy.enabled` | Policy activated |
| `policy.disabled` | Policy deactivated |

### Guardrail Events

| Event | Description |
|-------|-------------|
| `guardrail.created` | New guardrail created |
| `guardrail.updated` | Guardrail modified |
| `guardrail.deleted` | Guardrail removed |

### Behavioral Rule Events

| Event | Description |
|-------|-------------|
| `behavioral_rule.created` | New rule created |
| `behavioral_rule.updated` | Rule modified |
| `behavioral_rule.deleted` | Rule removed |
| `behavioral_rule.triggered` | Rule matched a pattern |

### Approval Events

| Event | Description |
|-------|-------------|
| `approval.requested` | HITL request created |
| `approval.approved` | Request approved |
| `approval.rejected` | Request rejected |
| `approval.expired` | Request timed out |
| `approval.escalated` | Request escalated |

### API Key Events

| Event | Description |
|-------|-------------|
| `api_key.created` | New key created |
| `api_key.deleted` | Key revoked |
| `api_key.used` | Key used for authentication |

### Settings Events

| Event | Description |
|-------|-------------|
| `settings.updated` | Organization settings changed |
| `integration.configured` | Integration added/updated |
| `webhook.configured` | Webhook configured |

## Log Entry Structure

Each entry contains:

```json
{
  "id": "log_abc123",
  "timestamp": "2024-01-15T09:14:32.001Z",
  "event": "approval.approved",
  "actor": {
    "id": "usr_xyz789",
    "email": "john@company.com",
    "type": "user"
  },
  "target": {
    "type": "approval",
    "id": "apr_def456"
  },
  "metadata": {
    "agent_id": "agt_ghi789",
    "operation": "EXTERNAL_API_CALL",
    "comment": "Verified by security team"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

## Filtering

### By Date Range

- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

### By Event Type

Select specific event categories:

- Authentication
- Members
- Agents
- Policies
- Approvals
- Settings

### By Actor

Filter by who performed the action:

- Specific user
- System (automated)
- API (programmatic)

### By Target

Filter by what was affected:

- Specific agent
- Specific team
- Specific policy

## Search

Full-text search across:

- Event descriptions
- Actor emails
- Target names
- Metadata

```
Search: "external api" agent:customer-support
```

## Export

### Manual Export

1. Apply desired filters
2. Click **Export**
3. Select format (CSV or JSON)
4. Download file

### Scheduled Export (Enterprise)

Enterprise feature:

1. Go to **Organization → Audit Log**
2. Click **Configure Export**
3. Set schedule (daily, weekly, monthly)
4. Configure destination (S3, GCS, SFTP)
5. Enable encryption (optional)

### Retention

| Plan | Retention |
|------|-----------|
| Free | 30 days |
| Team | 90 days |
| Enterprise | 1 year+ (configurable) |

## Compliance Use Cases

Use the audit log to support audits and investigations:

- Review access and configuration changes
- Confirm approval decisions and escalations
- Provide evidence timelines during incident response

## Alerts

Configure alerts for specific events:

1. Go to **Organization → Settings → Alerts**
2. Click **Create Alert**
3. Select trigger event (e.g., `user.login_failed` count > 5)
4. Configure notification channel
5. Enable alert

Example alerts:

- Multiple failed logins
- Agent blocked
- Policy deleted
- API key created

## Next Steps

1. **[Compliance](/docs/compliance)** - Use audit trails and attestation evidence for auditors
2. **[View Attestation](/docs/compliance/attestation)** - Get cryptographic proof of agent behavior
