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
        'getting-started/temporal-101',
        'getting-started/run-the-demo',
        'getting-started/wrap-an-existing-agent',
        'getting-started/troubleshooting',
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
        'developer-guide/sdk-reference',
        'developer-guide/temporal-integration-guide-python',
        'developer-guide/customizing-your-agent',
        'developer-guide/configuration',
        'developer-guide/error-handling',
        'developer-guide/event-types',
        'developer-guide/demo-architecture',
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
