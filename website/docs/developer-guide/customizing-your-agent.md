---
title: Extending the Demo Agent
sidebar_label: Extending the Demo Agent
description: Add custom goals, native tools, and MCP tools to the OpenBox demo agent
sidebar_position: 3
---

# Extending the Demo Agent

The demo agent ships with built-in scenarios like travel booking and banking, but you can add your own goals, tools, and integrations. This guide covers the extension points in the demo repo — how to define what your agent can do, wire up the tools it needs, and register everything so the system picks it up.

OpenBox automatically governs all tool calls regardless of type. You don't need any extra configuration to get governance coverage for new goals or tools.

:::tip Prerequisites
This guide assumes you've completed [Run the Demo](/docs/getting-started/run-the-demo) or the [Temporal Integration Guide](/docs/developer-guide/temporal-integration-guide-python) and have the demo running locally. See the [Demo Architecture Reference](/docs/developer-guide/demo-architecture) for a full breakdown of signals, activities, and endpoints.
:::

## How Goals and Tools Work

A **goal** is a scenario configuration that tells the agent what it's trying to accomplish and which tools it can use. Each goal defines a system prompt, a list of available tools, and an example conversation that helps the LLM understand the expected interaction pattern.

Tools come in two types:

- **Native tools** — Custom Python functions implemented directly in the codebase. Use these for business logic specific to your application.
- **MCP tools** — External tools accessed via [Model Context Protocol](https://modelcontextprotocol.io/) servers. Use these for third-party integrations (Stripe, databases, APIs) without writing custom code.

A goal declares which tools it needs — both native and MCP. The agent follows the goal's description to orchestrate tool calls in the right order. The workflow engine automatically detects whether a tool is native or MCP and routes it accordingly.

## Project Structure

These are the key files involved when adding goals and tools:

| Path | Purpose |
|------|---------|
| `goals/` | Goal definitions, one file per category (e.g., `hr.py`, `finance.py`) |
| `goals/__init__.py` | Aggregates all goal lists into a single registry |
| `tools/` | Native tool implementations, one file per tool |
| `tools/__init__.py` | Maps tool names to handler functions via `get_handler()` |
| `tools/tool_registry.py` | Tool definitions (name, description, arguments) for the LLM |
| `models/tool_definitions.py` | Dataclass definitions for `AgentGoal`, `ToolDefinition`, `ToolArgument`, `MCPServerDefinition` |
| `shared/mcp_config.py` | Predefined MCP server configurations |
| `workflows/workflow_helpers.py` | Routing logic that distinguishes native tools from MCP tools |

## Adding a Goal

### Define the Goal

Create a new file in `goals/` (e.g., `goals/support.py`). Each goal is an `AgentGoal` instance with these fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `str` | Unique identifier, must match the value used in `AGENT_GOAL` env var |
| `category_tag` | `str` | Category for grouping (e.g., `"hr"`, `"finance"`, `"travel"`) |
| `agent_name` | `str` | User-facing name shown in the chat UI |
| `agent_friendly_description` | `str` | User-facing description of what the agent does |
| `tools` | `List[ToolDefinition]` | Native tools available to this goal |
| `description` | `str` | LLM-facing instructions listing all tools by name and purpose, in order |
| `starter_prompt` | `str` | Initial prompt given to the LLM to begin the scenario |
| `example_conversation_history` | `str` | Sample interaction showing the expected flow |
| `mcp_server_definition` | `MCPServerDefinition` | _(Optional)_ MCP server configuration for external tools |

Here's the simplest real goal in the demo — checking PTO balance, which uses a single native tool:

```python title="goals/hr.py"
from typing import List

import tools.tool_registry as tool_registry
from models.tool_definitions import AgentGoal

starter_prompt_generic = "Welcome me, give me a description of what you can do, then ask me for the details you need to do your job."

goal_hr_check_pto = AgentGoal(
    id="goal_hr_check_pto",
    category_tag="hr",
    agent_name="Check PTO Amount",
    agent_friendly_description="Check your available PTO.",
    tools=[
        tool_registry.current_pto_tool,
    ],
    description="The user wants to check their paid time off (PTO) after today's date. To assist with that goal, help the user gather args for these tools in order: "
    "1. CurrentPTO: Tell the user how much PTO they currently have ",
    starter_prompt=starter_prompt_generic,
    example_conversation_history="\n ".join(
        [
            "user: I'd like to check my time off amounts at the current time",
            "agent: Sure! I can help you out with that. May I have your email address?",
            "user: bob.johnson@emailzzz.com",
            "agent: Great! I can tell you how much PTO you currently have accrued.",
            "user_confirmed_tool_run: <user clicks confirm on CurrentPTO tool>",
            "tool_result: { 'num_hours': 400, 'num_days': 50 }",
            "agent: You have 400 hours, or 50 days, of PTO available.",
        ]
    ),
)

hr_goals: List[AgentGoal] = [goal_hr_check_pto]
```

### Register the Goal

Import your goal list in `goals/__init__.py` and extend the registry:

```python title="goals/__init__.py"
from goals.support import support_goals

goal_list.extend(support_goals)
```

Then set `AGENT_GOAL` in your `.env` file to the goal's `id`:

```bash title=".env"
AGENT_GOAL=goal_hr_check_pto
```

Restart the worker (`make run-worker`) to pick up the new value.

## Adding Native Tools

### Define the Tool

Add a `ToolDefinition` to `tools/tool_registry.py`. This tells the LLM what the tool does and what arguments it expects:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `str` | Tool name as referenced in goal descriptions |
| `description` | `str` | LLM-facing explanation of what the tool does |
| `arguments` | `List[ToolArgument]` | Input arguments (can be empty `[]`) |

Each `ToolArgument` has:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `str` | Argument name |
| `type` | `str` | Type hint (e.g., `"string"`, `"number"`, `"ISO8601"`) |
| `description` | `str` | LLM-facing explanation of the argument |

```python title="tools/tool_registry.py"
from models.tool_definitions import ToolArgument, ToolDefinition

current_pto_tool = ToolDefinition(
    name="CurrentPTO",
    description="Find how much PTO a user currently has accrued. "
    "Returns the number of hours and (calculated) number of days of PTO. ",
    arguments=[
        ToolArgument(
            name="email",
            type="string",
            description="email address of user",
        ),
    ],
)
```

### Implement the Tool

Create a file in `tools/` with a function that accepts `args: dict` and returns a `dict`. The file name and function name should match the tool name (without the `_tool` suffix):

```python title="tools/hr/current_pto.py"
import json
from pathlib import Path


def current_pto(args: dict) -> dict:
    email = args.get("email")

    file_path = (
        Path(__file__).resolve().parent.parent / "data" / "employee_pto_data.json"
    )
    if not file_path.exists():
        return {"error": "Data file not found."}

    data = json.load(open(file_path))
    employee_list = data["theCompany"]["employees"]

    for employee in employee_list:
        if employee["email"] == email:
            num_hours = int(employee["currentPTOHrs"])
            num_days = float(num_hours / 8)
            return {
                "num_hours": num_hours,
                "num_days": num_days,
            }

    return_msg = "Employee not found with email address " + email
    return {"error": return_msg}
```

The return dict should match the output format shown in the goal's `example_conversation_history`.

### Register the Handler

Two registration steps are required:

**1. Add to `tools/__init__.py`** — import the function and add a case to `get_handler()`:

```python title="tools/__init__.py"
from .hr.current_pto import current_pto

def get_handler(tool_name: str):
    if tool_name == "CurrentPTO":
        return current_pto
    # ... other tools ...
    raise ValueError(f"Unknown tool: {tool_name}")
```

**2. Add to `workflows/workflow_helpers.py`** — the `is_mcp_tool()` function in this file determines whether a tool is native or MCP. Native tools are identified by successfully looking them up in `get_handler()`. As long as your tool is registered in `tools/__init__.py`, routing works automatically.

## Adding MCP Tools

### Using a Predefined Server

The demo includes predefined MCP server configurations in `shared/mcp_config.py`. To use one, pass it as the `mcp_server_definition` in your goal:

```python title="goals/stripe_mcp.py"
from typing import List

from models.tool_definitions import AgentGoal
from shared.mcp_config import get_stripe_mcp_server_definition

starter_prompt_generic = "Welcome me, give me a description of what you can do, then ask me for the details you need to do your job."

goal_mcp_stripe = AgentGoal(
    id="goal_mcp_stripe",
    category_tag="mcp-integrations",
    agent_name="Stripe MCP Agent",
    agent_friendly_description="Manage Stripe operations via MCP",
    tools=[],  # Will be populated dynamically
    mcp_server_definition=get_stripe_mcp_server_definition(included_tools=[]),
    description="Help manage Stripe operations for customer and product data by using the customers.read and products.read tools.",
    starter_prompt="Welcome! I can help you read Stripe customer and product information.",
    example_conversation_history="\n ".join(
        [
            "agent: Welcome! I can help you read Stripe customer and product information. What would you like to do first?",
            "user: what customers are there?",
            "agent: I'll check for customers now.",
            "user_confirmed_tool_run: <user clicks confirm on customers.read tool>",
            'tool_result: { "customers": [{"id": "cus_abc", "name": "Customer A"}, {"id": "cus_xyz", "name": "Customer B"}] }',
            "agent: I found two customers: Customer A and Customer B. Can I help with anything else?",
            "user: what products exist?",
            "agent: Let me get the list of products for you.",
            "user_confirmed_tool_run: <user clicks confirm on products.read tool>",
            'tool_result: { "products": [{"id": "prod_123", "name": "Gold Plan"}, {"id": "prod_456", "name": "Silver Plan"}] }',
            "agent: I found two products: Gold Plan and Silver Plan.",
        ]
    ),
)

mcp_goals: List[AgentGoal] = [
    goal_mcp_stripe,
]
```

### Custom MCP Server

Define an `MCPServerDefinition` directly in your goal:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `str` | Identifier for the MCP server |
| `command` | `str` | Command to start the server (e.g., `"npx"`, `"python"`) |
| `args` | `List[str]` | Command-line arguments |
| `env` | `Dict[str, str]` | _(Optional)_ Environment variables for the server process |
| `connection_type` | `str` | Connection type, defaults to `"stdio"` |
| `included_tools` | `List[str]` | _(Optional)_ Specific tools to use; omit to include all |

```python title="goals/my_mcp_goal.py"
import os
from models.tool_definitions import AgentGoal, MCPServerDefinition

goal_my_mcp = AgentGoal(
    id="goal_my_mcp_integration",
    category_tag="integrations",
    agent_name="My Integration",
    agent_friendly_description="Interact with my external service.",
    tools=[],
    description="Help the user with these tools: ...",
    starter_prompt="Greet the user and help them with the integration.",
    example_conversation_history="...",
    mcp_server_definition=MCPServerDefinition(
        name="my-mcp-server",
        command="npx",
        args=["-y", "@my-org/mcp-server", f"--api-key={os.getenv('MY_API_KEY')}"],
        env=None,
        included_tools=["list_items", "create_item"],
    ),
)
```

### How MCP Tools Are Routed

MCP tools are loaded automatically when the workflow starts and converted to `ToolDefinition` objects. The `is_mcp_tool()` function in `workflows/workflow_helpers.py` distinguishes native tools from MCP tools by attempting a `get_handler()` lookup — if the lookup fails, the tool is routed to the MCP server. No additional wiring is needed.

## Tool Confirmation Patterns

The demo supports three approaches for confirming tool execution before it runs:

| Approach | How It Works | Best For |
|----------|-------------|----------|
| **UI confirmation box** | User clicks a confirm button before tool runs. Controlled by `SHOW_CONFIRM` env var. | General demo use |
| **Soft prompt** | Goal description instructs the LLM to ask for confirmation in conversation (e.g., "Are you ready to proceed?"). | Low-risk informational actions |
| **Hard confirmation argument** | Add a `userConfirmation` `ToolArgument` to the tool definition. The LLM must collect explicit user consent before calling the tool. | Sensitive or write operations |

For tools that take action or write data, use the hard confirmation pattern:

```python title="tools/tool_registry.py"
book_pto_tool = ToolDefinition(
    name="BookPTO",
    description="Book PTO start and end date. Either 1) makes calendar item, or 2) sends calendar invite to self and boss? "
    "Returns a success indicator. ",
    arguments=[
        ToolArgument(
            name="start_date",
            type="string",
            description="Start date of proposed PTO, sent in the form yyyy-mm-dd",
        ),
        ToolArgument(
            name="end_date",
            type="string",
            description="End date of proposed PTO, sent in the form yyyy-mm-dd",
        ),
        ToolArgument(
            name="email",
            type="string",
            description="Email address of user, used to look up current PTO",
        ),
        ToolArgument(
            name="userConfirmation",
            type="string",
            description="Indication of user's desire to book PTO",
        ),
    ],
)
```

## Checklist

### Adding a Goal

1. Create a goal file in `goals/` (e.g., `goals/support.py`)
2. Define the `AgentGoal` with all required fields
3. Export a list variable (e.g., `support_goals = [goal_support_ticket]`)
4. Import and extend the goal list in `goals/__init__.py`
5. Set `AGENT_GOAL` in `.env` to the goal's `id`

### Adding Native Tools

1. Define the `ToolDefinition` in `tools/tool_registry.py`
2. Implement the tool function in `tools/` (accepts `args: dict`, returns `dict`)
3. Import and add the handler to `get_handler()` in `tools/__init__.py`
4. Reference the tool in your goal's `tools` list and `description`

### Adding MCP Tools

1. Add `mcp_server_definition` to your goal (use `shared/mcp_config.py` for common servers or define a custom `MCPServerDefinition`)
2. Set any required environment variables (API keys, etc.)
3. List the MCP tools in your goal's `description` so the LLM knows about them
4. If creating reusable MCP server configs, add them to `shared/mcp_config.py`

## Next Steps

- **[SDK Configuration](/docs/developer-guide/configuration)** — Fine-tune timeouts, fail policies, and event filtering
- **[Error Handling](/docs/developer-guide/error-handling)** — Handle governance decisions in your code
- **[Configure Trust Controls](/docs/trust-lifecycle/authorize)** — Set up guardrails, policies, and behavioral rules
- **[Available Goals](/docs/developer-guide/temporal-integration-guide-python#available-goals)** — See the full list of built-in scenarios
