---
title: Troubleshooting
description: Common issues and solutions when setting up OpenBox
sidebar_position: 3
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Troubleshooting

Common issues and solutions when integrating with OpenBox.

---

## Worker Not Connecting to OpenBox

Check that your environment variables are set:

```bash
echo $OPENBOX_URL
# Should print https://core.openbox.ai

echo $OPENBOX_API_KEY
# Should print your OpenBox API key
```

Verify step by step:

1. Confirm `OPENBOX_URL` and `OPENBOX_API_KEY` are set in the worker environment
2. Start the worker and check logs for OpenBox initialization errors
3. Trigger a workflow and confirm a session appears in the OpenBox dashboard

---

## No Sessions in Dashboard

If sessions don't appear after running a workflow:

1. Ensure the worker is running (`make run-worker` for the demo)
2. Confirm the workflow completed — check the Temporal UI at [http://localhost:8233](http://localhost:8233)
3. Verify the API key matches the agent registered in OpenBox
4. Check that `OPENBOX_GOVERNANCE_ENABLED` is set to `true` in your `.env`

---

## Governance Blocks or Stops Your Agent

When a behavioral rule or policy triggers, the SDK raises a `GovernanceStop` exception. This is expected — it means governance is working.

To investigate:

1. Open the [OpenBox Dashboard](https://platform.openbox.ai)
2. Go to your agent → **Overview** tab
3. Open the session to see which rule triggered the block

See **[Error Handling](/docs/developer-guide/error-handling)** for how to handle `GovernanceStop` and other trust exceptions in your code.

---

## Approval Requests Not Appearing

If your agent is paused waiting for approval but nothing shows in the **Approvals** page:

1. Confirm the behavioral rule is set to **Require Approval** (not Block)
2. Check that the agent's trust tier matches the rule conditions
3. Verify the approval timeout hasn't already expired

See **[Approvals](/docs/approvals)** for how the approval queue works.

---

## LLM API Errors

The demo uses [LiteLLM](https://docs.litellm.ai/docs/providers) for model routing. The `LLM_MODEL` format is `provider/model-name`.

Common models:

| Provider | Example `LLM_MODEL` value |
|----------|--------------------------|
| OpenAI | `openai/gpt-4o` |
| Anthropic | `anthropic/claude-sonnet-4-5-20250514` |
| Google AI | `gemini/gemini-2.0-flash` |

If you're seeing LLM errors, check that `LLM_MODEL` and `LLM_KEY` are correct in your `.env`.

To test your LLM configuration, run this from your project directory:

<Tabs>
<TabItem value="uv" label="uv" default>

```bash
uv run python3 -c "
from litellm import completion
response = completion(
    model='your-llm-model',
    api_key='your-llm-key',
    messages=[{'role': 'user', 'content': 'test'}]
)
print(response.choices[0].message.content)
"
```

</TabItem>
<TabItem value="pip" label="pip (venv)">

```bash
# Activate your virtual environment first
# source .venv/bin/activate
python3 -c "
from litellm import completion
response = completion(
    model='your-llm-model',
    api_key='your-llm-key',
    messages=[{'role': 'user', 'content': 'test'}]
)
print(response.choices[0].message.content)
"
```

</TabItem>
</Tabs>

Use the `LLM_MODEL` and `LLM_KEY` values from your `.env`. See the [LiteLLM providers list](https://docs.litellm.ai/docs/providers) for supported models and formats.

---

## Temporal Server Not Running

If the worker can't connect to Temporal:

```
Connection refused: localhost:7233
```

Start the Temporal dev server:

```bash
temporal server start-dev
```

The Temporal UI will be available at [http://localhost:8233](http://localhost:8233).

---

## Next Steps

1. **[Dashboard](/docs/dashboard)** - Monitor your agents from the dashboard
2. **[Agents Overview](/docs/dashboard/agents)** - View and manage all registered agents
3. **[Approvals](/docs/approvals)** - Review and act on HITL approval requests

