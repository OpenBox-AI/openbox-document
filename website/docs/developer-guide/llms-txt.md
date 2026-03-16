---
title: Working with llms.txt
description: "Help AI assistants understand your setup: Enable LLMs to read your governance policies, agent config, and documentation automatically."
llms_description: LLM-optimized plain text documentation files
sidebar_position: 8
tags:
  - reference
  - integration
---

# Working with llms.txt

OpenBox publishes its documentation in machine-readable formats following the [llms.txt specification](https://llmstxt.org/). If you're building AI agents, coding assistants, or tooling that needs to understand OpenBox, these files give you structured access to everything without scraping HTML.

## Why llms.txt Matters

Traditional documentation is designed for human consumption — rendered HTML pages filled with navigation, JavaScript-powered tabs, and collapsed sections. LLMs and AI tools work better with structured, complete text they can process directly. The llms.txt format addresses several key challenges:

- **Context optimization** — Get complete documentation in a single request, no multi-page scraping or API orchestration required
- **Accuracy** — Give your LLM authoritative source material to reference, reducing hallucinations about OpenBox concepts and APIs
- **Efficiency** — Pre-processed markdown means fewer tokens wasted on HTML artifacts, navigation chrome, and formatting noise
- **Consistency** — Every request returns the same up-to-date content, so your AI tools always work from the latest documentation

## Available Resources

| Resource | URL | Purpose |
|----------|-----|---------|
| `llms.txt` | [`/llms.txt`](pathname:///llms.txt) | Discover what's available, find the right page to fetch |
| `llms-full.txt` | [`/llms-full.txt`](pathname:///llms-full.txt) | Load the entire documentation corpus at once |
| `llms-ctx.txt` | [`/llms-ctx.txt`](pathname:///llms-ctx.txt) | Load core docs into a single LLM context window |
| `*.md` files | Append `.md` to any doc URL | Fetch a single page as plain text markdown |

### llms.txt — The Index

The [`llms.txt`](pathname:///llms.txt) file is a structured table of contents with a short description after each link, so an LLM can decide whether to fetch the full page:

```
## Core Concepts
- [Trust Scores](https://docs.openbox.ai/core-concepts/trust-scores.md): How OpenBox quantifies agent trustworthiness
- [Trust Tiers](https://docs.openbox.ai/core-concepts/trust-tiers.md): Tiered classification of agent trust levels
```

It opens with a platform summary that gives an LLM enough context to answer basic questions about OpenBox without fetching any additional pages.

### llms-full.txt — The Full Corpus

The [`llms-full.txt`](pathname:///llms-full.txt) file contains every documentation page in a single markdown file. Each section includes a source URL for attribution. All HTML, JSX, and frontmatter is stripped — what remains is clean, parseable markdown.

Use this when you want to load everything at once: populating a vector store, building a RAG pipeline, or giving an agent complete context about the platform.

### llms-ctx.txt — Context-Sized Corpus

The [`llms-ctx.txt`](pathname:///llms-ctx.txt) file packages the core documentation into a single structured file sized for an LLM context window. Use it when you want an LLM to have broad knowledge of OpenBox without fetching individual pages.

It covers Getting Started, Core Concepts, Trust Lifecycle, Developer Guide, and Dashboard. If you need the complete corpus including administration and reference material, use [`llms-full.txt`](pathname:///llms-full.txt) instead. To selectively fetch individual pages, start with [`llms.txt`](pathname:///llms.txt).

### Plain Text Markdown Files

Every documentation page is available as plain text markdown by appending `.md` to its URL:

| HTML page | Plain text |
|-----------|------------|
| `/core-concepts/trust-scores` | `/core-concepts/trust-scores.md` |
| `/developer-guide/sdk-reference` | `/developer-guide/sdk-reference.md` |

These are the files linked from `llms.txt`. This format is preferable to scraping or copying from the rendered HTML pages because:

- **Fewer tokens** — No navigation, script tags, or styling markup
- **Complete content** — Tabbed panels and collapsed sections are fully expanded in the markdown
- **Preserved structure** — Headings, lists, and tables remain intact, helping LLMs understand context and hierarchy

## Integrating with AI Tools

### IDE Assistants

Add `https://docs.openbox.ai/llms.txt` as a documentation source in Cursor, Windsurf, or any IDE tool that supports the llms.txt standard. The tool will use the index to pull relevant pages into context as you work.

### Custom Agents

For agents that need to answer questions about OpenBox:

1. Fetch [`/llms.txt`](pathname:///llms.txt) to get the index
2. Match the user's question against the link descriptions
3. Fetch the individual `.md` files for the most relevant pages

This two-step approach keeps token usage low while still giving the agent access to the full documentation when needed.

## Learn More

- [llms.txt specification](https://llmstxt.org/) — The community standard behind the format
