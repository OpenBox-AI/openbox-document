---
title: Registering Agents
description: Create and configure new agents
sidebar_position: 1
---

# Registering Agents

Register an agent to begin governance. Navigate to **Agents** and click the **Add Agent** button in the top right corner.

## Agent Creation Form

### Workflow Engine

Select the workflow engine your agent uses:

| Engine | Status |
|--------|--------|
| **Temporal** | Available |

### Agent Information

| Field | Required | Description |
|-------|----------|-------------|
| **Agent Name** | Yes | Human-readable name (e.g., "Customer Support Bot") |
| **Agent ID** | Auto | Auto-generated unique identifier (e.g., "CSB-001") |
| **Description** | No | What does this agent do? |
| **Teams** | No | Assign to teams for access control |
| **Icon** | No | Visual identifier (headphones, code, trending-up, file-search, bot) |

### API Key Generation

Every agent needs an API key to authenticate with OpenBox:

1. Click **Generate API Key**
2. Copy the key immediately
3. Store it securely - you won't see it again

The key format is: `obx_live_xxxxxxxxxxxx`

## Initial Risk Assessment

Expand the **Initial Risk Assessment** section and configure your agent's AIVSS risk parameters.

### Risk Profile Presets

Select a preset that matches your agent's intended use:

| Tier | Name | Use Cases | Default Governance |
|-------|------|-----------|-------------------|
| **Tier 1 (90-100)** | Trusted | Read-only access, internal research, no external APIs | Fully autonomous |
| **Tier 2 (75-89)** | Confident | Internal automation, limited writes, monitored external calls | Mostly autonomous |
| **Tier 3 (50-74)** | Monitor | Customer data access, external API calls, financial reads | Approval for sensitive ops |
| **Tier 4 (25-49)** | Restrict | Production admin, financial writes, PII access | HITL for most operations |

### AIVSS Parameters

AIVSS (AI Vulnerability Scoring System) evaluates risk across three categories:

#### Base Security (25% weight)

| Parameter | Options |
|-----------|---------|
| **Attack Vector** | Physical (1), Local (2), Adjacent (3), Network (4) |
| **Attack Complexity** | High (1), Medium (2), Low (3) |
| **Privileges Required** | High (1), Low (2), None (3) |
| **User Interaction** | Required (1), None (2) |
| **Scope** | Unchanged (1), Changed (2) |

#### AI-Specific (45% weight)

| Parameter | Options |
|-----------|---------|
| **Model Robustness** | Low (1), Medium (2), High (3), Critical (4) |
| **Data Sensitivity** | Public (1), Internal (2), Confidential (3), Restricted (4) |
| **Ethical Impact** | Low (1), Medium (2), High (3), Critical (4) |
| **Decision Criticality** | Low (1), Medium (2), High (3), Critical (4) |
| **Adaptability** | Low (1), Medium (2), High (3), Critical (4) |

#### Impact (30% weight)

| Parameter | Options |
|-----------|---------|
| **Confidentiality Impact** | None (1), Low (2), High (3) |
| **Integrity Impact** | None (1), Low (2), High (3) |
| **Availability Impact** | None (1), Low (2), High (3) |
| **Safety Impact** | None (1), Low (2), High (3) |

### Predicted Trust Tier

As you configure AIVSS parameters, the form shows a real-time prediction:

```
Predicted Trust Tier: TIER 2
Based on current configuration
```

See **[Assess](/docs/agents/trust-lifecycle/assess)** for how AIVSS impacts Trust Score.

## Attestation

In the **Attestation** section, configure cryptographic signing for audit-grade evidence.

For now, use **AWS KMS** (recommended/default):

1. Select **AWS KMS**
2. Keep the default settings

See **[Attestation](/docs/compliance/attestation)** for how execution evidence is produced and verified.

## Goal Alignment (Goal Drift)

In the **Goal Alignment** section, configure drift detection:

1. Set the **alignment threshold** (e.g., 70%)
2. Choose what happens on drift detection:
   - **Alert Only**
   - **Constrain**
   - **Terminate**

See **[Verify](/docs/agents/trust-lifecycle/verify)** for how goal alignment and drift detection work.

## Creating the Agent

1. Review all fields
2. Ensure you've copied the API key
3. Click **Create Agent**

You'll be redirected to the new agent's detail page.

## Connecting Your Worker

Update your worker code to use the agent's API key:

```python
worker = create_openbox_worker(
    client=temporal_client,
    task_queue="my-task-queue",  # Should match your Temporal task queue
    workflows=[MyAgentWorkflow],
    activities=[my_activity],
    openbox_api_key=os.environ.get("OPENBOX_API_KEY"),  # The key you generated
)
```

The agent is matched by the API key. When your worker starts, it will appear as "Active" in the dashboard.

## Next Steps

After creating your agent:

1. **[Configure Trust Controls (Authorize)](/docs/agents/trust-lifecycle/authorize)** - Set up guardrails, policies, and behavioral rules before running your agent
2. **[Connect Your Worker](/docs/getting-started/workflow-engines/temporal)** - Configure the SDK with your API key
3. **[Monitor Sessions](/docs/agents/trust-lifecycle/monitor)** - Once running, watch your agent's activity in real-time
