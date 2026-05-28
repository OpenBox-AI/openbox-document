---
title: Agent Identity
description: "Every OpenBox agent has a cryptographic identity (DID + signing key) that proves governance requests genuinely came from the agent, separate from its API key."
llms_description: What an agent's DID is and why it matters
tags:
  - agent-management
  - cryptography
---

# Agent Identity

Every OpenBox agent has a cryptographic identity — a Decentralized Identifier (DID) and an Ed25519 signing key — separate from its API key.

The API key authenticates the HTTP call. The signing key proves *which agent* produced the payload. If an API key leaks, an attacker can reach OpenBox, but they still cannot act as the agent without its private key.

## The DID

Every agent has an identifier of the form:

```
did:aip:<uuidv5>
```

It's deterministic — the same agent always resolves to the same DID — and it's stable across key rotation. You'll see it on the agent's Settings page and in audit records for any request the agent signed.

## The signing key

The private key is **Ed25519**, generated when identity is provisioned. OpenBox shows it to you **once** and never stores it. You hold it; OpenBox holds the public half and uses it to verify every signed governance request.

## Enforcement

Whether OpenBox actually *requires* signed requests for an agent is controlled by a per-agent setting called **Require signed requests**.

| State | Behaviour |
|---|---|
| **On** | Unsigned requests for this agent are rejected. |
| **Off** | Unsigned requests are accepted (for agents that haven't provisioned identity yet, or that you've intentionally exempted). |

Both new agents and agents that have just been provisioned default to **On** — enforcement begins the moment provisioning completes. Agents that haven't provisioned identity yet keep accepting unsigned requests.

## Where to manage it

Identity actions live on the agent's **Settings → API Access** page:

- **Provision DID** — generate the keypair and assign a DID (for agents that don't have one yet)
- **Rotate Private Key** — issue a new keypair without changing the DID
- **Require signed requests** — toggle enforcement on or off

See [Agent Settings → API Access](/dashboard/agents/agent-settings#api-access) for the step-by-step flow.

## Your responsibilities

- **Store the private key securely.** It's shown once. Put it in the secrets manager your agent process reads from.
- **Deploy the key before provisioning a live agent.** Enforcement turns on as soon as you click Provision DID. If the agent process isn't already signing requests, unsigned in-flight calls will be rejected.
- **Rotate immediately if you suspect exposure.** The DID stays the same; only the key changes.
- **Update your agent before rotating in production.** Signatures from the old key stop verifying as soon as rotation completes.
