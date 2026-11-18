---
title: See It Block a Request
description: "Run OpenShell governed by OpenBox on one machine, then watch an OpenBox policy allow, block and hold a sandbox's request for approval."
llms_description: Hands-on OpenShell walkthrough, allow then block then approve
sidebar_position: 1
tags:
  - getting-started
  - openshell
---

# See It Block a Request

This walkthrough runs an OpenShell gateway governed by OpenBox on your own
machine. A sandbox makes an ordinary web request. OpenBox allows it, then you
write one rule in the dashboard and watch the same request get blocked, then
held for your approval.

It needs no Kubernetes and no certificates. It is for trying the integration
out; for a real install, see [Getting Started with OpenShell](/getting-started/openshell).

## What you need

- **macOS**, with the OpenShell v0.1.8 binaries installed (`bin/openshell`,
  `bin/openshell-gateway` and `libexec/openshell-driver-vm` under one
  directory).
- **A Rust toolchain.** The script builds both services from source; the first
  build takes a few minutes.
- **Redis** on `localhost:6379`.
- **An agent in the OpenBox dashboard with a workload identity.** Save the env
  snippet the dashboard shows for it (`OPENBOX_API_URL`, `OPENBOX_API_KEY`,
  `OPENBOX_WORKLOAD_PRIVATE_KEY`) unchanged as `agent.env`.

## 1. Start everything

```bash
git clone https://github.com/OpenBox-AI/openbox-openshell
cd openbox-openshell

export OPENSHELL_PREFIX=<directory holding bin/openshell>
export OPENBOX_BACKEND_URL=-          # skip the AI Inventory for this walkthrough
middleware/scripts/openbox-openshell.sh up --agent-env agent.env
```

`up` checks the agent's credentials against Core, builds and starts the door
guard and the front desk, and starts an OpenShell gateway of its own, so no
gateway you already run is touched. It ends by printing the commands for the
next step.

:::caution Development only
This setup runs without TLS between the gateway and the two services. The
connections to OpenBox are the real ones.
:::

## 2. Create a sandbox and make a request

Point the `openshell` CLI at the new gateway and create a sandbox from the
policy `up` wrote. The policy says nothing about OpenBox:

```bash
export PATH=/tmp/obx-dev/bin:$PATH
openshell sandbox create --name my-box --policy /tmp/obx-dev/policy.yaml \
  --detach --no-tty --no-auto-providers
openshell policy get my-box --full | grep 'middleware: openbox'
```

The `grep` finds the `openbox` middleware: the front desk attached it when the
sandbox was created.

Now make a request from inside the sandbox. Save this as a small helper, since
you will run it a few times:

```bash
fetch() {
  openshell sandbox exec -n my-box --no-tty -- bash -c \
    "exec 3<>/dev/tcp/example.com/80; printf 'GET /?$1 HTTP/1.1\r\nHost: example.com\r\nConnection: close\r\n\r\n' >&3; head -1 <&3"
}

fetch demo=hello
```

```
HTTP/1.1 200 OK
```

The door guard asked OpenBox Core for a verdict before the request left, and
logged it:

```bash
grep 'openbox: eval' /tmp/obx-dev/door-guard.log | tail -1
```

```
openbox: eval request_id=<id> sandbox_id=<id> decision=allow reason_code=- ms=<ms>
```

## 3. Block it with a policy rule

In the OpenBox dashboard, open the agent, go to **Authorize → Policies**, and
create a rule with the visual builder:

| Setting | Value |
|---|---|
| Field | `spans[_].attributes.http.url` |
| Operator | contains |
| Value | `demo=block` |
| Decision | `BLOCK` |
| Reason | `demo=block is not allowed` |

Save it and wait for it to show as enforced on the agent, which can take a
minute or two. Then:

```bash
fetch demo=hello      # HTTP/1.1 200 OK        (the rule does not match)
fetch demo=block      # HTTP/1.1 403 Forbidden
```

The second request never reached example.com. The sandbox received a `403`
whose body names the reason:

```json
{
  "error": "middleware_denied",
  "detail": "Request rejected by configured middleware",
  "policy": "<network policy name>",
  "middleware": "openbox",
  "reason_code": "openbox_blocked"
}
```

The door guard's log says the same, with your rule's reason:

```
openbox: eval ... decision=deny reason_code=openbox_blocked ms=<ms> reason="demo=block is not allowed"
```

## 4. Hold one for approval

Add a second rule the same way: value `demo=approve`, decision
`REQUIRE_APPROVAL`. Once it is enforced:

```bash
fetch demo=approve    # HTTP/1.1 403 Forbidden   (openbox_approval_required)
```

Open **Approvals** in the dashboard. The request is waiting there; approve it.
Then send the identical request again:

```bash
fetch demo=approve    # HTTP/1.1 200 OK
```

OpenShell cannot hold a request open while a person decides, so an approval is
deny-then-retry: the identical retry goes through once it is approved. Real
agents do this with a [retry helper](/developer-guide/openshell/approvals#retry-helpers).

## 5. Look at the session

Open the agent's **Sessions** tab. The sandbox is one session, and its
timeline holds every request with its verdict:

![An OpenShell sandbox's session: each request is an activity with its verdict](/img/openshell/session-timeline.webp)

The **Verify** tab shows the session's integrity check: every event is
hash-chained and signed.

## 6. Clean up

```bash
openshell sandbox delete my-box
middleware/scripts/openbox-openshell.sh down
```

Delete the two demo rules from the agent too. `down` stops every process,
deletes the sandboxes and removes the stored credentials; logs stay in
`/tmp/obx-dev`.

Want a scripted agent instead of hand-made requests?
`middleware/scripts/openbox-openshell.sh demo` runs a short session (a prompt,
a model call that asks for a tool, the tool's web request, and the answer) and
prints what to expect in the dashboard.

## Next steps

- **[Getting Started with OpenShell](/getting-started/openshell)**: install on your OpenShell gateway on Kubernetes
- **[Approvals for Agent Authors](/developer-guide/openshell/approvals)**: every reason code, and the retry helpers
- **[Policies](/trust-lifecycle/authorize/policies)**: writing policy rules
