# OpenBox Documentation

[docs.openbox.ai](https://docs.openbox.ai) | [Platform Dashboard](https://platform.openbox.ai) | [GitHub](https://github.com/OpenBox-AI)

Documentation for [OpenBox](https://www.openbox.ai) — an enterprise AI governance platform that adds trust scoring, behavioral guardrails, policy enforcement, and cryptographic audit trails to autonomous AI agents.

## What's Inside

- **Getting Started** — environment setup, quickstart demo, and first integration
- **Trust Lifecycle** — the 5-phase trust loop: Assess, Authorize, Monitor, Verify, Adapt
- **Core Concepts** — trust scores, trust tiers, guardrails, policies, and behavioral rules
- **Developer Guide** — SDK reference, configuration, and integration walkthroughs
- **Dashboard** — platform UI for agents, sessions, approvals, and audit logs
- **Administration** — compliance evidence, cryptographic attestation, and organization settings

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- npm
- [just](https://github.com/casey/just) (optional, for convenience commands)

### Run the dev server

```bash
cd website
npm install
npm start
```

Opens at [http://localhost:3000](http://localhost:3000) with hot reload.

### Production build

```bash
just build
```

Or manually:

```bash
cd website
npm run build
```

### Build and serve with local llms.txt links

```bash
just serve-local
```

## llms.txt

The site generates [llms.txt](https://llmstxt.org/) files during build via a custom Docusaurus plugin. Each doc page can include an `llms_description` frontmatter field (4-10 words) to provide a short summary used in `llms.txt` link descriptions.

Generated files:

| File | Description |
|------|-------------|
| `llms.txt` | Index with categorized links and short descriptions |
| `llms-full.txt` | Full-text concatenation of all docs |
| `**/*.md` | Individual markdown files at each doc's permalink |

## Contributing

1. Create a branch from `develop`
2. Make your changes in `website/docs/`
3. Verify the build passes: `just build`
4. Open a pull request against `develop`

## License

[MIT](LICENSE)
