// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OpenBox Docs',
  tagline: 'Attest every agent action, input, and output so behavior is provable, auditable, and defensible by default.',
  favicon: 'img/favicon.ico',

  markdown: {
    mermaid: true,
  },

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.openbox.ai',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'openbox',
  projectName: 'openbox-docs',

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
          onInlineTags: 'throw',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
    {tagName: 'link', attributes: {rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap'}},
  ],

  themes: ['@docusaurus/theme-mermaid', '@easyops-cn/docusaurus-search-local'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
        disableSwitch: false,
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: 'Docs',
        logo: {
          alt: 'OpenBox Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            label: 'Docs',
            position: 'left',
            className: 'navbar-docs-link-mobile-only',
          },
          {
            href: 'https://www.openbox.ai/#waitlist',
            label: 'Get Access',
            position: 'right',
          },
          {
            href: 'https://github.com/OpenBox-AI/openbox-temporal-sdk-python',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://platform.openbox.ai',
            label: 'Dashboard',
            position: 'right',
            className: 'navbar-dashboard-link',
          },
          {type: 'search', position: 'right'},
        ],
      },
      searchLocal: {
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        hashed: true,
        language: ['en'],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Developers',
            items: [
              {label: 'Getting Started', to: '/docs/getting-started/'},
              {label: 'SDK Reference', to: '/docs/developer-guide/sdk-reference'},
              {label: 'Configuration', to: '/docs/developer-guide/configuration'},
            ],
          },
          {
            title: 'Operations',
            items: [
              {label: 'Dashboard', to: '/docs/dashboard/'},
              {label: 'Trust Lifecycle', to: '/docs/trust-lifecycle/'},
              {label: 'Approvals', to: '/docs/approvals/'},
            ],
          },
          {
            title: 'Compliance',
            items: [
              {label: 'Audit & Evidence', to: '/docs/administration/compliance-and-audit'},
              {label: 'Attestation & Proof', to: '/docs/administration/attestation-and-cryptographic-proof'},
              {label: 'Audit Log', to: '/docs/administration/organization-audit-log'},
            ],
          },
          {
            title: 'Product',
            items: [
              {label: 'Get Access', href: 'https://www.openbox.ai/#waitlist'},
              {label: 'Dashboard', href: 'https://platform.openbox.ai'},
              {label: 'GitHub', href: 'https://github.com/OpenBox-AI/openbox-temporal-sdk-python'},
            ],
          },
        ],
        copyright: `<div class="footer__copyright-inner"><span>© ${new Date().getFullYear()} OpenBox AI. All rights reserved.</span><span class="footer__legal-links"><a href="https://www.openbox.ai/t-c/terms" target="_blank" rel="noopener noreferrer">Terms</a><a href="https://www.openbox.ai/t-c/privacy" target="_blank" rel="noopener noreferrer">Privacy</a><a href="https://www.openbox.ai/t-c/cookies-policy" target="_blank" rel="noopener noreferrer">Cookie Policy</a></span></div>`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
