// @ts-check

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  docs: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      link: {
        type: 'doc',
        id: 'getting-started/index',
      },
      items: [
        {
          type: 'category',
          label: 'CrewAI',
          link: {
            type: 'doc',
            id: 'getting-started/crewai/index',
          },
          items: [
            'getting-started/crewai/run-the-demo',
            'getting-started/crewai/wrap-an-existing-agent',
          ],
        },
        {
          type: 'doc',
          id: 'getting-started/cursor/index',
          label: 'Cursor',
        },
        {
          type: 'category',
          label: 'Deep Agents',
          link: {
            type: 'doc',
            id: 'getting-started/deep-agents/index',
          },
          items: [
            'getting-started/deep-agents/deep-agents-101',
            'getting-started/deep-agents/wrap-an-existing-agent',
          ],
        },
        {
          type: 'category',
          label: 'LangChain',
          link: {
            type: 'doc',
            id: 'getting-started/langchain/index',
          },
          items: [
            'getting-started/langchain/langchain-101',
            'getting-started/langchain/wrap-an-existing-agent',
          ],
        },
        {
          type: 'category',
          label: 'LangGraph',
          link: {
            type: 'doc',
            id: 'getting-started/langgraph/index',
          },
          items: [
            'getting-started/langgraph/langgraph-101',
            'getting-started/langgraph/wrap-an-existing-agent',
          ],
        },
        {
          type: 'category',
          label: 'Mastra',
          link: {
            type: 'doc',
            id: 'getting-started/mastra/index',
          },
          items: [
            'getting-started/mastra/mastra-101',
            'getting-started/mastra/run-the-demo',
            'getting-started/mastra/wrap-an-existing-agent',
          ],
        },
        {
          type: 'doc',
          id: 'getting-started/n8n/index',
          label: 'n8n',
        },
        {
          type: 'doc',
          id: 'getting-started/openclaw/index',
          label: 'OpenClaw',
        },
        {
          type: 'category',
          label: 'Temporal',
          link: {
            type: 'doc',
            id: 'getting-started/temporal/index',
          },
          items: [
            'getting-started/temporal/temporal-101',
            'getting-started/temporal/run-the-demo',
            'getting-started/temporal/wrap-an-existing-agent',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: true,
      link: {
        type: 'doc',
        id: 'core-concepts/index',
      },
      items: [
        'core-concepts/trust-scores',
        'core-concepts/trust-tiers',
        'core-concepts/governance-decisions',
        'core-concepts/agent-identity',
      ],
    },
    {
      type: 'category',
      label: 'Trust Lifecycle',
      link: {
        type: 'doc',
        id: 'trust-lifecycle/index',
      },
      items: [
        'trust-lifecycle/overview',
        'trust-lifecycle/assess',
        {
          type: 'category',
          label: 'Authorize',
          link: {
            type: 'doc',
            id: 'trust-lifecycle/authorize/index',
          },
          items: [
            'trust-lifecycle/authorize/guardrails',
            'trust-lifecycle/authorize/policies',
            'trust-lifecycle/authorize/behaviors',
          ],
        },
        'trust-lifecycle/monitor',
        {
          type: 'category',
          label: 'Verify',
          link: {
            type: 'doc',
            id: 'trust-lifecycle/verify',
          },
          items: [
            'trust-lifecycle/session-replay',
          ],
        },
        'trust-lifecycle/adapt',
      ],
    },
    {
      type: 'category',
      label: 'Developer Guide',
      link: {
        type: 'doc',
        id: 'developer-guide/index',
      },
      items: [
        {
          type: 'category',
          label: 'CrewAI SDK (Python)',
          link: {
            type: 'doc',
            id: 'developer-guide/crewai/sdk-reference',
          },
          items: [
            'developer-guide/crewai/configuration',
            'developer-guide/crewai/integration-walkthrough',
            'developer-guide/crewai/approvals-and-guardrails',
            'developer-guide/crewai/telemetry',
            'developer-guide/crewai/troubleshooting',
          ],
        },
        {
          type: 'doc',
          id: 'developer-guide/cursor/index',
          label: 'Cursor',
        },
        {
          type: 'category',
          label: 'Deep Agents SDK (Python)',
          link: {
            type: 'doc',
            id: 'developer-guide/deep-agents/index',
          },
          items: [
            'developer-guide/deep-agents/integration-walkthrough',
            'developer-guide/deep-agents/configuration',
            'developer-guide/deep-agents/error-handling',
            'developer-guide/deep-agents/event-model',
            'developer-guide/deep-agents/approvals-and-guardrails',
            'developer-guide/deep-agents/telemetry',
            'developer-guide/deep-agents/extending-the-demo-agent',
            'developer-guide/deep-agents/demo-architecture',
            'developer-guide/deep-agents/troubleshooting',
          ],
        },
        {
          type: 'category',
          label: 'LangChain SDK (Python)',
          link: {
            type: 'doc',
            id: 'developer-guide/langchain/sdk-reference',
          },
          items: [
            'developer-guide/langchain/integration-walkthrough',
            'developer-guide/langchain/configuration',
            'developer-guide/langchain/error-handling',
            'developer-guide/langchain/event-model',
            'developer-guide/langchain/approvals-and-guardrails',
            'developer-guide/langchain/telemetry',
            'developer-guide/langchain/troubleshooting',
          ],
        },
        {
          type: 'category',
          label: 'LangGraph SDK (Python)',
          link: {
            type: 'doc',
            id: 'developer-guide/langgraph/index',
          },
          items: [
            'developer-guide/langgraph/configuration',
            'developer-guide/langgraph/error-handling',
            'developer-guide/langgraph/integration-walkthrough',
            'developer-guide/langgraph/event-model',
            'developer-guide/langgraph/approvals-and-guardrails',
            'developer-guide/langgraph/telemetry',
            'developer-guide/langgraph/troubleshooting',
          ],
        },
        {
          type: 'category',
          label: 'Mastra SDK (TypeScript)',
          link: {
            type: 'doc',
            id: 'developer-guide/mastra/sdk-reference',
          },
          items: [
            'developer-guide/mastra/configuration',
            'developer-guide/mastra/error-handling',
            'developer-guide/mastra/integration-walkthrough',
            'developer-guide/mastra/event-model',
            'developer-guide/mastra/approvals-and-guardrails',
            'developer-guide/mastra/telemetry',
            'developer-guide/mastra/troubleshooting',
          ],
        },
        {
          type: 'doc',
          id: 'developer-guide/n8n/index',
          label: 'n8n',
        },
        {
          type: 'doc',
          id: 'developer-guide/openclaw/index',
          label: 'OpenClaw',
        },
        {
          type: 'category',
          label: 'Temporal Plugin (Python)',
          link: {
            type: 'doc',
            id: 'developer-guide/temporal-python/sdk-reference',
          },
          items: [
            'developer-guide/temporal-python/configuration',
            'developer-guide/temporal-python/error-handling',
            'developer-guide/temporal-python/integration-walkthrough',
            'developer-guide/temporal-python/customizing-the-demo',
            'developer-guide/temporal-python/demo-architecture',
            'developer-guide/temporal-python/troubleshooting',
          ],
        },
        'developer-guide/event-types',
        'developer-guide/llms-txt',
      ],
    },
    {
      type: 'category',
      label: 'Dashboard',
      link: {
        type: 'doc',
        id: 'dashboard/index',
      },
      items: [
        {
          type: 'category',
          label: 'Agents',
          link: {
            type: 'doc',
            id: 'dashboard/agents/index',
          },
          items: [
            'dashboard/agents/registering-agents',
            'dashboard/agents/agent-settings',
          ],
        },
        'dashboard/trust-overview',
        'dashboard/alerts',
      ],
    },
    'approvals/index',
    {
      type: 'category',
      label: 'Administration',
      link: {
        type: 'doc',
        id: 'administration/index',
      },
      items: [
        'administration/organization',
        'administration/compliance-and-audit',
        'administration/attestation-and-cryptographic-proof',
        'administration/organization-audit-log',
      ],
    },
    'glossary',
  ],
};

export default sidebars;
