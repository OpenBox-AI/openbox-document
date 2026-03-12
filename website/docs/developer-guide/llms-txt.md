---
title: Working with llms.txt
description: Machine-readable documentation for LLMs and AI development tools
llms_description: LLM-optimized plain text documentation files
sidebar_position: 8
tags:
  - reference
  - integration
---

# Working with llms.txt

OpenBox publishes its documentation in machine-readable formats following the [llms.txt specification](https://llmstxt.org/). If you're building AI agents, coding assistants, or tooling that needs to understand OpenBox — these files give you structured access to everything without scraping HTML.

## The Problem with HTML Docs

When an LLM reads a rendered documentation page, it has to wade through navigation chrome, JavaScript-rendered tabs, hidden content panels, and HTML formatting artifacts. This wastes context window tokens and often misses content that's collapsed or behind tab switches.

The `llms.txt` standard solves this by providing clean, pre-processed markdown at well-known URLs. The LLM gets the full content in a format it can reason over directly.

## What We Publish

OpenBox generates four resources at build time. They update automatically with every documentation change — there's no manual step to keep them in sync.

| Resource | URL | When to use |
|----------|-----|-------------|
| `llms.txt` | [`/llms.txt`](pathname:///llms.txt) | Discover what's available, find the right page |
| `llms-full.txt` | [`/llms-full.txt`](pathname:///llms-full.txt) | Ingest the entire corpus at once |
| `llms-ctx.txt` | [`/llms-ctx.txt`](pathname:///llms-ctx.txt) | Load core docs into a single LLM context window |
| `*.md` files | Append `.md` to any doc URL | Fetch a single page's content |

### llms.txt — The Index

The [`llms.txt`](pathname:///llms.txt) file is a structured table of contents for the entire documentation site. It mirrors the sidebar hierarchy and includes a short description after each link so an LLM can decide whether to fetch the full page:

```
## Core Concepts
- [Trust Scores](https://docs.openbox.ai/docs/core-concepts/trust-scores.md): How OpenBox quantifies agent trustworthiness
- [Trust Tiers](https://docs.openbox.ai/docs/core-concepts/trust-tiers.md): Tiered classification of agent trust levels
```

The file opens with a platform summary that gives an LLM enough context to answer basic questions about OpenBox without fetching any additional pages.

### llms-full.txt — The Full Corpus

The [`llms-full.txt`](pathname:///llms-full.txt) file concatenates every documentation page into a single markdown file. Each section includes a source URL for attribution. All HTML, JSX, and frontmatter is stripped — what remains is clean, parseable markdown.

This is the right choice when you want to load everything at once: populating a vector store, building a RAG pipeline, or giving an agent complete context about the platform.

### llms-ctx.txt — Context-Sized Corpus

The [`llms-ctx.txt`](pathname:///llms-ctx.txt) file contains the core documentation in a structured XML format designed for single-shot loading into an LLM context window. It follows the [reference implementation](https://github.com/AnswerDotAI/llms-txt) format:

```xml
<Project title="OpenBox" summary="AI agent governance platform...">
  <info>Product description paragraph...</info>
  <Getting_Started>
    <Doc title="Getting Started" url="https://docs.openbox.ai/docs/getting-started">
      [full markdown content]
    </Doc>
  </Getting_Started>
</Project>
```

Each sidebar section becomes a semantic XML tag containing `<Doc>` elements with the page's full markdown content. Optional sections (Administration, Approvals, Glossary) are excluded to keep the file within typical context window limits. If you need everything, use `llms-full.txt` instead.

### Individual .md Files

Every documentation page is available as standalone markdown by appending `.md` to its URL:

| HTML page | Plain text |
|-----------|------------|
| `/docs/core-concepts/trust-scores` | `/docs/core-concepts/trust-scores.md` |
| `/docs/developer-guide/sdk-reference` | `/docs/developer-guide/sdk-reference.md` |

These are the files linked from `llms.txt`. They're useful when an LLM only needs one or two pages rather than the full corpus. Compared to the rendered HTML:

- **Fewer tokens** — No navigation, no script tags, no styling markup
- **Complete content** — Tabbed panels and collapsed sections are fully expanded
- **Preserved structure** — Headings, lists, and tables remain intact as markdown

## Integrating with AI Tools

### IDE Assistants

Add `https://docs.openbox.ai/llms.txt` as a documentation source in Cursor, Windsurf, or any IDE tool that supports the `llms.txt` standard. The tool will use the index to pull relevant pages into context as you work.

### Custom Agents

For agents that need to answer questions about OpenBox:

1. Fetch `/llms.txt` to get the index
2. Match the user's question against the link descriptions
3. Fetch the individual `.md` files for the most relevant pages

This two-step approach keeps token usage low while still giving the agent access to the full documentation when it needs it.

### RAG and Vector Stores

Use `/llms-full.txt` as an ingestion source. The markdown sections are already chunked by page with clear heading boundaries, making them straightforward to split for embedding.

## Learn More

- [llms.txt specification](https://llmstxt.org/) — The community standard behind the format
