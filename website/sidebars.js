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
      collapsed: false,
      items: [
        'getting-started/index',
        'getting-started/quick-start',
        {
          type: 'category',
          label: 'Workflow Engines',
          items: [
            'getting-started/workflow-engines/temporal',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      collapsed: true,
      items: [
        'concepts/trust-scores',
        'concepts/trust-tiers',
        'concepts/event-types',
        'concepts/governance-decisions',
      ],
    },
    {
      type: 'category',
      label: 'Dashboard',
      items: [
        'dashboard/index',
        'dashboard/trust-overview',
        'dashboard/alerts',
      ],
    },
    {
      type: 'category',
      label: 'Agents',
      collapsed: false,
      items: [
        'agents/index',
        'agents/registering-agents',
        'agents/overview',
        {
          type: 'category',
          label: 'Trust Lifecycle',
          collapsed: false,
          items: [
            'agents/trust-lifecycle/index',
            'agents/trust-lifecycle/assess',
            'agents/trust-lifecycle/authorize',
            'agents/trust-lifecycle/monitor',
            {
              type: 'category',
              label: 'Verify',
              link: {
                type: 'doc',
                id: 'agents/trust-lifecycle/verify',
              },
              items: [
                'agents/trust-lifecycle/session-replay',
              ],
            },
            'agents/trust-lifecycle/adapt',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Approvals',
      items: [
        'approvals/index',
      ],
    },
    {
      type: 'category',
      label: 'Organization',
      items: [
        'organization/index',
        'organization/audit-log',
      ],
    },
    {
      type: 'category',
      label: 'Compliance',
      items: [
        'compliance/index',
        'compliance/attestation',
      ],
    },
    {
      type: 'category',
      label: 'SDK',
      items: [
        'sdk/index',
        'sdk/configuration',
        'sdk/error-handling',
      ],
    },
  ],
};

export default sidebars;
