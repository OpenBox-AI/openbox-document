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
| **n8n** | Coming soon |
| **LangChain** | Coming soon |

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

Expand the **Initial Risk Assessment** section and configure your agent's risk profile parameters

### Risk Profile Presets

Select a preset that matches your agent's intended use:

| Risk Tier | Risk Level | Risk Profile Score| Use Cases | Default Governance |
|-----------|------------|-------------|-----------|-------------------|
| **Tier 1** | Low | 0% – 24% | Read-only, public data access | Fully autonomous |
| **Tier 2** | Medium | 25% – 49% | Internal data, non-critical actions | Mostly autonomous |
| **Tier 3** | High | 50% – 74% | PII, financial data, critical actions | Approval for sensitive ops |
| **Tier 4** | Critical | 75% – 100% | System admin, destructive actions | HITL for most operations |

### Risk Profile Parameters

The Risk Profile evaluates risk across three categories:

#### Base Security (25% weight)

| Parameter | Options |
|-----------|---------|
| **Attack Vector** | Network (1), Adjacent (2), Local (3), Physical (4) |
| **Attack Complexity** | Low (1), High (2) |
| **Privileges Required** | None (1), Low (2), High (3) |
| **User Interaction** | None (1), Required (2) |
| **Scope** | Unchanged (1), Changed (2) |

#### AI-Specific (45% weight)

| Parameter | Options |
|-----------|---------|
| **Model Robustness** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Data Sensitivity** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Ethical Impact** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Decision Criticality** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Adaptability** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |

#### Impact (30% weight)

| Parameter | Options |
|-----------|---------|
| **Confidentiality Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |
| **Integrity Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |
| **Availability Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |
| **Safety Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |

### Predicted Risk Tier

As you configure Risk Profile parameters, the form shows a real-time prediction:

```
Predicted Risk Tier: TIER 2
Based on current configuration
```

See **[Assess](/docs/agents/trust-lifecycle/assess)** for how the Risk Profile impacts Trust Score.

## Attestation

In the **Attestation** section, configure cryptographic signing for audit-grade evidence.

For now, use **AWS KMS** (recommended/default):

1. Select **AWS KMS**
2. Keep the default settings

See **[Attestation](/docs/compliance/attestation)** for how execution evidence is produced and verified.

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

1. **[Trust Overview](/docs/dashboard/trust-overview)** - See your agent's trust score on the dashboard
2. **[View Alerts](/docs/dashboard/alerts)** - Monitor alerts for your agents
3. **[Set Up Approvals](/docs/approvals)** - Add human-in-the-loop for sensitive operations

