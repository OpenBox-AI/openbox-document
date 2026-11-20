---
title: Request Controls
description: "Optional OpenBox for OpenShell controls: fast-path verdicts, CONSTRAIN rewrites, response and WebSocket checks, fleet posture and fleet checks, and running next to other middleware."
llms_description: OpenShell fast path, CONSTRAIN, responses, fleet checks
sidebar_position: 3
tags:
  - openshell
  - configuration
---

# Request Controls

Everything on this page is optional. With none of it, every request waits for
a Core verdict, responses are scanned and recorded but always delivered, and
sandbox creates and policy changes are checked only for governance. Turn on
what you need.

| Control | What it does | Where it is set |
|---|---|---|
| [Fast-path verdicts](#fast-path-verdicts) | Answers known-safe requests without waiting for Core | Chart |
| [CONSTRAIN](#constrain-rewriting-a-request) | Rewrites a request before it goes out, as Core's verdict says | OpenBox policy |
| [Responses and WebSocket messages](#responses-and-websocket-messages) | Redacts or blocks secrets and injected instructions coming back into the sandbox | Sandbox policy |
| [Fleet posture](#fleet-posture) | Marks each sandbox in the AI Inventory as compliant, weakened or ungoverned | Always on |
| [Fleet checks](#fleet-checks) | Lets OpenBox policy approve or refuse sandbox creates and policy changes | Chart and gateway TOML |

## Fast-path verdicts

By default every request waits for Core. Three tiers let the door guard answer
sooner where that is safe:

| Tier | Answers | Setting |
|---|---|---|
| 0, local rules | Requests a rule in a local snapshot matches | `doorGuard.fastPath.rulesSource`: `core` (from Core) or `rulesConfigMap` (a ConfigMap with `rules.json`); `doorGuard.fastPath.rulesMode`: `shadow` (default) or `enforce` |
| 1, recent verdict | An action identical to one Core allowed within a TTL | Core's `verdict_ttl_secs` on the verdict, else `doorGuard.fastPath.verdictTtlSecs` (default 0: off) |
| 2, Core | Everything else | `doorGuard.fastPath.slowCore`: `pending` (default) or `inline` |

A request a fast tier allows is still recorded in Core, in order with the
sandbox's other events, after it has been answered. If Core then refuses it,
the door guard logs it and counts it in
`openbox_mw_fast_path_disagreements_total`; the request has already gone.
Model calls always go to Core. An approved retry is never reused: approvals
stay single use.

**Local rules from Core.** With `rulesSource: core` the door guard fetches the
agent's snapshot from Core every 30 s. Core builds it from the agent's
`config.openshell.fast_rules`, in the format below, and sets its expiry from
`config.openshell.fast_rules_ttl_secs` (30 s to 1 h, default 5 minutes). A door
guard that cannot reach Core keeps the last snapshot until it expires, then
asks Core for everything.

**Local rules from a file.** The snapshot is JSON, reloaded within 10 s of a
change. A snapshot past `expires_at` is not used:

```json title="rules.json"
{
  "version": "2026-11-13#42",
  "expires_at": 1795000000,
  "rules": [
    {"id": "no-paste", "decision": "block", "hosts": ["pastebin.com", "*.pastebin.com"]},
    {"id": "docs-read", "decision": "allow", "hosts": ["docs.example.com"], "methods": ["GET", "HEAD"]},
    {"id": "safe-tools", "decision": "allow", "tools": ["search"]}
  ]
}
```

Every condition a rule sets must match (`hosts`, `methods`, `path_prefixes`,
`tools`); the first matching rule decides. Run new rules in `shadow` first:
Core still decides, and `openbox_mw_rule_shadow_total{agreement=...}` shows how
often the snapshot agrees. Switch to `enforce` once it does.

**Pending** (the default). With `slowCore: pending`, the door guard waits
`doorGuard.fastPath.pendingWaitMs` (2 s) for Core. If Core is slower, the
request is denied with `openbox_pending` while the door guard keeps
evaluating; the agent's identical retry gets the verdict at once. This avoids
holding a connection open for the whole of a slow verdict, which destinations
with short idle timeouts drop. Agents must retry on `openbox_pending`; the
[retry helpers](/developer-guide/openshell/approvals#retry-helpers) do. An
agent that cannot retry needs `slowCore: inline`, and with it the full wait for
every verdict.

## CONSTRAIN: rewriting a request

When Core's verdict is CONSTRAIN and carries constraints, the door guard
changes the request before it goes out, then allows it:

| Kind | Fields | What the door guard does |
|---|---|---|
| `redact` | `paths`: JSON Pointers; `findings`: kinds from [Content capture](/developer-guide/openshell/configuration#content-capture) | Replaces the value at each path, and every match of each kind in any string (or in a text body), with `[REDACTED]`. |
| `narrow` | `tool` (optional), `drop`, `set` | In each MCP `tools/call` of that tool (or of any tool), removes the `drop` argument keys and writes the `set` ones. |
| `strip_headers` | `names` | Removes those request headers. |

The door guard denies with `openbox_constrain_failed`, instead of forwarding
the original, when it cannot meet a constraint: a `redact` path into a body
that is not JSON, a `narrow` on a request with no matching `tools/call`, a
header OpenShell protects (`Authorization`, `Cookie`, `Host`, `x-amz-*` and
the framing headers), a rewritten body over 4 MiB, or an unknown kind.

The approval fingerprint is the request as the agent sent it, so an identical
retry still matches its approval. A CONSTRAIN verdict without constraints, or
with `run_in_sandbox` (which the sandbox itself meets), goes out unchanged.

Rewrite rules apply only to agents whose workflow engine is OpenShell. Other
runtimes cannot apply a rewrite, so OpenBox refuses to save or assign a rule
with `redact`, `narrow` or `strip_headers` to those agents. If such a rule
still reaches one, for example after its workflow engine changes, Core
returns BLOCK instead of CONSTRAIN. A rule with only `run_in_sandbox` works
for any agent.

:::note
The hosted OpenBox platform does not send rewrites yet. Until that release
is out, a CONSTRAIN verdict there carries only `run_in_sandbox`.
:::

## Responses and WebSocket messages

What comes back into the sandbox is checked by the door guard itself, with the
detectors from [Content capture](/developer-guide/openshell/configuration#content-capture), against the sandbox
policy's settings:

```yaml title="policy.yaml"
network_middlewares:
  openbox:
    middleware: openbox
    config:
      responses: block          # findings (default), redact or block
      response_kinds: [aws_access_key, private_key, jwt, api_key, prompt_injection, email]
      websocket: enforce        # findings (default), enforce or skip
```

| `responses` | A response carrying one of `response_kinds` |
|---|---|
| `findings` | is delivered unchanged; the kinds found are logged in OpenShell's OCSF log and recorded with the request in the session |
| `redact` | is delivered with each match replaced by `[REDACTED]` |
| `block` | is not delivered: the sandbox gets `openbox_response_blocked` |

`response_kinds` defaults to the secrets and `prompt_injection` (instructions
planted in a tool result or a page to redirect the agent). Personal data
(`email`, `payment_card`, `us_ssn`) is acted on only when listed.

:::caution The upstream call has already run
Blocking a response keeps its content out of the sandbox; it does not undo what
the request did at the destination. Block requests with policy for that.
:::

**WebSocket.** The upgrade request gets a Core verdict like any request, so
OpenBox decides whether a sandbox may open a WebSocket at all. After the
upgrade, `websocket` decides what happens to text messages from the sandbox:

| `websocket` | Text messages from the sandbox |
|---|---|
| `findings` (default) | Scanned; the kinds found go to OpenShell's OCSF log and to the session as a `websocket_message` signal with the counts, never the message. Delivered unchanged. |
| `enforce` | As `findings`, and a message carrying one of `response_kinds` is denied (or, with `responses: redact`, delivered redacted). |
| `skip` | Not inspected. The skip is recorded as a coverage finding so the gap shows in the evidence. |

Binary messages and messages from the destination are not inspected, and
messages get no Core verdict each: a Core round trip per message would stall
most WebSocket protocols.

## Fleet posture

Each AI Inventory row carries, as labels:

| Label | Value |
|---|---|
| `openbox.ai/compliance` | `compliant` (the door guard attached as the front desk attaches it), `weakened` (fail open, or not every host), `ungoverned` (no door guard), `unknown` (policy not readable) |
| `openbox.ai/profile` | the sandbox's `profile`, when its policy sets one |
| `openbox.ai/openshell-version` | `frontDesk.openshellVersion`, when set |

Every reconciliation pass logs
`openbox: posture alert sandbox_id=... compliance=...` for each sandbox that is
not `compliant`. Alert on that line.

## Fleet checks

With `frontDesk.fleetChecks: true` the front desk sends three kinds of gateway
change to OpenBox before they happen, on the gateway's fleet session
(`openshell-fleet-<gateway id>`):

| Activity type | Sent when | Refused while |
|---|---|---|
| `openshell.create_sandbox` | a sandbox is created | Core blocks it, or it waits for approval |
| `openshell.policy_change` | `UpdateConfig` sets a policy or adds rules | same |
| `openshell.policy_proposal` | someone approves an agent-authored proposal | same |

Each carries, in `activity_input`, a score of how much the change opens up and
the fleet's totals:

```json
{"operation": "openshell.create_sandbox", "sandbox": "build-7", "risk": 9,
 "factors": {"endpoint": 3, "wildcard_host": 3, "tls_skip": 3},
 "hosts": ["*.example.com", "api.example.com", "pypi.org"],
 "fleet": {"sandboxes": 11, "risk": 52, "sandboxes_after": 12, "risk_after": 61}}
```

Points per endpoint: 1, plus 3 for a wildcard host (5 for `*` or `**`), 3 for
`tls: skip`, 5 for uninspected credentials, 2 for a full-access preset (1 for
read-write) and 1 for more than three ports.

Your [policies](/trust-lifecycle/authorize/policies) decide. A risk budget is
a BLOCK rule such as "activity type is `openshell.create_sandbox` and
`activity_input.fleet.risk_after` is greater than 60"; sending risky proposals
to a person is a REQUIRE_APPROVAL rule on `openshell.policy_proposal` and
`activity_input.risk`. Once someone approves a change in OpenBox, the same
change goes through when it is made again.

Fleet checks need the gateway API credential, and two changes to the
governing registration:

```toml title="gateway.toml"
[[openshell.gateway.interceptors]]
name = "openbox"
# ...as above, plus:
timeout = "10s"

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/ApproveDraftChunk"
phases = ["validate"]

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/ApproveAllDraftChunks"
phases = ["validate"]
```

OpenShell gives an interceptor 500 ms unless told otherwise, and a Core verdict
takes seconds. The front desk waits `frontDesk.fleetWaitMs` for Core (default
400, which fits 500 ms); a change still undecided by then is refused with
"OpenBox is still checking this change; make the same change again in a few
seconds". With `timeout = "10s"` and `fleetWaitMs: 9000` most changes are
decided in one go. Keep `fleetWaitMs` under the `timeout`.

## Running next to other middleware

OpenShell runs a sandbox's network middlewares in `order`, lowest first, and
any one of them denying a request stops it. The front desk gives the `openbox`
entry order 1000, or 10 more than the highest order already in the policy, so
the door guard runs last and judges the request as it will actually leave,
after any redaction by other middleware. If an earlier middleware denies, the
door guard never sees the request; an OpenBox deny holds whatever the earlier
middleware said.
