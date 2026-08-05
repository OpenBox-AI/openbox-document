---
title: Projects
description: "Connect repositories to OpenBox Projects and trace agents from code changes to governed runtimes, sessions, and governance snapshots."
llms_description: Projects and agent lineage in the OpenBox dashboard
sidebar_position: 4
tags:
  - agent-management
  - observability
  - governance
---

# Projects

:::info Gated
Projects is a gated feature that rolls out per organization. Contact OpenBox if you don't see **Projects** in your dashboard sidebar yet. The underlying lineage mechanism it surfaces (commit-trailer attribution, path-based commit matching, and governance snapshots) is generally available; see [Agent Lineage](/core-concepts/agent-lineage).
:::

Projects connect repository activity to governed OpenBox agents. Use Projects to see which commits affected an agent, which runtime and DID are linked to that code path, and which governance configuration was active when sessions ran.

Access Projects from the sidebar by clicking **Projects**.

## When to Use Projects

Use Projects when you want to track an agent across development and production workflows:

| Need | How Projects Helps |
|------|--------------------|
| **Trace code changes** | See commits that touched the files owned by a repository agent. |
| **Support monorepos** | Define multiple repository agents with separate included and ignored paths. |
| **Link runtimes to code** | Attach registered OpenBox runtimes to a repository agent and branch. |
| **Audit governance state** | Review policy, guardrail, and behavioral-rule hashes at key points in time. |
| **Connect sessions to provenance** | Open governed sessions from the runtime lineage view. |

## Project List

The Projects page shows every repository connected to your organization.

Each row includes:

- **Project name**
- **Repository owner and name**
- **Connection status**
- **Repository agents**
- **Lifecycle events**
- **Last synced timestamp**

Click a project row to open the project detail page.

## Creating a Project

Click **Create Project** to connect a repository.

The project creation flow asks for:

| Field | Description |
|-------|-------------|
| **Project Name** | Human-readable name shown in OpenBox. |
| **Repository URL** | Git repository URL. OpenBox derives the owner and repository name from this URL. |
| **Description** | Optional summary of what the project contains. |

After the project is created, OpenBox sends you through the GitHub App installation flow. Approve access for the selected repository so OpenBox can receive repository metadata, branch changes, and commit events.

:::tip
For private repositories, the GitHub App must be installed with access to that repository before OpenBox can sync branch and commit metadata.
:::

## Repository Agents

A repository can contain one agent or many agents. In OpenBox, each logical agent inside a project is represented as a **Repository Agent**.

Repository agents are defined by path mappings:

| Path Type | Description |
|-----------|-------------|
| **Included Paths** | Files and directories that belong to the agent. Commits touching these paths can be attributed to the repository agent. |
| **Ignored Paths** | Files and directories excluded from attribution, even if they match an included path. |

Examples:

| Repository Layout | Example Mapping |
|-------------------|-----------------|
| Single agent repository | `src/**`, `package.json`, `docs/**` |
| Monorepo web-search agent | `agents/web-search/**`, `shared/search/**` |
| Monorepo summarizer agent | `agents/summarizer/**`, `shared/prompts/**` |

Click a repository agent row to see lifecycle events and registered runtimes for that agent.

## Lifecycle Events

Lifecycle events show repository activity that OpenBox attributed to a repository agent.

Each event row includes:

| Column | Description |
|--------|-------------|
| **Event** | Commit or repository event title. |
| **Commit** | Linked commit SHA when available. |
| **Branch** | Branch where the event occurred. |
| **Source** | Source system, such as GitHub. |
| **Timestamp** | When the event occurred. |

Lifecycle events are scoped by the repository agent's included and ignored paths. Runtime session events are not duplicated here; sessions are shown in the runtime lineage view.

### <mark className="diff-mark">Commits From a Governed Dev Session</mark>

<mark className="diff-mark">If a commit was produced by a governed coding-agent session (for example [Claude Code](/getting-started/claude-code)), OpenBox recognizes the `OpenBox-Session` trailer it leaves on the commit and attributes the lifecycle event to that dev session in addition to the repository agent its paths matched. Click the event to see the originating session alongside the usual commit and branch details. See [Agent Lineage → Shift-Left](/core-concepts/agent-lineage#shift-left-governance) for the full dev-session-to-runtime chain.</mark>

## Registered Runtimes

A registered runtime is an OpenBox agent instance linked to the repository agent.

Each runtime row shows:

- **Runtime name**
- **Runtime framework**
- **Linked branch**
- **DID**
- **Latest session status**
- **Last observed timestamp**

Click a runtime row to open the runtime lineage page.

## Runtime Lineage

The runtime lineage page connects code, sessions, and governance state for one runtime.

It includes:

| Section | Description |
|---------|-------------|
| **Lifecycle Events** | Repository events attributed to the runtime's repository agent and branch. |
| **Sessions** | Governed OpenBox sessions produced by the runtime. Click a row to open the session in the agent Verify tab. |
| **Governance Snapshots** | Policy, guardrail, and behavioral-rule hashes captured for runtime-linked, commit, and governance-change triggers. |

The same lineage view is also available from the agent detail page when a runtime is linked to a project: **Agents → select agent → Lineage**.

## Branch Sync and Warnings

OpenBox syncs repository branches from the GitHub App.

| Branch Event | Platform Behavior |
|--------------|-------------------|
| **Branch created** | The branch becomes available in runtime-linking and lineage settings dropdowns. |
| **Branch updated** | Future commit events on that branch can be attributed to matching repository agents. |
| **Branch deleted** | Linked runtimes remain visible, but OpenBox shows a warning to update the linked branch. |

If a runtime is linked to a deleted branch, use **Agent Settings → Lineage** to select an active branch.

## Governance Snapshots

Governance snapshots show which controls were active at important points in the runtime's lifecycle.

| Trigger | Meaning |
|---------|---------|
| **Runtime Linked** | Baseline governance state when the runtime was attached to the project. |
| **Commit** | Governance state associated with a repository change relevant to the runtime. |
| **Policies** | Policy version changed. |
| **Guardrails** | Guardrail version changed. |
| **Behavior** | Behavioral-rule version changed. |

Each snapshot includes policy, guardrail, and behavioral-rule hashes. These hashes link lineage back to the controls configured in the agent's **Authorize** tab.

## Related Pages

- **[Agent Lineage](/core-concepts/agent-lineage)** - Concept model for projects, repository agents, runtimes, and snapshots
- **[Agents](/dashboard/agents)** - Register and manage governed runtimes
- **[Registering Agents](/dashboard/agents/registering-agents)** - Link a new runtime to a project during registration
- **[Agent Settings](/dashboard/agents/agent-settings)** - Update lineage branch settings after registration
- **[Session Replay](/trust-lifecycle/session-replay)** - Inspect governed session timelines
