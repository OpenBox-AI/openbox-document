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
        'agents/registering-agents',
        'getting-started/quick-start',
        'getting-started/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: true,
      items: [
        'concepts/trust-scores',
        'concepts/trust-tiers',
        'concepts/governance-decisions',
      ],
    },
    {
      type: 'category',
      label: 'Trust Lifecycle',
      collapsed: false,
      items: [
        'agents/trust-lifecycle/index',
        'agents/overview',
        'agents/trust-lifecycle/assess',
        'agents/trust-lifecycle/authorize',
        'agents/trust-lifecycle/monitor',
        'agents/trust-lifecycle/verify',
        'agents/trust-lifecycle/adapt',
      ],
    },
    {
      type: 'category',
      label: 'Developer Guide',
      items: [
        'sdk/index',
        'getting-started/workflow-engines/temporal',
        'sdk/configuration',
        'sdk/error-handling',
        'concepts/event-types',
      ],
    },
    {
      type: 'category',
      label: 'Dashboard',
      items: [
        'dashboard/index',
        'agents/index',
        'dashboard/trust-overview',
        'dashboard/alerts',
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
      label: 'Administration',
      items: [
        'organization/index',
        'compliance/index',
        'compliance/attestation',
        'organization/audit-log',
      ],
    },
  ],
};

export default sidebars;
