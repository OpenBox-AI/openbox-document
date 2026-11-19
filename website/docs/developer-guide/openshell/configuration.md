---
title: Configuration
description: "Install and configure OpenBox for OpenShell: the Helm chart, certificates, Redis, gateway registration, compute drivers and content capture."
llms_description: OpenShell chart values, gateway TOML and capture
sidebar_position: 2
tags:
  - openshell
  - configuration
---

# Configuration

This page covers a production install on an OpenShell v0.1.8 gateway you
already run. For the shortest path, see
[Getting Started with OpenShell](/getting-started/openshell).

`helm show values oci://ghcr.io/openbox-ai/charts/openbox-openshell` prints the
chart's `values.yaml`, which documents every value and the environment
variable it sets. The chart refuses settings the services would refuse at
startup.

## Before you start

You need:

- **An OpenShell v0.1.8 gateway with extension tokens on.** That is the
  `[openshell.gateway.gateway_jwt]` section of the gateway TOML. Note its
  `gateway_id` (`gateway.id`) and the PEM file at `public_key_path`
  (`gateway.publicKey`). Both services check every call against them.
- **An agent in the OpenBox dashboard with a workload identity**, and the
  key's `kid` from `GET $OPENBOX_API_URL/api/v3/auth/bootstrap`. Workload
  tokens must carry the `openbox-core` audience; Core and the backend reject
  tokens without it.
- **A Redis every door guard replica can reach.** See [Shared store](#shared-store).
- **A gateway API client certificate for OpenBox** (optional, but you want
  it). The door guard uses it to stop a halted sandbox, and the front desk uses
  it to reconcile the AI Inventory and to read policy proposals. Without it, a
  halt still denies all of the sandbox's traffic but cannot stop the sandbox.

## Install the chart

```bash
helm install openbox oci://ghcr.io/openbox-ai/charts/openbox-openshell \
  --version 0.2.0 -n openbox --create-namespace \
  --set openbox.url=https://core.openbox.ai \
  --set openbox.backendUrl=https://api.openbox.ai \
  --set credentials.existingSecret=openbox-agent \
  --set gateway.id=<gateway_id> \
  --set-file gateway.publicKey=<public_key_path> \
  --set gateway.api.endpoint=<gateway API URL> \
  --set gateway.api.mtlsSecret=openbox-gateway-client \
  --set tls.doorGuard.existingSecret=openbox-door-guard-tls \
  --set tls.frontDesk.existingSecret=openbox-front-desk-tls \
  --set externalRedis.url=redis://<host>:6379/0
```

| Secret | Keys |
|---|---|
| `openbox-agent` | `api-key`, `workload.pem`, `workload-kid` |
| `openbox-gateway-client` | `ca.crt`, `tls.crt`, `tls.key` |
| `openbox-door-guard-tls`, `openbox-front-desk-tls` | a `kubernetes.io/tls` Secret each |

### Main values

| Value | Default | What it sets |
|---|---|---|
| `openbox.url` | – | OpenBox Core URL: `https://core.openbox.ai` |
| `openbox.backendUrl` | – | OpenBox backend URL, for the AI Inventory: `https://api.openbox.ai` |
| `credentials.existingSecret` | – | The agent's credentials (above) |
| `gateway.id`, `gateway.publicKey` | – | The gateway's `gateway_id` and extension-token public key |
| `gateway.api.endpoint`, `gateway.api.mtlsSecret` | – | The gateway API and OpenBox's client certificate for it |
| `externalRedis.url` | – | `redis://[:password@]host[:port][/db]` |
| `redis.enabled` | `false` | Run a single Redis in the release, for evaluation only |
| `doorGuard.replicaCount` | `2` | Door guard replicas. More than one needs Redis |
| `doorGuard.coreTimeoutMs` | `29000` | One budget for every Core call behind a verdict |
| `doorGuard.maxPayloadBytes` | `1048576` | The largest body the door guard accepts; match the registration |
| `doorGuard.promptCapture`, `doorGuard.bodyCapture` | `findings` | [Content capture](#content-capture) |
| `doorGuard.approvalTtlSecs` | `900` | Approval window when Core sends no deadline |
| `doorGuard.adminTokenSecret` | – | Turns on the admin API used to [resume a halted sandbox](/developer-guide/openshell/operations#resuming-a-halted-sandbox) |
| `doorGuard.evidenceKeySecret` | – | Turns on [signed verdict records](/developer-guide/openshell/operations#signed-verdict-records) |
| `doorGuard.fastPath.*` | see [Fast-path verdicts](/developer-guide/openshell/controls#fast-path-verdicts) | Answer some requests without waiting for Core |
| `frontDesk.sessions` | `true` | Open and close each sandbox's OpenBox session |
| `frontDesk.reconcileSecs` | `60` | How often the inventory is reconciled against the gateway |
| `frontDesk.fleetChecks`, `frontDesk.fleetWaitMs` | `false`, `400` | [Fleet checks](/developer-guide/openshell/controls#fleet-checks) |
| `ocsfCollector.enabled` | `false` | Ship OpenShell's OCSF log ([Forwarding to your SIEM](/developer-guide/openshell/operations#forwarding-to-your-siem)) |

To run your own build, build the repository's `Dockerfile`, push it to your
registry, and set `image.repository` and `image.tag`.

### Server certificates

The gateway and the sandbox supervisors call both services over TLS. They
check each certificate against the registration's `tls_ca_cert_path`, with
normal hostname checks. So:

- Issue both certificates from a CA you will name in `tls_ca_cert_path`. The
  gateway's own CA works.
- Put the names the gateway and the supervisors dial in the SANs. For the
  in-cluster Service that is `<release>-openbox-openshell-door-guard.<ns>.svc`
  and the matching front desk name. For an IP endpoint such as
  `https://127.0.0.1:50051`, the certificate needs that IP SAN.

Store each one as a `kubernetes.io/tls` Secret (`tls.doorGuard.existingSecret`,
`tls.frontDesk.existingSecret`), or set `tls.certManager.enabled` and point
`tls.certManager.issuerRef` at a cert-manager Issuer that signs with that CA.

### Shared store

The door guard runs two or more replicas. An approval's retry and a response's
completion can land on any replica, so they are matched through Redis. Without
Redis, a retry on another replica asks for approval again, and the chart
refuses more than one replica without it.

The client speaks plain TCP with an optional password:
`redis://[:password@]host[:port][/db]`. It does not speak TLS, so keep Redis on
a network you trust. If Redis is unreachable, nothing is skipped: a retry is
scored as a new activity and needs a new approval.

## Register with the gateway

Start OpenBox first: the gateway does not start while a registered service is
unreachable or rejects its manifest. Then add the following to the gateway
TOML and restart the gateway. `helm install` prints this block with your
Service names filled in.

```toml title="gateway.toml"
# The front desk, governing: attaches the door guard to every new sandbox and
# refuses changes that weaken it. Fail closed.
[[openshell.gateway.interceptors]]
name = "openbox"
grpc_endpoint = "https://<front desk>:50061"
tls_ca_cert_path = "/etc/openshell/openbox-ca.pem"
audience = "urn:openshell:extension:interceptor:openbox"
failure_policy = "fail_closed"
binding_policy = "allowlist"

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/CreateSandbox"
phases = ["modify_operation", "validate"]

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/UpdateConfig"
phases = ["validate"]

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/ImportProviderProfiles"
phases = ["validate"]

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/UpdateProviderProfiles"
phases = ["validate"]

# The front desk, recording: AI Inventory and each sandbox's OpenBox session.
# Fail open, because it runs after the gateway has committed the change.
[[openshell.gateway.interceptors]]
name = "openbox-inventory"
grpc_endpoint = "https://<front desk>:50062"
tls_ca_cert_path = "/etc/openshell/openbox-ca.pem"
audience = "urn:openshell:extension:interceptor:openbox-inventory"
failure_policy = "fail_open"
binding_policy = "allowlist"

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/CreateSandbox"
phases = ["post_commit"]

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/UpdateConfig"
phases = ["post_commit"]

[[openshell.gateway.interceptors.bindings]]
rpc = "openshell.v1.OpenShell/DeleteSandbox"
phases = ["post_commit"]

# The door guard: a verdict on every request, and every response recorded.
[[openshell.supervisor.middleware]]
name = "openbox"
grpc_endpoint = "https://<door guard>:50051"
tls_ca_cert_path = "/etc/openshell/openbox-ca.pem"
audience = "urn:openshell:extension:middleware:openbox"
max_payload_bytes = 1048576
timeout = "30s"
```

Keep these settings as they are:

- **Names.** The front desk attaches a middleware named `openbox`, so the door
  guard registration must be named `openbox`. The audiences above are
  OpenShell's defaults for these names, and the services expect them. If you
  change an audience, change `doorGuard.audience`, `frontDesk.audience` or
  `frontDesk.inventoryAudience` to match; the gateway refuses to start on a
  mismatch.
- **`timeout = "30s"`.** This is the most OpenShell allows. A full Core verdict
  runs policy, guardrails and behavior rules, and takes seconds. The door guard
  gives all Core calls behind one verdict 29 s, so a slow Core ends in an
  explicit `openbox_unavailable` deny before the gateway gives up.
- **`max_payload_bytes`.** It must not exceed `doorGuard.maxPayloadBytes`
  (default 1 MiB). Keep the two equal.
- **`binding_policy = "allowlist"`.** The gateway enables only the RPCs and
  phases listed. The two provider profile bindings matter: a provider's
  profile endpoints join a sandbox's policy when the provider is attached, so
  they never pass the policy checks on `CreateSandbox` and `UpdateConfig`.
- **`failure_policy`.** The governing registration fails closed. The inventory
  registration must fail open: OpenShell refuses a fail-closed `post_commit`
  binding.

### Door guard endpoint per compute driver

The door guard is called by each sandbox's supervisor, not only by the
gateway. Its `grpc_endpoint` must resolve and connect from wherever the
supervisors run.

| Compute driver | Where supervisors run | Door guard endpoint |
|---|---|---|
| Kubernetes | In the sandbox pods | The in-cluster Service name, e.g. `https://openbox-openbox-openshell-door-guard.openbox.svc:50051` |
| VM | On the gateway host, next to each VM | An address that resolves on the host, e.g. `https://127.0.0.1:50051` when the door guard runs on that host |
| Docker, Podman | Not yet verified | An address that resolves from both the gateway and the supervisor |

Do not use `host.openshell.internal` for the VM driver: the supervisor runs on
the host, and that name does not resolve there. The certificate must carry
whatever you put in the endpoint, including an IP SAN for `127.0.0.1`.

The front desk is called only by the gateway, so its endpoint must resolve
from the gateway.

### Audit provider profiles imported earlier

The front desk checks a provider profile when it is imported or updated.
Profiles already stored in the gateway were never checked. Audit them once,
right after you register the front desk:

```bash
openshell profile list
openshell profile export <name> --global > <name>.yaml   # for each profile
grep -n allow_uninspected_credentials *.yaml
```

Any endpoint with `allow_uninspected_credentials: true` sends its credential
past the door guard. Update that profile without it; the front desk now checks
the update.

### Check it

Create a sandbox the usual way, then confirm the door guard is attached:

```bash
openshell sandbox create --name check --policy policy.yaml
openshell policy get check --full | grep 'middleware: openbox'
```

Make a request from inside the sandbox. Each door guard pod logs one line per
verdict, with identifiers and the outcome only:

```
openbox: eval request_id=<id> sandbox_id=<id> decision=allow reason_code=- ms=<ms>
```

## Content capture

Every request the door guard scores sends Core a description of it. What part
of the request's content leaves your boundary is set by a capture mode:

| Mode | Core receives |
|---|---|
| `off` | Nothing of the content. |
| `hash` | Its SHA-256 and length. |
| `findings` (default) | Its SHA-256 and length, the kinds of sensitive data found in it with a count each (`email`, `payment_card`, `us_ssn`, `aws_access_key`, `private_key`, `jwt`, `api_key`), and for JSON its shape: the keys and the type of each value, never the values. |
| `text` | The content itself, up to 64 KiB. Opt-in. |

| Content | Setting |
|---|---|
| The user's prompt in a model call | `doorGuard.promptCapture` |
| Request and response bodies, MCP tool arguments and results, tool calls a model asks for and their results, a model's reply text | `doorGuard.bodyCapture` |

A sandbox policy can choose its own capture, for the whole sandbox or per
host, in the `openbox` middleware's config. The front desk keeps these keys
when it attaches the door guard, and the door guard refuses an unknown mode or
a malformed host when the policy loads:

```yaml title="policy.yaml"
network_middlewares:
  openbox:
    middleware: openbox
    config:
      capture: hash                      # every host, unless listed below
      capture_hosts:
        api.internal.example: text       # an exact host
        "*.corp.example": off            # any subdomain of corp.example
```

An exact host wins over a wildcard that also matches it.

Policies and [guardrails](/trust-lifecycle/authorize/guardrails) that read
content (for example a guardrail on the prompt's text) see only what the
capture sends. With the default, they see findings and shapes; opt the hosts
they need in to `text`.

## Next

[Request Controls](/developer-guide/openshell/controls) covers what else you can turn on: fast-path verdicts, CONSTRAIN rewrites, response and WebSocket checks, fleet posture and fleet checks.
