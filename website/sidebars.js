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
          type: 'doc',
          id: 'getting-started/crewai/index',
          label: 'CrewAI',
        },
        {
          type: 'doc',
          id: 'getting-started/cursor/index',
          label: 'Cursor',
        },
        {
          type: 'doc',
          id: 'getting-started/deep-agents/index',
          label: 'Deep Agents',
        },
        {
          type: 'doc',
          id: 'getting-started/langchain/index',
          label: 'LangChain',
        },
        {
          type: 'doc',
          id: 'getting-started/langgraph/index',
          label: 'LangGraph',
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
          type: 'doc',
          id: 'developer-guide/crewai/index',
          label: 'CrewAI',
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
            'developer-guide/deep-agents/configuration',
            'developer-guide/deep-agents/error-handling',
          ],
        },
        {
          type: 'doc',
          id: 'developer-guide/langchain/index',
          label: 'LangChain SDK (TypeScript)',
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
          label: 'Temporal SDK (Python)',
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
