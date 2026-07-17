---
title: Agent Lineage
description: "Trace an AI agent from repository changes to registered runtime, governance configuration, sessions, and audit evidence."
llms_description: Code-to-runtime lineage for governed AI agents
tags:
  - agent-management
  - observability
  - governance
---

# Agent Lineage

Agent Lineage connects the code that defines an agent to the OpenBox runtime that governs it. It lets teams answer which repository changes affected an agent, which registered runtime was running that code path, and which governance configuration was active when sessions occurred.

Lineage is a platform concept. It does not replace SDK telemetry, policy enforcement, GitHub, or your deployment system. It adds a provenance layer that correlates those systems into one governed view.

## What Lineage Answers

Use lineage when you need to answer:

- Which repository and paths define this agent?
- Which commits touched the files owned by this agent?
- Which OpenBox runtime and DID are linked to that code path?
- Which branch is the runtime associated with?
- Which policies, guardrails, and behavioral rules were active at a point in time?
- Which sessions ran after a code or governance change?

## Concept Model

| Concept | Description |
|---------|-------------|
| **Project** | A repository-level grouping in OpenBox. One project maps to one connected repository. |
| **Repository Agent** | The logical agent inside a project. In a monorepo, each repository agent is defined by included and ignored paths. |
| **Agent Paths** | Path rules that tell OpenBox which files belong to a repository agent. Commits touching included paths are attributed to that agent unless ignored paths exclude them. |
| **Runtime** | A registered OpenBox agent instance with its own API key and [Agent DID](/core-concepts/agent-identity). A runtime can be linked to a repository agent and branch. |
| **Lifecycle Event** | A code, branch, runtime-link, or governance event that changes the lineage context for an agent. |
| **Governance Snapshot** | A point-in-time record of policy, guardrail, and behavioral-rule version hashes for a runtime. |
| **Session Evidence** | Normal OpenBox session data shown in lineage to connect runtime activity back to code and governance context. |

## How OpenBox Connects the Data

Lineage is built from three data sources:

| Source | What OpenBox Uses |
|--------|-------------------|
| **Repository metadata** | Repository owner, repository name, branches, commits, authors, timestamps, and changed files from the connected Git provider. |
| **Agent registration data** | Runtime identity, DID, API key status, linked project, linked repository agent, and selected branch. |
| **Governance data** | Policy versions, guardrail versions, behavioral-rule versions, sessions, verdicts, approvals, and runtime telemetry already captured by OpenBox. |

OpenBox correlates these sources by repository, path mapping, branch, and runtime identity. The SDK remains responsible for runtime governance and telemetry. Lineage uses the resulting sessions as evidence rather than creating a separate runtime event stream.

## Projects and Repository Agents

A **Project** represents a connected repository. Inside that project, you define one or more **Repository Agents**.

This supports both common repository layouts:

| Repository Layout | Lineage Model |
|-------------------|---------------|
| **One repository, one agent** | Create one project and one repository agent. The repository agent usually includes the agent's source directory. |
| **One repository, multiple agents** | Create one project and multiple repository agents. Each repository agent owns a distinct set of included and ignored paths. |

When a commit arrives, OpenBox checks the changed files against each repository agent's path mapping. Matching commits become lifecycle events for the relevant repository agents.

## Runtime Linking

A runtime is a registered OpenBox agent instance. It becomes part of lineage when it is linked to:

| Link | Why It Matters |
|------|----------------|
| **Project** | Identifies the repository the runtime belongs to. |
| **Repository Agent** | Identifies the logical agent code area inside that repository. |
| **Branch** | Identifies the code stream the runtime is expected to follow. |
| **DID** | Identifies the exact OpenBox runtime instance producing governed sessions. |

If the linked branch is deleted in the repository, OpenBox keeps the runtime linked but raises a warning so operators can choose a valid branch and continue receiving lifecycle updates.

## Governance Snapshots

Governance snapshots record which control versions were active for a runtime at a point in time.

Snapshots are created when the runtime lineage context changes, such as:

| Trigger | Snapshot Meaning |
|---------|------------------|
| **Runtime Linked** | Initial policy, guardrail, and behavioral-rule state when the runtime is attached to lineage. |
| **Commit** | Governance state associated with a repository change touching the runtime's repository agent paths. |
| **Policies** | Policy version changed for the runtime's agent. |
| **Guardrails** | Guardrail version changed for the runtime's agent. |
| **Behavior** | Behavioral-rule version changed for the runtime's agent. |

Each snapshot stores the current policy hash, guardrail hash, behavioral-rule hash, timestamp, and trigger. These hashes let auditors and operators connect a session or code change back to the exact governance controls that were active.

## What Lineage Is Not

| Lineage Is | Lineage Is Not |
|------------|----------------|
| A provenance layer for code, runtime, sessions, and governance state | A replacement for GitHub, GitLab, Bitbucket, or your deployment system |
| A way to attribute commits to logical agents in a monorepo | A build system or artifact registry |
| A way to see which runtime DID was linked to which branch | A replacement for [Agent Identity](/core-concepts/agent-identity) |
| A way to inspect governance snapshots over time | A replacement for policy, guardrail, or behavioral-rule enforcement |
| A way to connect governed sessions back to code context | A replacement for [Session Replay](/trust-lifecycle/session-replay) |

## Related Pages

- **[Projects](/dashboard/projects)** - Connect repositories and inspect project-level lineage
- **[Agents](/dashboard/agents)** - Register and manage governed agent runtimes
- **[Agent Settings](/dashboard/agents/agent-settings)** - Update API access, identity, and lineage settings
- **[Agent Identity](/core-concepts/agent-identity)** - Understand runtime DID and signing
- **[Session Replay](/trust-lifecycle/session-replay)** - Inspect individual governed sessions
