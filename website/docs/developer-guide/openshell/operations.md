---
title: Operations
description: "Run OpenBox for OpenShell in production: availability, metrics and alerts, slow or unavailable verdicts, halts and resume, break-glass, SIEM forwarding and signed verdict records."
llms_description: OpenShell runbook, metrics, alerts and evidence
sidebar_position: 5
tags:
  - openshell
  - observability
---

# Operations

For the people who run the door guard and the front desk.

## Availability

:::warning OpenBox availability is sandbox availability
The door guard is attached to every sandbox with `on_error: fail_closed`. While
no door guard answers, every governed sandbox's HTTP traffic is refused. While
Core gives no verdict, every request is denied with `openbox_unavailable`. There
is no fail-open setting: the front desk refuses an attachment that does not
fail closed.
:::

| When this is down | What happens |
|---|---|
| Every door guard replica | Every governed sandbox's HTTP traffic is refused |
| OpenBox Core | Every request is denied with `openbox_unavailable` |
| Front desk, `openbox` registration | Nobody can create a sandbox, change a sandbox policy, or import or update a provider profile. Running sandboxes keep working |
| Front desk, `openbox-inventory` registration | Sandboxes still work, but the AI Inventory and sandbox sessions miss events. Reconciliation repairs the inventory when the gateway API credential is set |
| Shared Redis | Approvals, not safety: a retry is scored as a new action and needs a new approval |

Measure availability at the door guard as the share of evaluations not denied
with `openbox_unavailable`, over a rolling 30 days, and set its target no lower
than your sandbox target. To meet it:

- Run two or more door guard replicas with a shared Redis.
- Keep the PodDisruptionBudgets on (`minAvailable: 1`).
- Keep `terminationGracePeriodSeconds` at 30 or more. On SIGTERM the door guard
  stops taking calls and finishes the verdicts in flight.
- Upgrade one replica at a time. The chart uses `maxUnavailable: 0`.
- Start OpenBox before the gateway. The gateway does not start while a
  registered service is unreachable.

**Sizing.** Give each door guard replica 1 GiB of memory for 1 MiB bodies at
100 requests a second or more, and set `MALLOC_ARENA_MAX=2` through
`doorGuard.extraEnv`. Each process keeps a pool of Redis connections
(`OPENBOX_REDIS_POOL`, default 16). One gRPC connection lands on one replica,
so with few supervisors one replica can take most of the load.

## Metrics

The door guard serves Prometheus metrics at `/metrics` on its admin port
(`doorGuard.adminPort`, default 9464), with `/healthz` and `/readyz`. The front
desk has no metrics endpoint; watch its logs and pod health.

| Metric | Type | Labels |
|---|---|---|
| `openbox_mw_evaluations_total` | counter | `decision` (`allow`, `deny`), `reason_code` |
| `openbox_mw_evaluation_duration_seconds` | histogram | none |
| `openbox_mw_core_requests_total` | counter | `call` (`session`, `approval`, `evaluate`, `signal`), `outcome` (`ok`, `error`) |
| `openbox_mw_core_duration_seconds` | histogram | `call` |
| `openbox_mw_tier_total`, `openbox_mw_tier_duration_seconds` | counter, histogram | `tier` |
| `openbox_mw_halt_stops_total` | counter | `outcome` |
| `openbox_mw_halt_stop_seconds` | histogram | none |

Histogram buckets run from 10 ms to 30 s.

### Alerts

```promql
# OpenBox cannot give verdicts: sandboxes are being refused.
sum(rate(openbox_mw_evaluations_total{reason_code="openbox_unavailable"}[5m]))
  / sum(rate(openbox_mw_evaluations_total[5m])) > 0.01

# Core calls failing.
sum by (call) (rate(openbox_mw_core_requests_total{outcome="error"}[5m]))
  / sum by (call) (rate(openbox_mw_core_requests_total[5m])) > 0.05

# Verdicts close to the 29 s budget: the next step is openbox_unavailable.
histogram_quantile(0.99,
  sum by (le) (rate(openbox_mw_evaluation_duration_seconds_bucket[10m]))) > 20

# Halts: each one stops a sandbox. Page a person.
increase(openbox_mw_evaluations_total{reason_code="openbox_halted"}[5m]) > 0

# A halted sandbox could not be stopped.
increase(openbox_mw_halt_stops_total{outcome="failed"}[5m]) > 0

# No door guard ready.
sum(up{job="<door guard scrape job>"}) < 1
```

Watch, without paging, the rate of `openbox_blocked` and
`openbox_approval_required`. A sudden jump is usually a policy change in
OpenBox.

## Verdicts are slow

A model-call verdict takes 3 to 8 seconds. That is normal. Look further when
the p99 of `openbox_mw_evaluation_duration_seconds` climbs toward 29 s.

1. Find which Core call is slow:
   `histogram_quantile(0.99, sum by (call, le) (rate(openbox_mw_core_duration_seconds_bucket[10m])))`.
   `evaluate` is policy, guardrails and behavior rules. `session` is the first
   request of each sandbox. `approval` is a retry checking its approval.
2. Check Core. The door guard waits for Core and does little else.
3. Check one sandbox's queue. The door guard sends each sandbox's events to
   Core in order, so a request waits for that sandbox's earlier events.
4. Check the door guard pods for CPU throttling and restarts.

[Fast-path verdicts](/developer-guide/openshell/controls#fast-path-verdicts)
can answer known-safe requests without waiting for Core.

## Requests are denied with `openbox_unavailable`

The door guard denies with `openbox_unavailable` whenever it gets no verdict.
It never allows instead. Its log line carries the reason code and the time
taken (`ms=`):

| Sign | Cause | Check |
|---|---|---|
| `ms=` near 29000 | Core slower than the budget | The slow-verdict steps above |
| `openbox_mw_core_requests_total{outcome="error"}` rising, short `ms=` | Core refused, failed or is unreachable | Core health; the agent's API key and workload key; DNS, network policy, Core's certificate, `openbox.url` |
| No Core call recorded for the request | The supervisor sent no sandbox id | The OpenShell version |

Then check the workload token: Core and the backend reject tokens without the
`openbox-core` audience, and a rotated or removed workload key fails here too.

If the sandbox sees `middleware_failed` instead, the door guard did not answer
at all: no ready pod, a TLS or extension-token mismatch with the gateway, or a
body over `max_payload_bytes`. The door guard returns a refused token to the
gateway as `unauthenticated` with the reason and does not log it itself, so
look in the gateway and supervisor logs.

## Halts

A halt denies everything from the sandbox with `openbox_halted` and stops it
through the gateway API. If the door guard has no gateway credential
(`gateway.api.endpoint`, `gateway.api.mtlsSecret`), it logs
`HALT denies traffic but cannot stop sandboxes` at startup, and a halted
sandbox keeps running with all traffic denied.

The door guard logs `halted sandbox <id> stopped stop_ms=<ms>` once the gateway
reports the sandbox stopped. `openbox_mw_halt_stop_seconds` is the time from
the halt verdict to that confirmation.

A halted sandbox is stopped, not deleted. Inspect it before you restart it.

### Resuming a halted sandbox

A halt is held in two places: OpenBox Core latches it on the session, and the
door guard replicas cache it. Resume clears both. It is off unless the door
guard has an admin token (`doorGuard.adminTokenSecret`, a Secret with
`admin-token`, 32 characters or more).

The admin token is also the key Core checks before it clears its halt. The
agent's own credentials are not enough, so a sandbox cannot resume itself.
Register the token with the agent once:

1. Compute the SHA-256 of the token. Hash it without a trailing newline:

   ```bash
   printf %s "$(cat admin-token)" | sha256sum | cut -d' ' -f1
   ```

   On macOS, use `shasum -a 256` in place of `sha256sum`.

2. Add the digest to the agent's config, under `openshell.resume_key_sha256`:

   ```json
   {
     "openshell": {
       "resume_key_sha256": ["<the 64 hex characters>"]
     }
   }
   ```

   The dashboard has no field for this yet. Set it with the backend's agent
   update call, `PUT https://api.openbox.ai/agent/<agent id>`, signed in as a
   user who can edit agents. The call replaces the whole `config` object.
   Read the agent first (`GET https://api.openbox.ai/agent/<agent id>`), add
   `openshell.resume_key_sha256` to its current `config`, and send all of it
   back as `{"config": {...}}`.

The list can hold more than one digest. To rotate the token, add the new
digest, switch the door guard to the new token, then remove the old digest.
Core records each resume as `resume-key:` and the first 12 characters of the
digest that matched.

To resume a sandbox:

```bash
kubectl -n openbox port-forward deploy/openbox-openbox-openshell-door-guard 9464 &
curl -X POST -H "Authorization: Bearer $(cat admin-token)" \
  "http://127.0.0.1:9464/admin/resume?sandbox_id=<sandbox id>"
openshell sandbox start <sandbox name>
```

`200` means the door guard and Core both cleared it; the replica that answers
tells the others through the shared store. `502` means the door guard cleared
it but Core did not, and requests stay halted until Core's halt is cleared.
The reply says why. If Core answered `403`, the token's digest is not
registered on the agent: register it and resume again.

:::note
Core's side of resume is not served yet, so today expect `502`.
:::

After the resume, the sandbox's traffic is scored again from its next request.

## Break-glass: run without OpenBox

Use this only when OpenBox is down, cannot be fixed fast enough, and the
sandboxes must run. While it is in effect, sandbox traffic is not governed.

**Log it before you start.** Record who, when, why, and the incident, in your
incident channel. Keep a copy of the gateway TOML as it was. Record the time
OpenBox was restored. Review every break-glass afterwards.

1. Remove three registrations from the gateway TOML: the `openbox`
   interceptor, the `openbox-inventory` interceptor, and the `openbox`
   supervisor middleware. Restart the gateway.
2. Sandboxes still carry the `network_middlewares.openbox` entry, and
   OpenShell refuses a policy that names a middleware that is not registered.
   With the front desk gone, the entry can be removed: update each sandbox's
   policy without it, or recreate the sandbox. Plan for a running sandbox's
   traffic to stop until its policy is updated.

To restore:

1. Fix and start OpenBox. Check `/readyz` on the door guard.
2. Put the three registrations back and restart the gateway.
3. Recreate every sandbox created or changed during the break-glass. The
   front desk attaches the door guard only when a sandbox is created, and
   refuses a later policy update that lacks the attachment.
4. [Audit provider profiles](/developer-guide/openshell/configuration#audit-provider-profiles-imported-earlier)
   imported or updated during the break-glass.

## Forwarding to your SIEM

There are two sources.

**OpenShell's OCSF log.** Each supervisor records every middleware call, its
decision and the reason code, in OCSF
(`status_detail: middleware_denied:openbox:<reason code>`). Turn the JSON
export on for all sandboxes:

```bash
openshell settings set --global --key ocsf_json_enabled --value true
```

Each sandbox then writes `/var/log/openshell-ocsf.YYYY-MM-DD.jsonl`. On
Kubernetes, `ocsfCollector.enabled: true` runs a DaemonSet that writes those
lines, unchanged, to its stdout for your log pipeline to ship. Elsewhere, run
`openbox-evidence collect-ocsf --dir /var/log --state <state file>` where the
files are.

**The door guard's log.** One line per verdict on stderr, carrying
`request_id`, `sandbox_id`, the decision, the reason code and the time taken.
Ship the pod logs.

OpenShell v0.1.8's OCSF events do not carry the request id, so join the two
sources on the sandbox id, host and time, with `openbox-evidence join` (below).
`request_id` joins the door guard's log with OpenBox Core.

## Signed verdict records

The door guard can write a signed, hash-chained record of every verdict. A
record edited, deleted, duplicated or moved after it was written is caught by
a verifier that needs only the public key.

Make an Ed25519 key, keep the private half in a Secret the sandboxes cannot
read, and keep the public half wherever you verify:

```bash
openssl genpkey -algorithm ed25519 -out evidence.pem
openssl pkey -in evidence.pem -pubout -out evidence.pub
kubectl -n openbox create secret generic openbox-evidence --from-file=evidence.pem
helm upgrade openbox ... --set doorGuard.evidenceKeySecret=openbox-evidence
```

Each door guard pod then writes one JSON line per verdict to its stdout, for
your log pipeline to keep. A record holds identifiers and the outcome only,
with the URL as its SHA-256; never content. There is one chain per sandbox per
pod. Alert on `openbox_mw_evidence_records_total{outcome="failed"}`: each one
is a gap.

`openbox-evidence` ships in the image next to the two services:

```bash
# Check every fingerprint, signature and chain link; exits 1 on any problem.
openbox-evidence verify --key evidence.pub records-*.jsonl

# Fix a stretch of a chain under one Merkle root, and check it later.
openbox-evidence seal --signing-key evidence.pem --chain <chain_uid> records-*.jsonl > cert.json
openbox-evidence check --key evidence.pub --certificate cert.json records-*.jsonl

# Pair each record with OpenShell's OCSF event for the same request.
openbox-evidence join --ocsf openshell-ocsf.2026-11-14.jsonl records.jsonl
```

With `doorGuard.evidenceCertifySecs` above 0, the door guard also sends each
chain's new records to Core that often, and Core returns an OpenBox Proof
Certificate signed with your organization's attestation key. Check one with
your organization's public key:

```bash
openbox-evidence check --core-key org-attestation.pub --certificate cert-line.json records-*.jsonl
```

See [Attestation & Cryptographic Proof](/administration/attestation-and-cryptographic-proof) for how OpenBox attests
governance decisions.
