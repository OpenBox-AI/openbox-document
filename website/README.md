# OpenBox Documentation

Documentation site for [OpenBox](https://openbox.ai), built with [Docusaurus](https://docusaurus.io/).

## Prerequisites

- Node.js 18+
- npm
- [just](https://github.com/casey/just) (optional, for convenience commands)

## Local Development

```bash
cd website
npm install
npm start
```

This starts a local dev server with hot reload at `http://localhost:3000`.

## Build

```bash
cd website
npm run build
```

Or using just (from the repo root):

```bash
just build
```

### Build with local llms.txt links

To build with `llms.txt` links pointing to localhost (useful for testing):

```bash
just serve-local
```

## llms.txt

The site generates [llms.txt](https://llmstxt.org/) files during build via a custom Docusaurus plugin (`plugins/docusaurus-plugin-llms-txt`).

### Generated files

| File            | Description                                               |
| --------------- | --------------------------------------------------------- |
| `llms.txt`      | Index with categorized links and short descriptions       |
| `llms-full.txt` | Full-text concatenation of all docs                       |
| `**/*.md`       | Individual markdown files at each doc's permalink + `.md` |

### Link descriptions

Each doc page should include an `llms_description` field in its frontmatter. This provides a short phrase (4-10 words) appended to the link in `llms.txt`, helping LLMs decide relevance before fetching:

```
- [Trust Scores](https://docs.openbox.ai/core-concepts/trust-scores.md): How OpenBox quantifies agent trustworthiness
```

The plugin falls back to the standard `description` field if `llms_description` is absent.

### Frontmatter example

```yaml
---
title: Trust Scores
description: How Trust Scores are calculated and used
llms_description: How OpenBox quantifies agent trustworthiness
sidebar_position: 1
tags:
  - trust-scoring
---
```
