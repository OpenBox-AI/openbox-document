---
title: Extending the Demo Agent
sidebar_label: Extending the Demo Agent
description: "Customize the LangChain Python demo: add tools, subagent patterns, skills, and brand voice configuration for your use case."
llms_description: Customizing the LangChain Python demo for your use case
sidebar_position: 5
tags:
  - sdk
  - langchain
  - python
---

# Extending the Demo Agent

The demo content builder agent ships with a researcher subagent, web search, file I/O, and image generation tools. You can add your own tools, subagents, and skills without any extra OpenBox configuration — governance automatically covers all new tool calls.

:::tip Prerequisites
This guide assumes you've completed the [LangChain Integration Guide](/developer-guide/langchain-python/integration-walkthrough) and have the demo running locally. See the [Demo Architecture Reference](/developer-guide/langchain-python/demo-architecture) for the full middleware lifecycle.
:::

## How the Demo Is Structured

The content builder agent uses files on disk for configuration — memory (brand voice), skills (workflows), and subagent definitions:

| Extension Point | What It Does | How the LLM Sees It |
|----------------|-------------|---------------------|
| **Memory** (`AGENTS.md`) | Brand voice, writing standards, content pillars | Loaded into system prompt as persistent context |
| **Skills** (`skills/`) | Structured workflows for content types | Appended to system prompt when loaded |
| **Tools** (Python `@tool` functions) | Capabilities like search, image generation | Available as callable functions |
| **Subagents** (`subagents.yaml`) | Delegated specialists (e.g., researcher) | Wrapped as `@tool` functions, invoked like any tool |

## Project Structure

| Path | Purpose |
|------|---------|
| `content_writer.py` | Agent factory — wires up tools, system prompt, and OpenBox middleware |
| `AGENTS.md` | Brand voice and writing standards (loaded into system prompt) |
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

Add it to the `create_agent()` call in your agent factory:

```python title="content_writer.py"
agent = create_agent(
    model=model,
    tools=[research, write_file, read_file, generate_cover, generate_social_image, fetch_page],  # Added
    system_prompt=system_prompt,
    middleware=[middleware],
)
```

### Step 3: Classify the Tool (Optional)

If you want category-level governance policies, add it to `tool_type_map`:

```python
middleware = create_openbox_langchain_middleware(
    # ...
    tool_type_map={
        "web_search": "http",
        "fetch_page": "http",  # Added — same policy as web_search
    },
)
```

This sets `tool_type: "http"` in the `ToolStarted` event, enabling Rego policies like:

```rego
result := {"decision": "REQUIRE_APPROVAL"} if {
    input.event_type == "ToolStarted"
    input.tool_type == "http"
}
```

## Adding a Subagent

In LangChain, subagents are implemented as `@tool`-decorated functions that spawn a separate agent internally.

### Step 1: Define the Subagent Config

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

### Step 2: Implement the Tool Wrapper

Create a function that spawns the subagent and a `@tool` wrapper:

```python title="content_writer.py"
def run_editor(file_path: str) -> str:
    """Create and run the editor subagent."""
    config = load_subagent_config(EXAMPLE_DIR / "subagents.yaml")
    editor_spec = config.get("editor", {})

    model = init_chat_model(editor_spec.get("model", "openai:gpt-4o-mini"))
    editor = create_agent(
        model=model,
        tools=[read_file, write_file],
        system_prompt=editor_spec.get("system_prompt"),
    )
    result = editor.invoke({"messages": [("user", f"Edit the file at {file_path}")]})
    return "Editing complete."

@tool
def edit_content(file_path: str) -> str:
    """Delegate content editing to the editor subagent.

    Args:
        file_path: Path to the file to edit (e.g., 'blogs/my-post/post.md')
    """
    return run_editor(file_path)
```

### Step 3: Register the Tool

Add the wrapper to your agent's tools list:

```python
agent = create_agent(
    model=model,
    tools=[research, write_file, read_file, generate_cover, generate_social_image, edit_content],  # Added
    system_prompt=system_prompt,
    middleware=[middleware],
)
```

The `edit_content` tool is governed by OpenBox like any other tool. The subagent it spawns internally runs without governance unless you add middleware to that agent too.

## Adding a Skill

Skills are structured workflow instructions loaded into the system prompt.

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

### Step 2: Load Skills into System Prompt

The demo's `load_skills()` function scans for `SKILL.md` files automatically:

```python
def load_skills(skills_dir: Path) -> str:
    """Load all SKILL.md files and return their combined content."""
    skills_text = []
    for skill_file in sorted(skills_dir.rglob("SKILL.md")):
        skills_text.append(skill_file.read_text())
    return "\n\n---\n\n".join(skills_text)
```

New skills in `skills/` are discovered automatically — no registration needed.

## Customizing Brand Voice

Edit `AGENTS.md` to change the agent's personality and writing standards. This file is loaded into the system prompt and shapes all content output:

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
2. Add to the `tools` list in `create_agent()`
3. _(Optional)_ Add to `tool_type_map` for category-level policies
4. If the tool needs API keys, add to `.env`

### Adding a Subagent

1. Add entry to `subagents.yaml` with name, description, system prompt
2. Implement a runner function that spawns a `create_agent()` with tools
3. Create a `@tool`-decorated wrapper that calls the runner
4. Add the wrapper tool to `create_agent()`

### Adding a Skill

1. Create `skills/<name>/SKILL.md` with frontmatter (`name`, `description`)
2. Define the workflow structure and output format
3. Ensure `load_skills()` is called in the system prompt builder

## Next Steps

- **[Configuration](/developer-guide/langchain-python/configuration)** — Fine-tune timeouts, fail policies, and tool classification
- **[Error Handling](/developer-guide/langchain-python/error-handling)** — Handle governance decisions in your code
- **[Configure Trust Controls](/trust-lifecycle/authorize)** — Set up guardrails, policies, and behavioral rules
- **[Demo Architecture Reference](/developer-guide/langchain-python/demo-architecture)** — Middleware lifecycle, event flow, and OTel instrumentation
