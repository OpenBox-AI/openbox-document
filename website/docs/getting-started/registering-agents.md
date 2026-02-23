---
title: Registering Agents
description: Create and configure new agents
sidebar_position: 2
---

# Registering Agents

Register an agent to begin governance.

## Quick Steps

1. **Log in** to the [OpenBox Dashboard](https://platform.openbox.ai)
2. Navigate to **Agents** → Click **Add Agent**
3. Configure the agent:
   - **Workflow Engine**: Temporal
   - **Agent Name**: Your agent name (e.g., "Customer Support Agent")
   - **Description**: What your agent does
   - **Teams**: Assign to one or more teams
   - **Icon**: Select an icon
4. **Generate API Key** — Click **Generate API Key**, copy and store it (shown only once)
5. Configure **Initial Risk Assessment** and **Attestation** (see details below)
6. Click **Add Agent**

:::tip
Your API key format: `obx_live_xxxxxxxxxxxx` — store it securely, you won't see it again.
:::

## Detailed Configuration

Navigate to **Agents** and click the **Add Agent** button in the top right corner.

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

### Initial Risk Assessment

Expand the **Initial Risk Assessment** section and configure your agent's risk profile parameters

#### Risk Profile Presets

Select a preset that matches your agent's intended use:

| Risk Tier | Risk Level | Risk Profile Score| Use Cases | Default Governance |
|-----------|------------|-------------|-----------|-------------------|
| **Tier 1** | Low | 0% – 24% | Read-only, public data access | Fully autonomous |
| **Tier 2** | Medium | 25% – 49% | Internal data, non-critical actions | Mostly autonomous |
| **Tier 3** | High | 50% – 74% | PII, financial data, critical actions | Approval for sensitive ops |
| **Tier 4** | Critical | 75% – 100% | System admin, destructive actions | HITL for most operations |

#### Risk Profile Parameters

The Risk Profile evaluates risk across three categories:

##### Base Security (25% weight)

| Parameter | Options |
|-----------|---------|
| **Attack Vector** | Network (1), Adjacent (2), Local (3), Physical (4) |
| **Attack Complexity** | Low (1), High (2) |
| **Privileges Required** | None (1), Low (2), High (3) |
| **User Interaction** | None (1), Required (2) |
| **Scope** | Unchanged (1), Changed (2) |

##### AI-Specific (45% weight)

| Parameter | Options |
|-----------|---------|
| **Model Robustness** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Data Sensitivity** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Ethical Impact** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Decision Criticality** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |
| **Adaptability** | Very High (1), High (2), Medium (3), Low (4), Very Low (5) |

##### Impact (30% weight)

| Parameter | Options |
|-----------|---------|
| **Confidentiality Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |
| **Integrity Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |
| **Availability Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |
| **Safety Impact** | None (1), Low (2), Medium (3), High (4), Critical (5) |

#### Predicted Risk Tier

As you configure Risk Profile parameters, the form shows a real-time prediction:

```
Predicted Risk Tier: TIER 2
Based on current configuration
```

See **[Assess](/docs/trust-lifecycle/assess)** for how the Risk Profile impacts Trust Score.

### Attestation

In the **Attestation** section, configure cryptographic signing for audit-grade evidence.

For now, use **AWS KMS** (recommended/default):

1. Select **AWS KMS**
2. Keep the default settings

See **[Attestation](/docs/administration/attestation-and-cryptographic-proof)** for how execution evidence is produced and verified.

### Creating the Agent

1. Review all fields
2. Ensure you've copied the API key
3. Click **Create Agent**

You'll be redirected to the new agent's detail page.

## Next Steps

Now that you have an agent and API key, continue with the path that fits your situation:

- **[Quick Start](/docs/getting-started/quick-start)** — New to OpenBox? Run a minimal guardrails demo to see it in action
- **[Wrap an Existing Agent](/docs/getting-started/wrap-an-existing-agent)** — Already have a Temporal agent? Add the OpenBox trust layer

