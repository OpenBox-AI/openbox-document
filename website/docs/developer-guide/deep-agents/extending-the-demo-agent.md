---
title: Extending the Demo Agent
sidebar_label: Extending the Demo Agent
description: "Customize the Deep Agents demo: add tools, subagents, skills, and brand voice configuration for your use case."
llms_description: Customizing the Deep Agents demo for your use case
sidebar_position: 5
tags:
  - sdk
  - deep-agents
---

# Extending the Demo Agent

The demo content builder agent ships with a researcher subagent, web search, and image generation tools. You can add your own tools, subagents, and skills without any extra OpenBox configuration — governance automatically covers all new tool calls.

:::tip Prerequisites
This guide assumes you've completed the [Deep Agents Integration Guide](/developer-guide/deep-agents/integration-walkthrough) and have the demo running locally. See the [Demo Architecture Reference](/developer-guide/deep-agents/demo-architecture) for the full middleware lifecycle.
:::

## How the Demo Is Structured

The content builder agent uses four DeepAgents extension points — all configured through files on disk:

| Extension Point | What It Does | How the LLM Sees It |
|----------------|-------------|---------------------|
| **Memory** (`AGENTS.md`) | Brand voice, writing standards, content pillars | Loaded as persistent system context |
| **Skills** (`skills/`) | Structured workflows for content types | Activated when the task matches the skill description |
| **Tools** (Python `@tool` functions) | Capabilities like search, image generation | Available as callable functions |
| **Subagents** (`subagents.yaml`) | Delegated specialists (e.g., researcher) | Dispatched via the `task` tool |

## Project Structure

| Path | Purpose |
|------|---------|
| `content_writer.py` | Agent factory — wires up tools, subagents, skills, and OpenBox middleware |
| `AGENTS.md` | Brand voice and writing standards (loaded as memory) |
| `skills/blog-post/SKILL.md` | Blog post workflow — research, structure, image generation |
| `skills/social-media/SKILL.md` | Social media workflow — LinkedIn, Twitter/X formats |
| `subagents.yaml` | Subagent definitions — name, description, system prompt, tools |
| `.env` | API keys and configuration |
| `pyproject.toml` | Python dependencies |

## Adding a Tool

### Step 1: Define the Tool

Create a `@tool`-decorated function. LangChain uses the docstring and type hints to generate the tool schema for the LLM:

```python title="content_writer.py"
from langchain_core.tools import tool

@tool
def fetch_page(url: str) -> str:
    """Fetch the content of a web page.

    Args:
        url: The URL to fetch
    Returns:
        The page content as plain text.
    """
    import httpx
    response = httpx.get(url, follow_redirects=True, timeout=30)
    return response.text[:5000]
```

### Step 2: Register the Tool

Add it to the `create_deep_agent()` call in your agent factory:

```python title="content_writer.py"
return create_deep_agent(
    model=init_chat_model("openai:gpt-4o-mini", temperature=0),
    tools=[generate_cover, generate_social_image, fetch_page],  # Added
    # ...
)
```

### Step 3: Classify the Tool (Optional)

If you want category-level governance policies, add it to `tool_type_map`:

```python
openbox_middleware = create_openbox_middleware(
    # ...
    tool_type_map={
        "web_search": "http",
        "fetch_page": "http",  # Added — same policy as web_search
    },
)
```

This appends `{"__openbox": {"tool_type": "http"}}` to the tool's activity input, enabling Rego policies like:

```rego
result := {"decision": "REQUIRE_APPROVAL"} if {
    input.event_type == "ToolStarted"
    some item in input.activity_input
    item["__openbox"].tool_type == "http"
}
```

## Adding a Subagent

### Step 1: Define the Subagent

Add an entry to `subagents.yaml`:

```yaml title="subagents.yaml"
editor:
  description: >
    Use this to review and improve written content.
    Checks for clarity, grammar, tone consistency, and factual accuracy.
  model: openai:gpt-4o-mini
  system_prompt: |
    You are an editor. Review the content for:
    1. Clarity and readability
    2. Grammar and spelling
    3. Tone consistency with the brand voice
    4. Factual accuracy
    Read the file, make improvements, and save the edited version.
```

If the subagent needs tools, list them:

```yaml title="subagents.yaml"
fact_checker:
  description: >
    Verifies claims and statistics in content by searching for sources.
  model: openai:gpt-4o-mini
  system_prompt: |
    You are a fact checker. For each claim:
    1. Search for the original source
    2. Verify the accuracy
    3. Save a fact-check report
  tools:
    - web_search
```

### Step 2: Register the Subagent

The `load_subagents()` function in `content_writer.py` reads `subagents.yaml` automatically. Update `known_subagents` in the middleware to enable per-subagent governance:

```python title="content_writer.py"
subagent_defs = load_subagents(EXAMPLE_DIR / "subagents.yaml")
known_subagents = [s["name"] for s in subagent_defs] + ["general-purpose"]

openbox_middleware = create_openbox_middleware(
    # ...
    known_subagents=known_subagents,  # Includes your new subagent
)
```

The SDK automatically classifies `task` calls to known subagents as `a2a` and includes the subagent name in governance metadata.

## Adding a Skill

Skills are structured workflow instructions that DeepAgents activates when the user's task matches the skill description.

### Step 1: Create the Skill File

Create a directory under `skills/` with a `SKILL.md` file:

```markdown title="skills/newsletter/SKILL.md"
---
name: newsletter
description: Writes email newsletters with subject lines, preview text,
  and structured sections. Use when the user asks to write a newsletter,
  email digest, or weekly update.
---

# Newsletter Writing Skill

## Research First (Required)

Before writing, delegate research to the researcher subagent.

## Output Structure

newsletters/<slug>/
├── newsletter.md    # The newsletter content
└── subject.txt      # Subject line and preview text

## Newsletter Structure

1. Subject line (under 50 characters)
2. Preview text (under 90 characters)
3. Hero section with key insight
4. 3-4 content sections
5. Call-to-action
```

### Step 2: Register the Skill

Add the skills directory to your `create_deep_agent()` call (already configured in the demo):

```python
return create_deep_agent(
    skills=["./skills/"],  # Loads all SKILL.md files in subdirectories
    # ...
)
```

DeepAgents discovers skills by scanning the directory for `SKILL.md` files. No additional registration needed.

## Customizing Brand Voice

Edit `AGENTS.md` to change the agent's personality and writing standards. This file is loaded as persistent memory and shapes all content output:

```markdown title="AGENTS.md"
# My Company Agent

## Brand Voice
- **Technical and precise**: Write for a developer audience
- **No marketing fluff**: Facts and code examples over buzzwords

## Writing Standards
1. Include code examples in every technical post
2. Link to official documentation
3. Use American English spelling
```

## Checklist

### Adding a Tool

1. Create a `@tool`-decorated function with clear docstring and type hints
2. Add to the `tools` list in `create_deep_agent()`
3. _(Optional)_ Add to `tool_type_map` for category-level policies
4. If the tool needs API keys, add to `.env` and `.env.example`

### Adding a Subagent

1. Add entry to `subagents.yaml` with name, description, system prompt
2. If it needs tools, list them under `tools:` and ensure the tool function is in `available_tools` in `load_subagents()`
3. Verify `known_subagents` includes the new name (automatic if using `load_subagents()`)

### Adding a Skill

1. Create `skills/<name>/SKILL.md` with frontmatter (`name`, `description`)
2. Define the workflow structure and output format
3. Ensure `skills=["./skills/"]` is set in `create_deep_agent()`

## Next Steps

- **[Configuration](/developer-guide/deep-agents/configuration)** — Fine-tune timeouts, fail policies, and tool classification
- **[Error Handling](/developer-guide/deep-agents/error-handling)** — Handle governance decisions in your code
- **[Configure Trust Controls](/trust-lifecycle/authorize)** — Set up guardrails, policies, and behavioral rules
- **[Demo Architecture Reference](/developer-guide/deep-agents/demo-architecture)** — Middleware lifecycle, event flow, and subagent dispatch
