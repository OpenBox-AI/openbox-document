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
      className: 'sidebar-item--diff',
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
          type: 'category',
          label: 'CopilotKit',
          link: {
            type: 'doc',
            id: 'getting-started/copilotkit/index',
          },
          items: [
            'getting-started/copilotkit/run-the-demo',
            'getting-started/copilotkit/add-openbox-to-copilotkit',
          ],
        },
        {
          type: 'category',
          label: 'Claude Code',
          className: 'sidebar-item--diff',
          link: {
            type: 'doc',
            id: 'getting-started/claude-code/index',
          },
          items: [
            {
              type: 'doc',
              id: 'getting-started/claude-code/claude-code-101',
              className: 'sidebar-item--diff',
            },
            {
              type: 'doc',
              id: 'getting-started/claude-code/wrap-an-existing-session',
              className: 'sidebar-item--diff',
            },
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
          type: 'category',
          label: 'n8n',
          link: {
            type: 'doc',
            id: 'getting-started/n8n/index',
          },
          items: [
            'getting-started/n8n/n8n-101',
            'getting-started/n8n/wrap-an-existing-agent',
          ],
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
      className: 'sidebar-item--diff',
      link: {
        type: 'doc',
        id: 'core-concepts/index',
      },
      items: [
        'core-concepts/trust-scores',
        'core-concepts/trust-tiers',
        {
          type: 'doc',
          id: 'core-concepts/governance-decisions',
          className: 'sidebar-item--diff',
        },
        'core-concepts/agent-identity',
        {
          type: 'doc',
          id: 'core-concepts/agent-lineage',
          className: 'sidebar-item--diff',
        },
        {
          type: 'doc',
          id: 'core-concepts/trust-incident',
          className: 'sidebar-item--diff',
        },
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
          className: 'sidebar-item--diff',
          link: {
            type: 'doc',
            id: 'trust-lifecycle/authorize/index',
          },
          items: [
            {
              type: 'doc',
              id: 'trust-lifecycle/authorize/agent-iam-gate',
              className: 'sidebar-item--diff',
            },
            {
              type: 'doc',
              id: 'trust-lifecycle/authorize/guardrails',
              className: 'sidebar-item--diff',
            },
            'trust-lifecycle/authorize/policies',
            'trust-lifecycle/authorize/behaviors',
            {
              type: 'doc',
              id: 'trust-lifecycle/authorize/patch-and-retry',
              className: 'sidebar-item--diff',
            },
            {
              type: 'doc',
              id: 'trust-lifecycle/authorize/sandbox-execution',
              className: 'sidebar-item--diff',
            },
          ],
        },
        'trust-lifecycle/monitor',
        {
          type: 'category',
          label: 'Verify',
          className: 'sidebar-item--diff',
          link: {
            type: 'doc',
            id: 'trust-lifecycle/verify',
          },
          items: [
            'trust-lifecycle/session-replay',
            {
              type: 'doc',
              id: 'trust-lifecycle/proof-engine',
              className: 'sidebar-item--diff',
            },
            {
              type: 'doc',
              id: 'trust-lifecycle/cognitive-debugger',
              className: 'sidebar-item--diff',
            },
          ],
        },
        'trust-lifecycle/adapt',
      ],
    },
    {
      type: 'category',
      label: 'Developer Guide',
      className: 'sidebar-item--diff',
      link: {
        type: 'doc',
        id: 'developer-guide/index',
      },
      items: [
        {
          type: 'category',
          label: 'Claude Code',
          className: 'sidebar-item--diff',
          link: {
            type: 'doc',
            id: 'developer-guide/claude-code/index',
          },
          items: [
            {
              type: 'doc',
              id: 'developer-guide/claude-code/configuration',
              className: 'sidebar-item--diff',
            },
            {
              type: 'doc',
              id: 'developer-guide/claude-code/integration-walkthrough',
              className: 'sidebar-item--diff',
            },
            {
              type: 'doc',
              id: 'developer-guide/claude-code/troubleshooting',
              className: 'sidebar-item--diff',
            },
          ],
        },
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
          label: 'CopilotKit SDK (TypeScript)',
          link: {
            type: 'doc',
            id: 'developer-guide/copilotkit/index',
          },
          items: [
            'developer-guide/copilotkit/integration-walkthrough',
            'developer-guide/copilotkit/configuration',
          ],
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
            {
              type: 'doc',
              id: 'developer-guide/deep-agents/event-model',
              className: 'sidebar-item--diff',
            },
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
            {
              type: 'doc',
              id: 'developer-guide/langchain/event-model',
              className: 'sidebar-item--diff',
            },
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
            {
              type: 'doc',
              id: 'developer-guide/langgraph/event-model',
              className: 'sidebar-item--diff',
            },
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
            {
              type: 'doc',
              id: 'developer-guide/mastra/event-model',
              className: 'sidebar-item--diff',
            },
            'developer-guide/mastra/approvals-and-guardrails',
            'developer-guide/mastra/telemetry',
            'developer-guide/mastra/troubleshooting',
          ],
        },
        {
          type: 'category',
          label: 'n8n',
          link: {
            type: 'doc',
            id: 'developer-guide/n8n/index',
          },
          items: [
            'developer-guide/n8n/integration-walkthrough',
            'developer-guide/n8n/configuration',
            'developer-guide/n8n/error-handling',
            {
              type: 'doc',
              id: 'developer-guide/n8n/event-model',
              className: 'sidebar-item--diff',
            },
            'developer-guide/n8n/approvals-and-guardrails',
            'developer-guide/n8n/telemetry',
            'developer-guide/n8n/troubleshooting',
          ],
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
            {
              type: 'category',
              label: 'Governed Sandbox Commands',
              items: [
                'developer-guide/temporal-python/concept',
                'developer-guide/temporal-python/quick-start',
                {
                  type: 'category',
                  label: 'Provisioning',
                  link: {
                    type: 'doc',
                    id: 'developer-guide/temporal-python/provisioning',
                  },
                  items: [
                    'developer-guide/temporal-python/native-provider',
                  ],
                },
                'developer-guide/temporal-python/command-profiles',
                'developer-guide/temporal-python/demo-walkthrough',
                'developer-guide/temporal-python/console-evidence',
                'developer-guide/temporal-python/troubleshooting',
              ],
            },
            'developer-guide/temporal-python/customizing-the-demo',
            'developer-guide/temporal-python/demo-architecture',
          ],
        },
        'developer-guide/llms-txt',
      ],
    },
    {
      type: 'category',
      label: 'Dashboard',
      className: 'sidebar-item--diff',
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
        {
          type: 'doc',
          id: 'dashboard/inventory',
          className: 'sidebar-item--diff',
        },
        {
          type: 'doc',
          id: 'dashboard/resource-catalog',
          className: 'sidebar-item--diff',
        },
        {
          type: 'doc',
          id: 'dashboard/projects',
          className: 'sidebar-item--diff',
        },
        'dashboard/trust-overview',
        'dashboard/alerts',
      ],
    },
    'approvals/index',
    {
      type: 'category',
      label: 'Administration',
      className: 'sidebar-item--diff',
      link: {
        type: 'doc',
        id: 'administration/index',
      },
      items: [
        {
          type: 'category',
          label: 'Organization',
          className: 'sidebar-item--diff',
          link: {
            type: 'doc',
            id: 'administration/organization/index',
          },
          items: [
            {
              type: 'category',
              label: 'Teams',
              link: {
                type: 'doc',
                id: 'administration/organization/teams/index',
              },
              items: [
                {
                  type: 'doc',
                  id: 'administration/organization/teams/multi-agent-sessions',
                  label: 'Multi-Agent Sessions',
                },
              ],
            },
          ],
        },
        {
          type: 'doc',
          id: 'administration/platform-operations',
          className: 'sidebar-item--diff',
        },
        {
          type: 'doc',
          id: 'administration/identity-bridge',
          className: 'sidebar-item--diff',
        },
        {
          type: 'doc',
          id: 'administration/compliance-and-audit',
          className: 'sidebar-item--diff',
        },
        'administration/attestation-and-cryptographic-proof',
        'administration/organization-audit-log',
      ],
    },
    {
      type: 'doc',
      id: 'glossary',
      className: 'sidebar-item--diff',
    },
  ],
};

export default sidebars;
