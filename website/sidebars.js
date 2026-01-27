// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

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
  tutorialSidebar: [
    {
      type: 'category',
      label: 'OpenBox Docs',
      link: {type: 'doc', id: 'openbox/intro'},
      items: [
        'openbox/openbox-core',
        'openbox/openbox-backend',
        'openbox/openbox-guardrails',
        'openbox/openbox-fe',
        'openbox/opa-app',
        'openbox/temporal',
      ],
    },
    {
      type: 'category',
      label: 'openbox-v2',
      link: {
        type: 'generated-index',
        title: 'openbox-v2',
        slug: '/openbox-v2',
      },
      items: [
        'openbox-v2/plan',
        'openbox-v2/openbox-v1.1',
        'openbox-v2/openbox-v1.1-technical-spec',
        'openbox-v2/glossary-v1.1',
        'openbox-v2/krnl-cluster',
      ],
    },
  ],
};

export default sidebars;
