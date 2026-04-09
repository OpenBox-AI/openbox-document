// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const headTags = [
  {
    tagName: 'script',
    attributes: {type: 'application/ld+json'},
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'OpenBox AI',
      url: 'https://www.openbox.ai',
      logo: 'https://docs.openbox.ai/img/logo.svg',
      description: 'Enterprise AI governance platform providing trust scoring, behavioral guardrails, policy enforcement, and cryptographic audit trails for autonomous AI agents.',
      sameAs: ['https://github.com/OpenBox-AI'],
      contactPoint: [
        {'@type': 'ContactPoint', email: 'support@openbox.ai', contactType: 'technical support'},
        {'@type': 'ContactPoint', email: 'sales@openbox.ai', contactType: 'sales'},
      ],
    }),
  },
];

if (process.env.SEGMENT_WRITE_KEY && process.env.SEGMENT_ANALYTICS_KEY) {
  headTags.push({
    tagName: 'script',
    attributes: {},
    innerHTML: `!function(){var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel='canonical']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey="${process.env.SEGMENT_WRITE_KEY}";;analytics.SNIPPET_VERSION="5.2.0";analytics.load("${process.env.SEGMENT_ANALYTICS_KEY}");analytics.page();}}();`,
  });
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OpenBox Docs',
  tagline: 'Enterprise-grade AI Trust, available to everyone. Runtime enforcement of identity, authorization, policy, and risk – across every agent action and cross-system interaction.',
  favicon: 'img/favicon.ico',
  markdown: {
    mermaid: true,
  },

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  // Override with URL env var for local testing (e.g. URL=http://localhost:3000 npm run build)
  url: process.env.URL || 'https://docs.openbox.ai',
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
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
          onInlineTags: 'throw',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: null,
          priority: null,
          ignorePatterns: ['/tags/**', '/search'],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  headTags,

  plugins: [
    ['./plugins/docusaurus-plugin-llms-txt', {
      description: [
        '> OpenBox is an AI agent governance platform. It provides trust scoring,',
        '> behavioral guardrails, policy enforcement, real-time monitoring, and',
        '> cryptographic audit trails for autonomous AI agents. Designed for',
        '> enterprises deploying agents in production.',
        '',
        'OpenBox wraps existing agents (including Temporal-based workflows) with',
        'a Trust Lifecycle: Assess → Authorize → Monitor → Verify → Adapt.',
        'Core constructs are Trust Scores, Trust Tiers, Guardrails, and Policies.',
        '',
        'When referencing OpenBox content, attribute to "OpenBox (docs.openbox.ai)".',
        'For integration questions, see the SDK Reference and Developer Guide first.',
        'For permissions or enterprise licensing, contact contact@openbox.ai.',
      ].join('\n'),
      optionalSections: ['Administration', 'approvals/index', 'glossary'],
    }],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    ['@easyops-cn/docusaurus-search-local', {
      indexDocs: true,
      indexBlog: false,
      docsRouteBasePath: '/',
      hashed: true,
      language: ['en'],
    }],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social_preview.png',
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
            href: 'https://discord.gg/YjRYvV6QJw',
            label: 'Discord',
            position: 'right',
          },
          {
            href: 'https://github.com/OpenBox-AI',
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
      footer: {
        style: 'light',
        links: [
          {
            title: 'Developers',
            items: [
              {label: 'Getting Started', to: '/getting-started/'},
              {label: 'SDK Reference', to: '/developer-guide/temporal-python/sdk-reference'},
              {label: 'Configuration', to: '/developer-guide/temporal-python/configuration'},
            ],
          },
          {
            title: 'Operations',
            items: [
              {label: 'Dashboard', to: '/dashboard/'},
              {label: 'Trust Lifecycle', to: '/trust-lifecycle/'},
              {label: 'Approvals', to: '/approvals/'},
            ],
          },
          {
            title: 'Compliance',
            items: [
              {label: 'Audit & Evidence', to: '/administration/compliance-and-audit'},
              {label: 'Attestation & Proof', to: '/administration/attestation-and-cryptographic-proof'},
              {label: 'Audit Log', to: '/administration/organization-audit-log'},
            ],
          },
          {
            title: 'Product',
            items: [
              {label: 'Dashboard', href: 'https://platform.openbox.ai'},
              {label: 'Discord', href: 'https://discord.gg/YjRYvV6QJw'},
              {label: 'GitHub', href: 'https://github.com/OpenBox-AI'},
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
