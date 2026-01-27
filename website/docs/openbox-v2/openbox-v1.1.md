# Product Requirements Document: OpenBox AI v1.1

## Overview

**Product Name:** OpenBox AI v1.1
**Author:** Product Team
**Date:** December 25, 2025
**Status:** Draft
**Version:** 1.1.0

---

## Executive Summary

OpenBox AI v1.1 represents a major evolution in AI agent governance, introducing **intelligent risk-based decision making** that transforms static binary controls into adaptive, context-aware governance. While v1.0 established foundational governance with cryptographic attestation and policy enforcement, v1.1 adds three critical capabilities:

1. **Risk Intelligence**: AIVSS-based 4-tier risk scoring replaces hardcoded risk levels, enabling adaptive policy enforcement based on agent characteristics and operational context.

2. **Behavioral Governance**: Stateful behavioral conformance and goal alignment checking work alongside stateless OPA policies to detect complex workflow violations and goal drift in real-time.

3. **Graduated Response**: A 5-tier verdict system (HALT/BLOCK/REQUIRE_APPROVAL/CONSTRAIN/ALLOW) with built-in human-in-the-loop workflows replaces binary continue/stop decisions, providing nuanced control over agent actions.

**Key Value Proposition**: OpenBox v1.1 enables organizations to govern AI agents with the same sophistication they apply to human employees—risk-based access controls, behavioral monitoring, approval workflows, and containment strategies—all while maintaining the cryptographic attestation and compliance automation of v1.0.

### What's New in v1.1

| Capability | v1.0 | v1.1 |
|------------|------|------|
| Trust Score | Hardcoded 0.0 | AIVSS 14-parameter model |
| Trust Tiers | None | 4 tiers (Tier 1/2/3/4) |
| Policy Evaluation | Stateless (OPA only) | Stateless + Stateful (Behavioral) |
| Goal Alignment | None | LlamaFirewall-powered verification |
| Verdict Types | 2 (continue/stop) | 5 (ALLOW/CONSTRAIN/REQUIRE_APPROVAL/BLOCK/HALT) |
| Human Approval | Manual integration | Built-in HITL workflows |
| Semantic Types | None | 21 governance-relevant classifications |

---

## Problem Statement

### Gaps in OpenBox v1.0

While OpenBox v1.0 successfully established the foundation for AI agent governance, real-world deployments revealed critical limitations:

1. **Binary Verdict Rigidity**: Only two verdicts (continue/stop) force all-or-nothing decisions. There's no way to:
   - Pause execution pending human approval
   - Execute actions in sandboxed environments
   - Gracefully halt vs. immediately block

2. **No Trust-Based Differentiation**: All agents are treated equally (trust score hardcoded to 0.0). A read-only research agent and a production database admin agent receive identical policy evaluation, despite vastly different trust profiles.

3. **Stateless Policy Blindness**: OPA evaluates each event in isolation, unable to detect behavioral patterns like:
   - "Agent accessed PII, then attempted external API call without approval"
   - "Code execution attempted without prior security scan"
   - "File deletion without recent backup"

4. **No Goal Alignment Verification**: Agents can drift from stated objectives without detection. An agent tasked with "read customer data" could delete files, and the system wouldn't flag the misalignment until policy violation.

5. **Manual HITL Integration**: Human approval workflows must be custom-built by each customer. There's no standardized approval request/response mechanism.

6. **Limited Semantic Understanding**: Events are captured as raw operations (HTTP call, DB query) without classification into governance-relevant semantic types (PII access, external data sharing, destructive action).

### Impact on Customers

These limitations force customers to choose between:
- **Over-restrictive policies** that block legitimate agent operations
- **Under-restrictive policies** that allow risky behavior

Neither option supports the nuanced governance required for production AI agent deployment.

---

## Non-Functional Requirements

### Multi-Tenancy Requirements (Critical)

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-MT-1 | Org-scoped data isolation | Zero cross-org data leakage | Critical |
| NFR-MT-2 | All AGE components must accept and enforce `org_id` parameter | 100% API coverage | Critical |
| NFR-MT-3 | Database tables must use RLS with org_id for tenant isolation | All tables protected | Critical |
| NFR-MT-4 | OPA policies must evaluate org context in decisions | Org-aware policies | Critical |
| NFR-MT-5 | Approval workflows must be org-scoped (no cross-org visibility) | Complete isolation | Critical |
| NFR-MT-6 | API endpoints must validate org ownership via Auth0 JWT | JWT validation on all endpoints | Critical |
| NFR-MT-7 | Behavioral rules must be configurable per-org | Per-org YAML configs | High |

### Rate Limiting Requirements

| ID | Endpoint | Limit | Priority |
|----|----------|-------|----------|
| NFR-RL-1 | `/governance/authorize` | 1,000 requests/min per org | Critical |
| NFR-RL-2 | `/telemetry/events` | 5,000 requests/min per org | Critical |
| NFR-RL-3 | `/governance/approvals/request` | 100 requests/min per org | Critical |
| NFR-RL-4 | Rate limit responses | 429 with retry-after header | High |
| NFR-RL-5 | Org isolation | Org A at limit doesn't block Org B | Critical |

### Performance Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-PERF-1 | Governance decision latency | `<250ms` p95 | Critical |
| NFR-PERF-2 | Policy evaluation | `<10ms` average | Critical |
| NFR-PERF-3 | Trust tier lookup | `<5ms` average | Critical |
| NFR-PERF-4 | Behavioral check | `<30ms` p95 | Critical |
| NFR-PERF-5 | Goal alignment check | `<100ms` p95 | High |
| NFR-PERF-6 | HITL approval response | `<30s` p95 (human time) | High |
| NFR-PERF-7 | Org-scoping latency overhead | `<50ms` p95 | Critical |

### Scalability Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-SCALE-1 | Organizations supported | 100+ | Critical |
| NFR-SCALE-2 | Agents per organization | 10,000+ | Critical |
| NFR-SCALE-3 | Policy evaluations | 1,000+/min | Critical |
| NFR-SCALE-4 | Trust tier lookups | 10,000+/min | Critical |
| NFR-SCALE-5 | Behavioral checks | 5,000+/min | Critical |
| NFR-SCALE-6 | Alignment checks | 1,000+/min (LLM rate limit) | High |
| NFR-SCALE-7 | Approval requests | 100+/min | High |

### Reliability Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-REL-1 | Service uptime | 99.9% | Critical |
| NFR-REL-2 | Graceful degradation | LlamaFirewall fallback to heuristic | High |
| NFR-REL-3 | Database reliability | PostgreSQL with connection pooling and failover | High |
| NFR-REL-4 | Test coverage | >80% unit, 100% critical path integration | Critical |

---

## Goals

### Business Goals

1. **Market Differentiation**: Establish OpenBox as the only AI governance platform with risk-aware, behaviorally-intelligent decision making (vs. competitors' static rule engines)
2. **Enterprise Expansion**: Enable deployment in high-risk industries (finance, healthcare, critical infrastructure) requiring sophisticated risk controls
3. **Revenue Growth**: Increase ACV by 40% through premium risk intelligence features
4. **Competitive Moat**: Patent AIVSS-based governance approach for AI agents

### User Goals

1. **Security Architects**: Implement trust-tiered access controls matching organizational governance frameworks
2. **Compliance Officers**: Demonstrate behavioral monitoring capabilities for EU AI Act High-Risk System requirements
3. **AI Engineers**: Deploy agents with confidence that risky actions trigger approval workflows automatically
4. **DevOps Teams**: Reduce false positives from overly strict policies via graduated response system

### Product Goals

1. **Trust Accuracy**: AIVSS trust tier assignment matches expert security assessments in 95%+ of cases
2. **Behavioral Detection**: Identify 90%+ of multi-step policy violations missed by stateless evaluation
3. **Approval Latency**: HITL approval requests return decision within 30 seconds at p95
4. **Backward Compatibility**: v1.0 agents upgrade to v1.1 with zero code changes (SDK compatibility)
5. **Performance**: Add `<50ms` p95 latency overhead vs. v1.0 governance evaluation

---

## Success Metrics

### Primary KPIs

| Metric | v1.0 Baseline | v1.1 Target | Measurement |
|--------|---------------|-------------|-------------|
| Trust Tier Accuracy | N/A (hardcoded) | 95% match with expert review | Blind comparison study |
| Behavioral Violation Detection | 0% (no capability) | 90% pattern detection | Synthetic attack scenarios |
| False Positive Rate | 15% | `<5%` | Customer reported blocks |
| HITL Response Time (p95) | N/A | `<30` seconds | Approval workflow telemetry |
| Governance Latency (p95) | 180ms | `<230ms` (+50ms) | APM monitoring |

### Secondary KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Agents with Trust Tiers Configured | 80% within 3 months | Platform analytics |
| Behavioral Rules Deployed | Avg 5 rules per organization | Dashboard metrics |
| HITL Approvals Processed | 1,000+ in first month | Approval API logs |
| Goal Alignment Checks | 10,000+ per day | Alignment service telemetry |
| v1.0 → v1.1 Upgrade Rate | 90% within 6 months | Version tracking |

---

## User Personas

### Updated from v1.0

#### 1. Alex - AI Engineer (Updated)

**Role**: Senior AI Engineer at a fintech company
**Experience**: 5+ years, building Temporal-based AI agents for trading
**Pain Points**:
- ~~Struggles to explain agent decisions to compliance team~~ (solved in v1.0)
- **NEW**: Cannot differentiate Tier 1 research agents from Tier 4 trading agents
- **NEW**: No way to pause agent execution pending manager approval for large trades
- **NEW**: Agent drift from trading strategy goals goes undetected

**Goals**:
- **NEW**: Configure trust tiers matching internal trust framework
- **NEW**: Automatic approval workflows for trades over $100K
- Real-time visibility into governance decisions (v1.0 feature)

**Quote**: "I need governance that treats my market data agent and my trade executor differently—one reads data, the other moves millions of dollars."

#### 2. Sarah - Security Architect (Updated)

**Role**: Head of Application Security at healthcare org
**Experience**: 10+ years, HIPAA/SOC 2 compliance
**Pain Points**:
- ~~Cannot audit AI agent behavior for compliance~~ (solved in v1.0)
- **NEW**: All agents receive same policy treatment regardless of risk level
- **NEW**: Need to enforce "PII access requires approval before external sharing"
- **NEW**: Cannot detect when agents deviate from stated medical protocol goals

**Goals**:
- **NEW**: Trust-tiered policy enforcement (Tier 4 agents get strictest controls)
- **NEW**: Behavioral rules like "security scan required before code execution"
- Complete audit trail of all agent operations (v1.0 feature)

**Quote**: "I need to enforce the same principle of least privilege for AI agents that we apply to human users—risk-based access with behavioral monitoring."

#### 3. Marcus - DevOps Lead (Updated)

**Role**: Platform Engineering Lead at e-commerce company
**Experience**: 8+ years, Kubernetes/Temporal expertise
**Pain Points**:
- ~~AI governance tools don't fit existing deployment patterns~~ (solved in v1.0)
- **NEW**: Binary block/allow verdicts cause too many false positives
- **NEW**: No way to sandbox risky operations instead of blocking them
- **NEW**: Manual approval workflow integration is painful

**Goals**:
- **NEW**: Graduated response—sandbox risky actions instead of blocking
- **NEW**: Built-in approval queue UI for operations team
- Non-invasive integration with existing Temporal setup (v1.0 feature)

**Quote**: "I don't want to block every risky operation—I want options: approve it, sandbox it, or constrain it with limits."

#### 4. Diana - Compliance Officer (Updated)

**Role**: VP of Compliance at insurance company
**Experience**: 15+ years, regulatory compliance
**Pain Points**:
- ~~Manual audit trail creation for AI systems~~ (solved in v1.0)
- **NEW**: EU AI Act requires risk classification and behavioral monitoring for High-Risk AI
- **NEW**: Need proof that agents operate within intended goals and don't drift
- **NEW**: Auditors ask "How do you know the agent didn't go rogue?"

**Goals**:
- **NEW**: AIVSS risk documentation for regulatory submissions
- **NEW**: Behavioral conformance reports showing workflow compliance
- **NEW**: Goal alignment audit trail proving agent stayed on task
- One-click compliance reports (v1.0 feature)

**Quote**: "The EU AI Act requires us to classify our AI systems by risk and monitor their behavior. OpenBox v1.1 gives me both in one platform."

### New Persona for v1.1

#### 5. Priya - AI Safety Researcher

**Role**: AI Safety Lead at autonomous vehicle company
**Experience**: 7+ years, safety-critical AI systems
**Pain Points**:
- Need to enforce complex safety protocols (e.g., "double-check sensor data before navigation commands")
- No way to verify autonomous agents stay aligned with safety objectives
- Manual approval processes don't scale to thousands of daily decisions

**Goals**:
- Define behavioral rules for safety-critical sequences
- Real-time goal alignment verification ("is this navigation command safe given current conditions?")
- Automatic escalation of safety-critical decisions to human operators

**Quote**: "For safety-critical AI, I need behavioral rules like 'you must validate sensor inputs before motion control' and immediate human escalation when goals misalign."

---

## User Stories with Acceptance Criteria

### Epic 5: Risk Intelligence (AIVSS Integration)

#### S5.1: AIVSS Configuration During Agent Registration

**As an** AI Engineer,
**I want to** configure AIVSS parameters when registering an agent,
**So that** the system assigns an appropriate trust tier automatically.

**Acceptance Criteria**:
- [ ] Agent registration UI includes AIVSS configuration section (collapsible)
- [ ] All 14 AIVSS parameters presented with descriptions:
  - Base Security (5): attack_vector, attack_complexity, privileges_required, user_interaction, scope
  - AI-Specific (5): model_robustness, data_sensitivity, ethical_impact, decision_criticality, adaptability
  - Impact (4): confidentiality_impact, integrity_impact, availability_impact, safety_impact
- [ ] Each parameter shows dropdown with 1-5 scale and descriptions
- [ ] Real-time trust tier preview as parameters are selected
- [ ] "Use Template" button pre-fills common configurations:
  - Research Agent (Tier 1)
  - Internal Automation (Tier 2)
  - Customer Data Agent (Tier 3)
  - Production Admin (Tier 4)
- [ ] Trust tier (Tier 1/2/3/4) calculated and displayed before submission
- [ ] AIVSS score breakdown shown (base 25%, AI-specific 45%, impact 30%)
- [ ] Agent list shows trust tier badge for each agent

**Technical Notes**:
- Risk calculation uses AGE `/api/v1/agents/register` endpoint
- AIVSS config stored in agent metadata table
- Trust tier used in policy evaluation and UI filtering

---

#### S5.2: Trust Tier Display and Management

**As a** Security Architect,
**I want to** view and filter agents by trust tier,
**So that** I can audit high-risk agents separately.

**Acceptance Criteria**:
- [ ] Agent list page shows trust tier badge:
  - Tier 1 (90-100): Green badge "Trusted"
  - Tier 2 (75-89): Blue badge "Confident"
  - Tier 3 (50-74): Orange badge "Monitor"
  - Tier 4 (25-49): Red badge "Restrict"
- [ ] Filter agents by trust tier (multi-select)
- [ ] Agent detail page displays AIVSS configuration card:
  - Trust tier and score
  - "View AIVSS Details" expandable section
  - All 14 parameters with current values
  - Last updated timestamp
- [ ] "Recalculate Trust Score" button triggers re-evaluation
- [ ] Edit AIVSS parameters with reason field (audit trail)
- [ ] Dashboard widget: "Agents by Trust Tier" pie chart
- [ ] Dashboard widget: "Governance Alert Activity" timeline

---

#### S5.3: Risk-Based Policy Enforcement

**As a** Security Architect,
**I want** OPA policies to consider agent trust tier,
**So that** high-risk agents face stricter controls.

**Acceptance Criteria**:
- [ ] OPA authorization receives `risk_tier` in input:
  ```rego
  input = {
    "agent_id": "...",
    "risk_tier": 3,
    "operation": "database_delete",
    ...
  }
  ```
- [ ] Policy templates include trust-tier examples:
  ```rego
  # Tier 4 agents cannot delete production data
  deny["Tier 4 agents prohibited from destructive actions"] {
    input.risk_tier == 4
    input.operation == "database_delete"
    input.environment == "production"
  }
  ```
- [ ] Policy editor shows trust tier in test input
- [ ] Policy test cases can specify trust tier
- [ ] Governance event logs include trust tier
- [ ] Attestations include trust tier in signed data

**Technical Notes**:
- OpenBox Core fetches trust tier from AGE metadata before OPA call
- Trust tier added to governance context for all evaluations

---

#### S5.4: Trust Tier Analytics

**As a** Compliance Officer,
**I want** trust tier analytics and reporting,
**So that** I can demonstrate risk-appropriate controls to auditors.

**Acceptance Criteria**:
- [ ] Dashboard page: "Risk Overview"
  - Total agents per tier (breakdown)
  - Policy violations by tier (are Tier 4 agents safer?)
  - Avg governance latency by tier
- [ ] Trust tier trend over time (are we adding more agents in lower trust tiers?)
- [ ] Export trust tier report (CSV/PDF):
  - Agent name, tier, AIVSS score, justification
  - Policy violations in last 30 days
  - Approval requests in last 30 days
- [ ] Compliance framework mapping includes trust tier
- [ ] Audit log includes trust tier changes

---

### Epic 6: Behavioral Governance

#### S6.1: Behavioral Conformance Rule Engine Integration

**As a** Platform Architect,
**I want** behavioral conformance checking integrated into governance workflow,
**So that** stateful behavioral rules complement stateless OPA policies.

**Acceptance Criteria**:
- [ ] OpenBox Core calls AGE Behavioral Conformance API after OPA evaluation:
  ```
  OPA (stateless) → Behavioral Conformance (stateful) → Goal Alignment → Containment
  ```
- [ ] Behavioral rules stored in AGE (YAML format)
- [ ] State tracker maintains per-agent semantic type history
- [ ] Conformance results merged with OPA results in containment logic
- [ ] Conformance violations logged with rule name and missing conditions
- [ ] Attestations include conformance evaluation results
- [ ] Performance: Behavioral check adds `<30ms` p95 latency

**Technical Notes**:
- New activity: `EvaluateBehavioralConformanceActivity`
- Calls AGE `/api/v1/governance/conformance/check`
- State tracked in-memory (per-agent session), optionally persisted to PostgreSQL

---

#### S6.2: Behavioral Rule Management UI

**As a** Security Architect,
**I want to** create and manage behavioral conformance rules via dashboard,
**So that** I can enforce complex workflow policies.

**Acceptance Criteria**:
- [ ] Agent Detail → Authorize tab → Behavior sub-tab
- [ ] Rule list shows:
  - Rule name
  - Trigger semantic type
  - Required prior states (count)
  - Verdict if violated
  - Enabled/Disabled toggle
  - Priority
- [ ] Create Rule wizard:
  - Step 1: Basic info (name, description, priority)
  - Step 2: Trigger (select semantic type from dropdown)
  - Step 3: Required Prior States (multi-select semantic types)
  - Step 4: Advanced (depends_on, within_minutes)
  - Step 5: Enforcement (verdict, on_reject, on_timeout, timeout_minutes, reason)
  - Preview YAML output
- [ ] Rule editor (Monaco) for YAML editing
- [ ] "Test Rule" simulator:
  - Input: sequence of semantic types
  - Output: Would rule trigger? Missing conditions?
- [ ] Rule templates:
  - "Approval before external sharing"
  - "Security scan before code execution"
  - "Backup before delete"
- [ ] Rule deployment with version tracking:
  - Each rule change creates a new version (immutable)
  - Version history retained (last 10 versions per rule)
  - Active version clearly marked
  - Rollback to any previous version with one click
  - Version comparison view (diff between versions)
  - Version metadata: author, timestamp, change reason
- [ ] Audit log for rule changes:
  - Who changed what and when
  - Before/after values
  - Reason field (required for production changes)

**Technical Notes**:
- Rules stored in AGE (YAML files)
- Dashboard API proxies to AGE `/api/v1/conformance/rules` endpoints
- Rule changes trigger AGE reload

---

#### S6.3: Goal Alignment Integration

**As an** AI Safety Researcher,
**I want** automatic goal alignment verification for every agent action,
**So that** I detect goal drift in real-time.

**Acceptance Criteria**:
- [ ] Goal captured at AGENT_START event (stored in AGE)
- [ ] Every TOOL_INVOKE event checked for alignment:
  - LlamaFirewall scanner if API keys configured
  - Fallback heuristic if LlamaFirewall unavailable
- [ ] Alignment result includes:
  - `is_aligned`: boolean
  - `score`: 0.0 (aligned) or 1.0 (misaligned)
  - `reason`: explanation
  - `available`: whether LlamaFirewall was used
- [ ] Misalignment triggers REQUIRE_APPROVAL verdict
- [ ] Alignment results logged in governance events
- [ ] Alignment results included in attestations
- [ ] Dashboard shows alignment score per session

**Technical Notes**:
- New activity: `CheckGoalAlignmentActivity`
- Calls AGE `/api/v1/governance/alignment/check`
- Requires OPENAI_API_KEY or TOGETHER_API_KEY in AGE config

---

#### S6.4: Semantic Type Classification

**As a** Platform Architect,
**I want** automatic semantic type assignment for all events,
**So that** behavioral rules and goal alignment can reason about event meaning.

**Acceptance Criteria**:
- [ ] Semantic classifier integrated in OpenBox Core
- [ ] Supported semantic types (21 total):
  - Data Access: `file_read`, `file_write`, `file_delete`, `database_query`, `database_insert`, `database_update`, `database_delete`
  - External: `external_api_call`, `email_send`, `slack_message`
  - Sensitive: `pii_data`, `credential_access`, `authentication`
  - Operations: `code_execution`, `shell_command`, `container_create`
  - Governance: `approval_received`, `approval_rejected`, `security_scan`, `backup_created`
  - Other: `unknown`, `agent_start`
- [ ] Classification rules (tool name → semantic type mapping):
  - `read_file` → `file_read`
  - `delete_database_record` → `database_delete`
  - `send_email` → `email_send`
  - Custom mappings configurable per organization
- [ ] Semantic type included in all governance events
- [ ] UI shows semantic type badge on event timeline
- [ ] Filter events by semantic type

**Technical Notes**:
- Semantic classifier in AGE or OpenBox Core (TBD)
- Classification happens before OPA/Behavioral/Alignment checks
- Extensible mapping system for custom tool types

---

#### S6.5: State Tracking Dashboard

**As a** DevOps Lead,
**I want** visibility into agent state tracking,
**So that** I can debug behavioral rule evaluations.

**Acceptance Criteria**:
- [ ] Agent Detail → Monitor tab shows per-session state:
  - "Accessed Semantic Types" timeline
  - Visual flowchart of state progression
  - Highlight when behavioral rules triggered
- [ ] Session Replay includes state annotations:
  - "At this point, agent had accessed: [pii_data, file_read]"
  - "Behavioral rule 'Approval before external sharing' triggered here"
- [ ] Behavioral rule evaluation results in event details:
  - Rule name
  - Current state summary
  - Missing conditions
  - Verdict applied
- [ ] "State Debugger" tool:
  - Input: sequence of semantic types
  - Output: Which rules would trigger at each step?

---

### Epic 7: Graduated Response

#### S7.1: 5-Tier Verdict System

**As a** Platform Architect,
**I want** OpenBox SDK to support 5 verdict types,
**So that** governance decisions provide nuanced control.

**Acceptance Criteria**:
- [ ] SDK verdict enum updated:
  ```python
  class Verdict(Enum):
      ALLOW = "allow"           # v1.0
      BLOCK = "block"           # NEW (replaces "deny")
      REQUIRE_APPROVAL = "require_approval"  # NEW
      CONSTRAIN = "constrain"   # NEW
      HALT = "halt"             # NEW (replaces "stop")
  ```
- [ ] Containment strategy in AGE returns verdict priority:
  ```
  HALT > BLOCK > REQUIRE_APPROVAL > CONSTRAIN > ALLOW
  ```
- [ ] OpenBox Core maps AGE verdicts to Temporal signals:
  - `ALLOW` → workflow continues
  - `BLOCK` → activity fails with error, workflow continues
  - `REQUIRE_APPROVAL` → activity pauses, sends signal to approval workflow
  - `CONSTRAIN` → activity executes with sandbox wrapper (future)
  - `HALT` → workflow terminates with error
- [ ] SDK handles all 5 verdicts gracefully
- [ ] Verdict reasoning included in response
- [ ] Attestations include verdict type

**Technical Notes**:
- Backward compatibility: v1.0 `continue` → `ALLOW`, `stop` → `HALT`
- New Temporal activity: `HandleApprovalRequiredActivity`

---

#### S7.2: HITL Approval Workflow

**As a** DevOps Lead,
**I want** built-in human-in-the-loop approval workflows,
**So that** risky actions pause execution pending human decision.

**Acceptance Criteria**:
- [ ] When verdict = REQUIRE_APPROVAL:
  - Workflow pauses (activity blocked)
  - Approval request created in AGE
  - Notification sent to approval queue
  - Workflow polls for approval decision
- [ ] Approval request schema:
  ```json
  {
    "approval_id": "apr_xxx",
    "agent_id": "agent_xxx",
    "session_id": "session_xxx",
    "event_id": "evt_xxx",
    "operation": "database_delete",
    "reason": "Tier 4 agent (low trust) attempting destructive action",
    "requested_at": "2025-12-25T10:00:00Z",
    "expires_at": "2025-12-25T10:05:00Z",
    "status": "pending",
    "context": {
      "tool_name": "delete_database_records",
      "arguments": {...},
      "risk_tier": 4
    }
  }
  ```
- [ ] Approval polling timeout (default: 5 minutes, configurable)
- [ ] Timeout behavior based on rule `on_timeout`: block or halt
- [ ] Approval decision options:
  - Approve → action proceeds
  - Reject → action blocked (or halted based on `on_reject`)
  - Modify → change parameters and approve (future)
- [ ] Approval history logged in audit trail
- [ ] Attestations include approval decision

**Technical Notes**:
- New Temporal workflow: `ApprovalWorkflow`
- AGE endpoints: `/api/v1/governance/approvals/*`
- Approval metadata stored in Supabase

---

#### S7.3: Approval Queue UI

**As an** Operations Manager,
**I want** a dashboard to review and approve pending agent actions,
**So that** I can provide human oversight for risky operations.

**Acceptance Criteria**:
- [ ] New page: "Approvals" (main navigation)
- [ ] Approval queue shows:
  - Agent name + trust tier badge
  - Operation type (semantic type)
  - Requested at timestamp
  - Time remaining until timeout
  - Risk context summary
  - "View Details" button
- [ ] Approval detail modal:
  - Full event context (tool name, arguments, input/output previews)
  - Why approval required (rule name, reason)
  - Risk assessment (tier, AIVSS score)
  - Related session link
  - "Approve" and "Reject" buttons with reason field
- [ ] Real-time updates (WebSocket or polling)
- [ ] Filter by:
  - Status (pending, approved, rejected, expired)
  - Trust tier
  - Agent
  - Time range
- [ ] Approval actions:
  - Approve (with optional comment)
  - Reject (with required reason)
  - Escalate (assign to another user)
- [ ] Email/Slack notifications for new approval requests (configurable)
- [ ] Approval SLA tracking (time to decision)

**Technical Notes**:
- Dashboard API: `/api/v1/approvals/*`
- Real-time via Server-Sent Events (SSE)
- Notification integration with existing org settings

---

#### S7.4: CONSTRAIN Verdict (Sandbox Execution)

**As a** Security Architect,
**I want** risky actions to execute in sandboxed environments,
**So that** I can allow operations with reduced blast radius.

**Acceptance Criteria**:
- [ ] Containment strategy returns CONSTRAIN for:
  - High-risk semantic types (e.g., `code_execution`, `shell_command`)
  - Tier 3/4 agents performing unusual operations
  - Operations flagged by behavioral rules as "risky but allowed"
- [ ] SDK receives CONSTRAIN verdict with constraints:
  ```json
  {
    "verdict": "constrain",
    "constraints": {
      "timeout_seconds": 30,
      "max_memory_mb": 512,
      "network_access": "none",
      "filesystem_access": "read_only"
    }
  }
  ```
- [ ] SDK applies constraints:
  - Timeout enforcement
  - Memory limits (via container resource limits)
  - Network isolation (firewall rules)
  - Filesystem access restrictions
- [ ] Sandbox execution logged as governance event
- [ ] Sandbox violations (e.g., timeout exceeded) trigger HALT
- [ ] UI shows sandbox icon for constrained operations

**Technical Notes**:
- Phase 1 (v1.1): CONSTRAIN returns constraints, SDK logs warning (no enforcement)
- Phase 2 (v1.2): Full sandbox execution via Docker containers
- Requires SDK enhancement for sandbox wrapper

---

#### S7.5: HALT Verdict Handling

**As an** AI Engineer,
**I want** critical violations to halt agent execution gracefully,
**So that** I can debug issues without data corruption.

**Acceptance Criteria**:
- [ ] HALT verdict triggers Temporal workflow termination:
  - Activity fails with `GovernanceViolationError`
  - Workflow canceled with reason
  - Cleanup hooks executed (close DB connections, release locks)
- [ ] HALT reasons:
  - Critical policy violation (OPA)
  - Behavioral rule with `on_reject: halt`
  - Goal alignment violation with safety risk
  - Repeated approval rejections (3 strikes)
- [ ] Agent status set to "Halted" in dashboard
- [ ] HALT event triggers:
  - Email notification to agent owner
  - Slack/PagerDuty alert (if configured)
  - Incident created in audit log
- [ ] Dashboard shows "Halted Sessions" section:
  - Halt reason
  - Last event before halt
  - Remediation suggestions
  - "Resume" button (if safe, admin only)
- [ ] Attestation created for HALT event

**Technical Notes**:
- Workflow termination uses Temporal `CancelWorkflowExecution`
- HALT metadata stored for post-mortem analysis

---

### Epic 8: Trust Adaptation (Phase 5 of Trust Lifecycle)

**Epic Overview**: Introduce dynamic trust management through feedback loops that adjust Trust Scores and Trust Tiers based on observed behavior, detect violation patterns, generate policy suggestions, and enable trust recovery workflows. This epic closes the Trust Lifecycle loop (Assess → Authorize → Monitor → Verify → **Adapt**), transforming OpenBox from reactive governance to adaptive, self-improving governance.

**Key Concepts**:
- **Trust Score**: Unified metric (0-100) combining AIVSS baseline + behavioral compliance + goal alignment
- **Dynamic Trust Tiers**: Trust Tier can degrade with violations or recover with compliance
- **Pattern Detection**: Identify systematic misalignment requiring policy changes
- **Policy Learning**: Auto-generate behavioral rule suggestions from violation patterns
- **Trust Recovery**: Gradual score increase for agents that demonstrate compliance

**Dependencies**: Requires Epic 5 (AIVSS), Epic 6 (Behavioral + Goal Alignment), Epic 7 (HITL)

---

#### S8.1: Trust Score Dashboard

**As a** Governance Administrator,
**I want** a unified Trust Score (0-100) for each agent combining AIVSS, behavioral, and alignment metrics,
**So that** I have a single source of truth for agent trustworthiness.

**Acceptance Criteria**:
- [ ] Trust Score calculation formula implemented in AGE:
  ```python
  trust_score = (
      0.40 * aivss_baseline +        # Phase 1: Inherent risk assessment
      0.35 * behavioral_compliance +  # Phases 2-3: Runtime behavior quality
      0.25 * alignment_consistency    # Phase 4: Goal alignment adherence
  )
  ```
- [ ] Trust Score displayed prominently on Agent Detail → Assess tab:
  - Large numeric display (0-100)
  - Trust Tier badge (Tier 1/2/3/4/Untrusted)
  - Trend indicator (↑↓→) showing 7-day change
  - Trust Timeline embedded in Assess tab (no separate page)
- [ ] Trust Score breakdown tooltip:
  - AIVSS baseline: XX points (40%)
  - Behavioral compliance: XX points (35%)
  - Alignment consistency: XX points (25%)
  - Adjustments: -XX points (violations)
- [ ] Agent list page shows Trust Score column (sortable)
- [ ] Dashboard widget: "Trust Score Distribution" histogram
- [ ] Dashboard widget: "Agents Requiring Attention" (Trust Score < 60)
- [ ] API endpoint: `GET /api/v1/governance/trust-score/{agent_id}`
  ```json
  {
    "agent_id": "agent_xxx",
    "trust_score": 87,
    "trust_tier": "Tier 2",
    "breakdown": {
      "aivss_baseline": 35,
      "behavioral_compliance": 33,
      "alignment_consistency": 24,
      "adjustments": -5
    },
    "last_updated": "2025-12-25T10:00:00Z"
  }
  ```

**Technical Notes**:
- Trust Score stored in `agent_trust_scores` table (PostgreSQL)
- Calculation triggered: on registration, after violations, daily batch
- Historical scores stored for trend analysis

---

#### S8.2: Dynamic Trust Tier Adjustment

**As a** Security Architect,
**I want** agent Trust Tiers to automatically downgrade when Trust Scores drop below thresholds,
**So that** misbehaving agents face stricter controls without manual intervention.

**Acceptance Criteria**:
- [ ] Trust Tier thresholds configured in AGE:
  ```yaml
  trust_tiers:
    Tier 1: 90-100    # Highest trust, scores 90-100
    Tier 2: 75-89     # High trust, scores 75-89
    Tier 3: 50-74     # Medium trust, scores 50-74
    Tier 4: 25-49     # Low trust, scores 25-49
    Untrusted: 0-24   # Untrusted, scores 0-24 - Recommend decommission
  ```
- [ ] Trust Tier automatically recalculated when Trust Score changes
- [ ] Trust Tier downgrade triggers:
  - Behavioral violations reduce Trust Score below tier threshold
  - Goal drift events accumulate over time
  - Manual admin adjustment
- [ ] Trust Tier upgrade triggers:
  - Trust Score recovers above tier threshold for 7 consecutive days
  - Manual admin approval required for upgrade to Tier 1
- [ ] Tier change notifications:
  - Email to agent owner
  - In-app notification
  - Audit log entry
- [ ] Tier change events logged with reason:
  ```json
  {
    "event_type": "trust_tier_changed",
    "agent_id": "agent_xxx",
    "previous_tier": "Tier 2",
    "new_tier": "Tier 3",
    "reason": "Trust Score dropped to 65 due to 15 behavioral violations",
    "violation_summary": "PII access without approval (15 occurrences in 5 days)",
    "timestamp": "2025-12-25T10:00:00Z"
  }
  ```
- [ ] Agent detail page shows Trust Tier history timeline
- [ ] Dashboard shows "Recent Trust Tier Changes" feed

**Technical Notes**:
- Tier change evaluates after every Trust Score update
- Tier changes immediately affect OPA policy evaluation (risk-proportional governance)
- Behavioral rules can reference Trust Tier for stricter enforcement

---

#### S8.3: Violation Pattern Detection

**As a** Governance Administrator,
**I want** the system to detect repeated violation patterns,
**So that** I can identify systematic misalignment requiring policy changes.

**Acceptance Criteria**:
- [ ] Pattern detection runs daily (batch job) analyzing last 30 days
- [ ] Pattern types detected:
  - **Behavioral Violations**: Same rule violated 5+ times by same agent
  - **Goal Drift**: Same goal + action combination misaligned 3+ times
  - **Approval Rejections**: Same operation rejected 3+ times
  - **Temporal Patterns**: Violations clustered in time (e.g., all during backups)
- [ ] Pattern detection algorithm:
  ```python
  def detect_behavioral_pattern(agent_id, days=30):
      violations = get_violations(agent_id, days)
      grouped = group_by(violations, ['rule_name', 'semantic_type'])
      patterns = []
      for group in grouped:
          if len(group) >= 5:  # Threshold
              patterns.append({
                  'type': 'behavioral_violation',
                  'rule': group.rule_name,
                  'frequency': len(group),
                  'first_occurrence': min(group.timestamps),
                  'last_occurrence': max(group.timestamps)
              })
      return patterns
  ```
- [ ] Detected patterns displayed on:
  - Agent Detail → Adapt tab → Insights sub-tab: "Violation Patterns" section
  - Dashboard: "System-Wide Patterns" widget
- [ ] Pattern detail view shows:
  - Pattern type and description
  - Frequency (occurrences, time range)
  - Affected agents (if org-wide pattern)
  - Suggested remediation (manual or auto-generated policy)
  - "Create Rule from Pattern" button
- [ ] API endpoint: `GET /api/v1/governance/patterns`
  ```json
  {
    "patterns": [
      {
        "pattern_id": "pat_123",
        "type": "behavioral_violation",
        "rule_name": "PII requires approval before external sharing",
        "agent_id": "agent_xxx",
        "frequency": 15,
        "time_range": "2025-12-20 to 2025-12-25",
        "severity": "high",
        "suggested_action": "Create stricter rule or downgrade Trust Tier"
      }
    ]
  }
  ```

**Technical Notes**:
- Pattern detection stored in `violation_patterns` table
- Patterns marked as "acknowledged" after admin review
- Pattern detection can trigger Trust Score penalties

---

#### S8.4: Policy Suggestion Engine

**As a** Security Architect,
**I want** AI-generated policy suggestions based on detected violation patterns,
**So that** I can prevent future violations without manually writing every rule.

**Acceptance Criteria**:
- [ ] Policy suggestion generated when violation pattern detected with frequency >= 5
- [ ] Suggestion types:
  - **New Behavioral Rule**: Based on repeated violations
  - **OPA Policy Enhancement**: Based on approval rejections
  - **Trust Tier Adjustment**: Based on persistent non-compliance
- [ ] Suggestion generation algorithm:
  ```python
  def generate_behavioral_rule_suggestion(pattern):
      # Example: Pattern detected - agent attempts PII access without approval
      return {
          'type': 'behavioral_rule',
          'confidence': 0.85,
          'proposed_rule': {
              'name': f"Auto-generated: {pattern.context.goal} requires approval",
              'trigger': {
                  'semantic_type': pattern.context.semantic_type
              },
              'context': {
                  'goal_contains': pattern.context.goal_keywords
              },
              'before': ['approval_received'],
              'on_violation': {
                  'verdict': 'REQUIRE_APPROVAL'
              }
          },
          'rationale': f"Detected {pattern.frequency} violations in {pattern.days} days"
      }
  ```
- [ ] Policy Suggestions in Agent Detail → Adapt tab → Insights sub-tab:
  - List of pending suggestions
  - Suggestion card shows:
    - Pattern summary
    - Proposed rule (YAML preview)
    - Confidence score
    - Rationale
    - "Approve", "Modify", "Reject" actions
  - Filter by type, confidence, date
- [ ] Approve action:
  - Creates behavioral rule in AGE
  - Marks suggestion as "approved"
  - Logs in audit trail
- [ ] Modify action:
  - Opens rule editor pre-filled with suggestion
  - Admin can edit before approval
- [ ] Reject action:
  - Marks suggestion as "rejected" with reason
  - Used to improve suggestion algorithm
- [ ] Suggestion notifications:
  - Email digest (weekly)
  - In-app badge count
- [ ] API endpoint: `GET /api/v1/governance/policy-suggestions`

**Technical Notes**:
- Suggestions stored in `policy_suggestions` table
- Confidence score based on pattern frequency and consistency
- Future enhancement: LLM-powered suggestion generation

---

#### S8.5: Trust Recovery Workflow

**As a** DevOps Lead,
**I want** agents to gradually recover Trust Scores after demonstrating compliance,
**So that** temporary issues don't permanently damage agent reputation.

**Acceptance Criteria**:
- [ ] Trust recovery rules configured:
  ```yaml
  trust_recovery:
    enabled: true
    recovery_rate: 1  # points per day
    max_recovery: 100  # cannot exceed original AIVSS baseline
    violation_free_period: 7  # days without violations to start recovery
    conditions:
      - no_violations_for_days: 7
      - no_pending_approvals: true
      - trust_score_below: 90
  ```
- [ ] Recovery calculation runs daily:
  ```python
  def calculate_recovery(agent_id):
      last_violation = get_last_violation(agent_id)
      days_since = (now() - last_violation).days
      if days_since >= 7:
          current_score = get_trust_score(agent_id)
          baseline = get_aivss_baseline(agent_id)
          if current_score < baseline:
              new_score = min(current_score + 1, baseline)
              update_trust_score(agent_id, new_score)
  ```
- [ ] Agent detail page shows:
  - "Trust Recovery Status" card (if recovering)
  - Days since last violation: X
  - Projected full recovery date
  - Recovery rate: +1 point/day
  - "Pause Recovery" button (admin only)
- [ ] Dashboard widget: "Agents in Recovery" (list)
- [ ] Recovery progress notifications:
  - When recovery starts (7 days violation-free)
  - When score reaches key milestones (75, 85, 95)
  - When full recovery achieved
- [ ] Recovery pause reasons:
  - New violation detected
  - Manual admin pause
  - Agent decommissioned
- [ ] Recovery events logged in audit trail

**Technical Notes**:
- Recovery tracked in `trust_recovery_status` table
- Recovery can be accelerated manually by admin (with reason)
- Recovery never exceeds original AIVSS baseline (prevents gaming)

---

## Competitive Analysis

### OpenBox v1.1 vs. Portkey (Updated)

| Capability | OpenBox v1.1 | Portkey |
|------------|--------------|---------|
| LLM API governance | Yes | Yes |
| All-operations governance | **Yes** | No |
| Long-running workflow tracking | **Yes** | No |
| **Risk-based tiering (AIVSS)** | **Yes** | No (all users treated equally) |
| **Behavioral conformance (stateful)** | **Yes** | No (stateless rate limits only) |
| **Goal alignment verification** | **Yes** | No |
| **5-tier graduated verdicts** | **Yes** | No (block or allow) |
| **Built-in HITL workflows** | **Yes** | No (custom integration required) |
| **Semantic type classification** | **Yes** | No |
| Cryptographic attestation | **Yes** | No |
| Data sovereignty | **Yes** | No |

### OpenBox v1.1 vs. AWS Guardrails for Bedrock

| Capability | OpenBox v1.1 | AWS Guardrails |
|------------|--------------|----------------|
| Vendor lock-in | No (multi-LLM) | **Yes (Bedrock only)** |
| Non-LLM operations | **Yes** | No (LLM-focused) |
| **Risk-based policies** | **Yes** | No (one-size-fits-all) |
| **Behavioral rules** | **Yes** | No (per-request only) |
| **Goal alignment** | **Yes** | No |
| **Graduated response** | **Yes** | No (block or allow) |
| Temporal workflow support | **Yes** | No |
| Custom deployment | **Yes** | No (AWS-hosted only) |

### Unique Value Propositions (v1.1)

1. **Risk Intelligence**: Only solution with AIVSS-based 4-tier risk classification for AI agents
2. **Behavioral Intelligence**: Stateful conformance checking detects multi-step violations (90%+ missed by stateless tools)
3. **Goal Alignment**: Real-time LlamaFirewall-powered verification prevents agent drift
4. **Graduated Control**: 5-tier verdict system provides nuanced responses vs. binary block/allow
5. **Native HITL**: Built-in approval workflows with timeout handling (no custom integration required)

**Killer Demo Update**:
> "Build an agent that accesses customer PII, then attempts to send it to an external API. OpenBox v1.1 detects the behavioral pattern, checks goal alignment, assigns trust tier, and automatically pauses execution pending human approval—all without a single line of policy code. Portkey sees the LLM call. AWS Guardrails sees nothing."

---

## Cross-Feature Synergies (Trust Lifecycle Integration)

OpenBox v1.1's features are designed to work together as an integrated Trust Lifecycle system, not as independent governance mechanisms. The following synergies demonstrate how components inform and enhance each other.

### Synergy 1: AIVSS (Assess) → Behavioral Rules (Authorize)

**Integration**: Trust Tier from AIVSS assessment informs behavioral rule enforcement strictness

**Implementation**: Behavioral rules can specify different actions per Trust Tier:

```yaml
behavioral_rule:
  name: "PII requires approval before external sharing"
  trigger:
    semantic_type: "acme.integration.external_api"
  before:
    - semantic_type: "acme.data.pii"
  after:
    - semantic_type: "acme.approval.manager_approved"
  tier_enforcement:  # NEW: Risk-proportional governance
    Tier 1: ALLOW           # High trust: skip approval
    Tier 2: REQUIRE_APPROVAL     # Medium-high trust: single approval
    Tier 3: REQUIRE_APPROVAL   # Medium trust: manager approval
    Tier 4: DENY_ACTION        # Low trust: never allow
```

**Benefit**: Risk-proportional governance - strictness scales with agent risk profile

**User Stories**: S5.3, S6.2, S8.2

---

### Synergy 2: Behavioral Violations (Monitor) → Trust Score (Adapt)

**Integration**: Repeated behavioral violations reduce Trust Score and may trigger Trust Tier downgrade

**Example Flow**:
```
Day 1: Agent "data-processor" (Trust Score: 100, Tier: Tier 2)
       → 5 behavioral violations (PII access without approval)
       → Trust Score: 100 → 85 (Tier 2 maintained)

Day 2: 10 more violations
       → Trust Score: 85 → 60 (downgrade to Tier 3)
       → Behavioral rules now stricter (Tier 3 policies apply)

Day 3: Violations stop (compliance restored)
       → Trust Score gradually recovers: 60 → 65 over 7 days
       → Tier 3 maintained until score crosses 75 threshold
```

**Benefit**: Dynamic trust adjustment - misbehaving agents automatically face stricter controls

**User Stories**: S6.3 (violations), S8.2 (tier adjustment), S8.5 (recovery)

---

### Synergy 3: Goal Drift (Verify) → Behavioral Rules (Authorize)

**Integration**: Persistent goal drift patterns trigger automatic creation of new behavioral rules

**Example Pattern Detection**:
```
Pattern Detected:
  Agent: "backup-agent"
  Pattern: Repeatedly attempts deletion when goal is "backup database"
  Frequency: 5 occurrences in 7 days

Policy Suggestion Generated:
  name: "Block delete during backup operations"
  trigger:
    semantic_type: "acme.action.delete"
  context:
    goal_contains: "backup"
  on_match:
    verdict: DENY_ACTION
  rationale: "Detected systematic misalignment - agent attempting destructive actions during backup goal"
```

**Benefit**: Policy learning - system adapts rules based on observed violations, preventing future incidents

**User Stories**: S6.5 (goal alignment), S8.3 (pattern detection), S8.4 (policy suggestions)

---

### Synergy 4: Goal Alignment Score (Verify) → Trust Score (Adapt)

**Integration**: Severe goal drift events reduce Trust Score and trigger Trust Tier re-evaluation

**Example**:
```
Session: Agent "assistant" with goal "summarize document"

Action 1: read_document
         → Alignment: 0.0 (perfectly aligned) ✅
         → No Trust Score impact

Action 2: delete_file
         → Alignment: 1.0 (severe misalignment) ❌
         → Trust Score: 95 → 80 (penalty: -15 points)
         → Drift event logged for pattern analysis
         → If recurring, triggers tier downgrade
```

**Benefit**: Trust reflects alignment integrity - misaligned agents lose trust automatically

**User Stories**: S6.5 (alignment check), S8.1 (trust score calculation), S8.2 (tier adjustment)

---

### Synergy 5: All Components → Unified Trust Score

**Integration**: Single Trust Score aggregates signals from all Trust Lifecycle phases

**Trust Score Formula**:
```python
trust_score = (
    0.40 * aivss_baseline +           # Phase 1 (Assess): Inherent risk
    0.35 * behavioral_compliance +     # Phases 2-3 (Authorize/Monitor): Runtime behavior
    0.25 * alignment_consistency       # Phase 4 (Verify): Intent alignment
)

# Adjustments (Phase 5 - Adapt):
# - Violations: -5 to -25 points per severity
# - Recovery: +1 point/day (max: original baseline)
# - Manual override: Admin can adjust ±20 points with reason
```

**Benefit**: Single source of truth - one metric to understand agent trustworthiness, replacing fragmented signals

**User Stories**: S8.1 (trust score calculation)

---

### Synergy 6: Trust Score → OPA Policies (Cross-Phase)

**Integration**: Trust Score available in OPA policy evaluation context for dynamic policy decisions

**Example OPA Policy**:
```rego
# Trust-aware database access policy
deny["Tier 3/4 agents cannot delete production data"] {
    input.trust_score < 75          # Trust Score threshold
    input.operation == "database_delete"
    input.environment == "production"
}

allow {
    input.trust_score >= 90         # Tier 1 agents
    input.operation == "database_delete"
    input.approval_required == false
}

require_approval {
    input.trust_score >= 75
    input.trust_score < 90
    input.operation == "database_delete"
}
```

**Benefit**: Trust-based dynamic policies - policies adapt to current agent trust state, not just static configuration

**User Stories**: S5.3 (risk-aware OPA), S8.1 (trust score)

---

### Synergy 7: HITL Approvals (Authorize) → Trust Score (Adapt)

**Integration**: Approval decisions provide feedback to Trust Score system

**Implementation**:
```
Approval Approved:
  → No Trust Score penalty
  → Log approval for audit trail
  → Continue normal operations

Approval Rejected:
  → Trust Score: -10 points (attempted risky action)
  → If 3 rejections for same operation → pattern detection
  → Pattern triggers policy suggestion (prevent future attempts)

Approval Timeout (No Response):
  → Trust Score: -5 points (action blocked by timeout)
  → Notification to admin for policy review
```

**Benefit**: Approval outcomes inform trust - rejected approvals indicate risky behavior patterns

**User Stories**: S7.2 (HITL workflows), S8.1 (trust score), S8.3 (pattern detection)

---

### Synergy Benefits Summary

| Synergy | Integration | Primary Benefit | User Impact |
|---------|-------------|-----------------|-------------|
| AIVSS → Behavioral | Trust Tier informs rule strictness | Risk-proportional governance | Tier 3/4 agents automatically face stricter rules |
| Violations → Trust Score | Violations reduce Trust Score/Tier | Dynamic trust degradation | Misbehaving agents lose privileges automatically |
| Goal Drift → Policies | Drift patterns generate policy suggestions | Policy learning | System prevents future violations proactively |
| Alignment → Trust Score | Misalignment reduces Trust Score | Alignment-aware trust | Intent integrity impacts trustworthiness |
| All → Trust Score | Unified trustworthiness metric | Single source of truth | One number to understand agent safety |
| Trust Score → OPA | Dynamic policy thresholds | Trust-based policies | Policies adapt to current trust state |
| HITL → Trust Score | Approval outcomes inform trust | Feedback loop | Human decisions improve trust accuracy |

**Strategic Positioning**: These synergies transform OpenBox from a "collection of governance features" into a **coherent Trust Lifecycle platform** - the only AI governance solution where components actively inform and improve each other.

---

## Technical Considerations

### Architecture

```
Customer Environment                OpenBox v1.1 Infrastructure
┌─────────────────────┐           ┌─────────────────────────────────────────┐
│   AI Agent          │           │  OpenBox Core API (Go)                  │
│   + OpenBox SDK     │──────────>│  + Temporal Workers                     │
│   (Python)          │           │  + OPA Policy Engine                    │
│   + Customer        │           │                                         │
│     Temporal        │           │  Agent Governance Engine (AGE) Sidecar  │
└─────────────────────┘           │  + Risk Calculator (AIVSS)              │
                                  │  + Behavioral Conformance Engine        │
                                  │  + Goal Alignment Checker               │
                                  │  + Semantic Classifier                  │
                                  │  + Containment Strategy                 │
                                  │                                         │
                                  │  + AWS KMS Signing                      │
                                  │  + Supabase Storage                     │
                                  │  + PostgreSQL (state)                   │
                                  └─────────────────────────────────────────┘
```

### Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOVERNANCE EVALUATION FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SDK Telemetry Event                                                        │
│         │                                                                   │
│         ▼                                                                   │
│  OpenBox Core                                                               │
│         │                                                                   │
│         ├──► Semantic Classification (AGE)                                  │
│         │                                                                   │
│         ├──► OPA Policy Evaluation (stateless)                              │
│         │                                                                   │
│         ├──► Trust Tier Lookup (AGE AIVSS)                                   │
│         │                                                                   │
│         ├──► Behavioral Conformance Check (AGE stateful)                    │
│         │                                                                   │
│         ├──► Goal Alignment Verification (AGE LlamaFirewall)                │
│         │                                                                   │
│         ▼                                                                   │
│  Containment Strategy (AGE)                                                 │
│         │                                                                   │
│         ├──► ALLOW → Continue                                               │
│         ├──► CONSTRAIN → Execute with limits                                │
│         ├──► REQUIRE_APPROVAL → Start Approval Workflow                     │
│         ├──► BLOCK → Reject action, continue workflow                       │
│         └──► HALT → Terminate workflow                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack Updates

| Component | v1.0 Technology | v1.1 Addition | Purpose |
|-----------|----------------|---------------|---------|
| SDK | Python 3.9+ | +5 verdict types | Agent integration |
| Core API | Go 1.24 + Echo | +AGE integration | Governance orchestration |
| **AGE Sidecar** | - | **FastAPI (Python)** | **Risk intelligence & behavioral governance** |
| Workflow Engine | Temporal Cloud | +Approval workflows | Durable orchestration + HITL |
| Policy Engine | OPA | +Behavioral YAML | Stateless + stateful rules |
| Database | Supabase | +Approval metadata | Multi-tenant data |
| **State Store** | - | **In-memory + PostgreSQL** | **Ephemeral + persistent state** |
| Authentication | Auth0 | (unchanged) | User identity & RBAC |
| Signing | AWS KMS | (unchanged) | Cryptographic attestation |
| **Alignment** | - | **LlamaFirewall** | **Goal drift detection** |
| Dashboard | React + TypeScript | +Approval Queue UI | Admin interface |

### Performance Requirements

| Metric | v1.0 Requirement | v1.1 Requirement | Delta |
|--------|------------------|------------------|-------|
| Governance decision latency | `<200ms` p95 | `<250ms` p95 | +50ms (AGE overhead) |
| Policy evaluation | `<10ms` average | `<10ms` average | No change |
| **Trust tier lookup** | - | **`<5ms` average** | New |
| **Behavioral check** | - | **`<30ms` p95** | New |
| **Goal alignment** | - | **`<100ms` p95** | New (LLM call) |
| **Approval latency** | - | **`<30s` p95** | New (human response) |
| Attestation creation | `<100ms` average | `<100ms` average | No change |

### Security Requirements

| Requirement | v1.0 Implementation | v1.1 Enhancement |
|-------------|---------------------|------------------|
| Multi-tenant isolation | Auth0 + Supabase RLS | +AGE PostgreSQL RLS |
| API authentication | Bearer tokens | +AGE API key validation |
| Cryptographic attestation | AWS KMS ECC P-256 | +Risk tier in signature |
| **State security** | - | **PostgreSQL encryption at rest** |
| **Approval security** | - | **Approval signatures, audit trail** |
| **Goal confidentiality** | - | **Goals hashed before storage** |

### Scalability Requirements

| Metric | v1.0 Target | v1.1 Target |
|--------|-------------|-------------|
| Policy evaluations | 1,000+/minute | 1,000+/minute |
| **Trust tier lookups** | - | **10,000+/minute** |
| **Behavioral checks** | - | **5,000+/minute** |
| **Alignment checks** | - | **1,000+/minute** (LLM limit) |
| **Approval requests** | - | **100+/minute** |
| Organizations | 100+ | 100+ |
| Agents per org | 10,000+ | 10,000+ |

---

## Migration from v1.0 to v1.1

### Backward Compatibility

- SDK v1.1 compatible with v1.0 governance events
- Agents without AIVSS config assigned default Tier 2 (high trust)
- Verdict mapping: v1.0 `continue` → v1.1 `ALLOW`, v1.0 `stop` → v1.1 `HALT`
- Existing OPA policies work unchanged (trust tier optional in rules)

### Migration Steps

1. **Deploy AGE Sidecar** (Week 1)
   - Deploy AGE service alongside OpenBox Core
   - Configure PostgreSQL for state storage
   - Set up LlamaFirewall API keys (optional, fallback to heuristic)

2. **Upgrade OpenBox Core** (Week 1)
   - Add AGE integration activities
   - Update containment logic for 5 verdicts
   - Deploy approval workflow

3. **Upgrade Dashboard** (Week 2)
   - AIVSS configuration UI
   - Behavioral rules management
   - Approval queue

4. **Agent Migration** (Week 2-3, customer-driven)
   - Configure AIVSS parameters for each agent
   - Optional: Define behavioral rules
   - Test approval workflows
   - Monitor alignment scores

### Migration Validation

- [ ] All v1.0 agents receive verdicts (backward compatibility)
- [ ] New AIVSS-configured agents show trust tiers
- [ ] Behavioral rules trigger correctly
- [ ] Approval workflows complete end-to-end
- [ ] Performance `<250ms` p95 governance latency
- [ ] Zero cross-tenant data leakage

---

## Timeline

### v1.1 Development (4 Sprints)

Assuming Sprint 4-5 complete OpenBox v1.0 MVP:

| Sprint | Duration | Focus | Deliverables |
|--------|----------|-------|--------------|
| **Sprint 6** | Week 6 | **Epic 5: Trust Intelligence** | AIVSS integration, trust tier UI, trust-based OPA policies |
| **Sprint 7** | Week 7 | **Epic 6: Behavioral Governance (Part 1)** | Behavioral conformance engine, state tracking, semantic classification |
| **Sprint 8** | Week 8 | **Epic 6 (Part 2) + Epic 7 (Part 1)** | Goal alignment, behavioral rules UI, 5-tier verdicts, HITL workflow |
| **Sprint 9** | Week 9 | **Epic 7 (Part 2) + Polish** | Approval queue UI, HALT handling, integration testing, migration guide |

### Sprint 6 Breakdown: Risk Intelligence

| Story | Component | Estimated Days |
|-------|-----------|----------------|
| S5.1: AIVSS Configuration UI | Dashboard UI | 3 days |
| S5.1: AIVSS Registration API | Dashboard API + AGE | 2 days |
| S5.2: Trust Tier Display | Dashboard UI | 2 days |
| S5.3: Trust-Based Policy Enforcement | OpenBox Core | 2 days |
| S5.4: Trust Tier Analytics | Dashboard UI/API | 3 days |
| **Total** | | **12 days** |

### Sprint 7 Breakdown: Behavioral Governance (Part 1)

| Story | Component | Estimated Days |
|-------|-----------|----------------|
| S6.1: Behavioral Conformance Integration | OpenBox Core + AGE | 3 days |
| S6.4: Semantic Classification | AGE + Core | 2 days |
| S6.5: State Tracking Dashboard | Dashboard UI | 2 days |
| Testing & Documentation | All | 2 days |
| **Total** | | **9 days** |

### Sprint 8 Breakdown: Behavioral Governance (Part 2) + Graduated Response (Part 1)

| Story | Component | Estimated Days |
|-------|-----------|----------------|
| S6.2: Behavioral Rule Management UI | Dashboard UI/API | 3 days |
| S6.3: Goal Alignment Integration | AGE + Core | 2 days |
| S7.1: 5-Tier Verdict System | SDK + Core | 2 days |
| S7.2: HITL Approval Workflow | Core + AGE | 3 days |
| **Total** | | **10 days** |

### Sprint 9 Breakdown: Graduated Response (Part 2) + Polish

| Story | Component | Estimated Days |
|-------|-----------|----------------|
| S7.3: Approval Queue UI | Dashboard UI/API | 3 days |
| S7.4: CONSTRAIN Verdict (Phase 1) | SDK + Core | 2 days |
| S7.5: HALT Handling | SDK + Core + UI | 2 days |
| Migration Guide & Documentation | Docs | 2 days |
| Integration Testing | All | 3 days |
| **Total** | | **12 days** |

### Post-v1.1 Roadmap

| Quarter | Focus | Features |
|---------|-------|----------|
| Q1 2026 | **v1.2: Advanced Containment** | Full sandbox execution (Docker), CONSTRAIN enforcement, resource limits |
| Q2 2026 | **v1.3: Multi-Modal Alignment** | Image/video alignment checks, multimodal behavioral rules |
| Q3 2026 | **v2.0: Compliance Automation** | Framework mapping (SOC 2, EU AI Act), automated audit reports |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **LlamaFirewall dependency** | Goal alignment unavailable if API down | Medium | Fallback heuristic, caching, SLA monitoring |
| **State performance** | State tracking latency at scale | Medium | In-memory caching, connection pooling, query optimization |
| **AIVSS misconfiguration** | Incorrect trust tier assignment | High | Templates, validation, expert review prompts |
| **Approval workflow abuse** | Users approve everything | Medium | Approval audit, anomaly detection, manager escalation |
| **Behavioral rule complexity** | Users create contradictory rules | Medium | Rule conflict detection, simulation testing |
| **OPA + Behavioral conflict** | OPA allows, Behavioral blocks | Low | Clear priority: OPA first, then Behavioral |
| **Goal drift false positives** | Legitimate actions flagged | Medium | Alignment score threshold tuning, whitelist patterns |
| **SDK backward compatibility** | v1.0 agents break on upgrade | High | Extensive testing, gradual rollout, rollback plan |

---

## Open Questions

1. **AIVSS Parameter Inference**: Should we auto-infer AIVSS parameters from agent code analysis in future versions?
2. **Goal Alignment Threshold**: What alignment score threshold triggers approval (currently hardcoded 1.0 = misaligned)?
3. **Behavioral Rule Limits**: Should we limit number of rules per organization to prevent performance degradation?
4. **Approval SLA**: Should we enforce approval response time SLAs (e.g., "manager must respond within 5 minutes")?
5. **Multi-Agent Coordination**: How to handle behavioral rules across multiple agents in the same workflow?
6. **CONSTRAIN Sandbox**: Docker-based or WebAssembly-based sandbox for Phase 2?
7. **Trust Tier Overrides**: Should admins be able to manually override AIVSS-calculated trust tiers?
8. **Goal Re-Alignment**: If goal drifts, should agent auto-correct or always require human intervention?

---

## Appendix

### Glossary (v1.1 Updates)

| Term | Definition |
|------|------------|
| **AIVSS** | AI Vulnerability Scoring System - 14-parameter risk assessment framework |
| **Trust Tier** | Classification level (Tier 1/2/3/4 or Untrusted) based on AIVSS score |
| Agent | Autonomous AI system executing Temporal workflows (v1.0) |
| Attestation | Cryptographically signed proof of an operation (v1.0) |
| **Behavioral Conformance** | Stateful rule enforcement based on prior agent actions |
| **Containment** | Verdict aggregation strategy combining OPA, Behavioral, Alignment results |
| **Goal Alignment** | Verification that agent actions align with stated objectives |
| **Graduated Response** | 5-tier verdict system (HALT/BLOCK/REQUIRE_APPROVAL/CONSTRAIN/ALLOW) |
| Guardrail | Safety control preventing harmful operations (v1.0) |
| **HITL** | Human-in-the-Loop - approval workflow requiring human decision |
| OPA | Open Policy Agent - stateless policy engine using Rego language (v1.0) |
| **Semantic Type** | Classification of event meaning (e.g., pii_data, code_execution) |
| Temporal | Workflow orchestration platform for durable execution (v1.0) |
| Verdict | Governance decision with reasoning (v1.0: 2 types, v1.1: 5 types) |

### AIVSS Parameter Quick Reference

**Base Security (25% weight)**
- attack_vector (1-4): Network → Physical
- attack_complexity (1-2): Low → High
- privileges_required (1-3): None → High
- user_interaction (1-2): None → Required
- scope (1-2): Unchanged → Changed

**AI-Specific (45% weight)**
- model_robustness (1-5): Very High → Very Low
- data_sensitivity (1-5): Very High → Very Low
- ethical_impact (1-5): Very High → Very Low
- decision_criticality (1-5): Very High → Very Low
- adaptability (1-5): Very High → Very Low

**Impact (30% weight)**
- confidentiality_impact (1-5): None → Critical
- integrity_impact (1-5): None → Critical
- availability_impact (1-5): None → Critical
- safety_impact (1-5): None → Critical

### Verdict Priority Hierarchy

```
1. HALT (terminates agent execution)
   ↓
2. BLOCK (rejects action, agent continues)
   ↓
3. REQUIRE_APPROVAL (pauses pending human decision)
   ↓
4. CONSTRAIN (executes with sandbox restrictions)
   ↓
5. ALLOW (proceeds normally)
```

### References

- OpenBox v1.0 PRD (internal doc)
- AGE System Architecture (internal doc)
- AGE Risk Scoring (internal doc)
- AGE Behavioral Conformance (internal doc)
- AGE Goal Alignment (internal doc)
- Sprint 4-5 Planning (internal doc)

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1.0 | 2025-12-25 | Product Team | Initial v1.1 PRD - AGE integration |
