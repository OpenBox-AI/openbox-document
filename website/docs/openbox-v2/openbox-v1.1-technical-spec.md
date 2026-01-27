# OpenBox v1.1 Technical Specification

## 1. Executive Summary

### What is OpenBox AI

OpenBox AI is an enterprise-grade governance platform that transforms opaque AI agents into transparent, auditable, and compliant systems. The platform provides comprehensive oversight of all agent operations - not just LLM calls, but every database query, API call, file operation, and workflow step.

### Core Value Proposition: "Black Box → Open Box"

AI agents today operate as black boxes. Organizations deploy agents that make decisions, access data, and execute actions with minimal visibility or control. OpenBox changes this paradigm by providing:

- **Complete Visibility**: Every operation is captured, classified, and stored
- **Proactive Governance**: Policies and behavioral rules evaluated in real-time
- **Cryptographic Attestation**: Tamper-proof audit trails with KMS-signed Merkle trees
- **Human-in-the-Loop**: Built-in approval workflows for sensitive operations
- **Risk Intelligence**: AI-specific vulnerability scoring (AIVSS) for each agent

### Target Use Cases

| Persona | Use Case | Key Value |
|---------|----------|-----------|
| **Compliance Officer** | SOC 2 / GDPR audit preparation | Cryptographic attestation, session replay |
| **Security Team** | Agent risk assessment | AIVSS scoring, behavioral monitoring |
| **Engineering Lead** | Agent governance policies | OPA policies, guardrails configuration |
| **Operations** | Real-time agent monitoring | Observability, issue detection |
| **Business Stakeholder** | Approval workflows | HITL integration, approval queue |

---

## 2. Platform Overview

### 2.1 The Problem OpenBox Solves

**Opacity of AI Agents**
Modern AI agents powered by LLMs make complex decisions but provide no native visibility into their reasoning or actions. Traditional logging captures fragments but misses the complete picture.

**Governance Gap**
Existing LLM observability tools (Portkey, LangSmith) only monitor LLM API calls. For autonomous agents, LLM calls represent less than 20% of total operations. Database queries, external API calls, file operations, and message queue interactions go ungoverned.

**Compliance Risk**
Regulations require organizations to demonstrate control over automated systems. Without proper governance, AI agents become compliance liabilities - especially for GDPR, HIPAA, and financial regulations.

**No Workflow Context**
Long-running agent workflows that span hours or days cannot be tracked as single units. Traditional request-response monitoring fails for durable, multi-step agent processes.

**Agent Identity Crisis**
When multiple agents interact, there's no cryptographic proof of which agent performed which action. Attestation is weak or non-existent.

### 2.2 OpenBox Solution

**All-Operations Governance**
OpenBox captures every operation through OpenTelemetry auto-instrumentation and custom interceptors:
- Temporal workflow events (start, complete, failed, signal)
- Activity executions with full input/output capture
- HTTP calls to external services
- Database queries (PostgreSQL, MySQL, Redis)
- LLM API calls (OpenAI, Anthropic, Google)
- File system operations

**Temporal-Native Workflow Tracking**
Built on Temporal Cloud for durable execution, OpenBox treats agent sessions as first-class workflows. Multi-day agent processes maintain complete lineage.

**Cryptographic Attestation**
Every session is cryptographically attested using a 2-level Merkle tree signed with AWS KMS (ECDSA NIST P-256). Individual spans can be independently verified.

**Policy-Based Controls**
Open Policy Agent (OPA) with Rego policies enables both technical controls (rate limits) and business logic ("purchases over $10K require approval").

**Compliance Automation**
Pre-built compliance reports for SOC 2, GDPR, and industry-specific regulations. Session replay allows auditors to reconstruct exact agent behavior.

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPENBOX v1.1 ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CUSTOMER ENVIRONMENT                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────┐     ┌─────────────────┐                        │   │
│  │  │   AI Agent      │     │ Customer        │                        │   │
│  │  │   + OpenBox SDK │────>│ Temporal Cloud  │                        │   │
│  │  │   (Python)      │     │ (Workflow Data) │                        │   │
│  │  └────────┬────────┘     └─────────────────┘                        │   │
│  │           │                                                          │   │
│  │           │ Governance Events (metadata, telemetry)                  │   │
│  │           │ NO business data leaves customer environment             │   │
│  └───────────┼──────────────────────────────────────────────────────────┘   │
│              │                                                              │
│              ▼                                                              │
│  OPENBOX INFRASTRUCTURE                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      OPENBOX CORE (Go + Temporal)                    │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │              GovernanceEventWorkflow (12 Activities)           │  │   │
│  │  │                                                                │  │   │
│  │  │   1. ValidateAgentActivity       - Token validation            │  │   │
│  │  │   2. SessionLifecycleActivity    - Create/update session       │  │   │
│  │  │   3. SemanticClassificationActivity - Tool → semantic type     │  │   │
│  │  │   4. RiskTierLookupActivity      - AIVSS risk scoring          │  │   │
│  │  │   5. PolicyEvaluationActivity    - OPA policy evaluation       │  │   │
│  │  │   6. BehavioralConformanceActivity - FSM state tracking        │  │   │
│  │  │   7. GoalAlignmentActivity       - LlamaFirewall drift check   │  │   │
│  │  │   8. GuardrailsCheckActivity     - Input/output validation     │  │   │
│  │  │   9. ContainmentDecisionActivity - 5-tier verdict resolution   │  │   │
│  │  │  10. StoreGovernanceEvent        - Persist event               │  │   │
│  │  │  11. HITLWorkflowActivity        - Human approval (if needed)  │  │   │
│  │  │  12. StartAttestationWorkflow    - Merkle tree + KMS signing   │  │   │
│  │  │                                                                │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │ Attestation     │  │ Observability   │  │ AGE Sidecar         │  │   │
│  │  │ Worker          │  │ Worker          │  │ (Python FastAPI)    │  │   │
│  │  │                 │  │                 │  │                     │  │   │
│  │  │ - Merkle Tree   │  │ - 8 Metric      │  │ - ARI Calculator    │  │   │
│  │  │ - KMS Signing   │  │   Types         │  │ - LlamaFirewall     │  │   │
│  │  │ - Span Proofs   │  │ - Latency       │  │ - Behavioral FSM    │  │   │
│  │  │ - Session       │  │   Buckets       │  │ - Containment       │  │   │
│  │  │   Attestation   │  │ - Issue         │  │ - Approval Store    │  │   │
│  │  │                 │  │   Detection     │  │                     │  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │   │
│  └───────────┼────────────────────┼─────────────────────┼──────────────┘   │
│              │                    │                     │                   │
│              ▼                    ▼                     ▼                   │
│  EXTERNAL SERVICES                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  AWS KMS        │  │  PostgreSQL     │  │  LlamaFirewall              │ │
│  │  (ECC P-256)    │  │  (self-hosted)  │  │  (OpenAI/TogetherAI)        │ │
│  │                 │  │                 │  │                             │ │
│  │  - Session      │  │  - Governance   │  │  - Goal alignment           │ │
│  │    Signing      │  │    Events       │  │    drift check              │ │
│  │  - Attestation  │  │  - Sessions     │  │                             │ │
│  │    Verification │  │  - Approvals    │  │                             │ │
│  │                 │  │  - Policies     │  │                             │ │
│  │                 │  │  - Agents       │  │                             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                             │
│  DASHBOARD                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  React + TypeScript  │  NestJS Dashboard API                        │   │
│  │                                                                      │   │
│  │  - Agent Management     - Policy Editor       - Approval Queue      │   │
│  │  - AIVSS Configuration  - Behavioral Rules    - Session Replay      │   │
│  │  - Trust Tier Display   - Guardrail Config    - Compliance Reports  │   │
│  │  - Observability        - Attestation View    - Trust Health        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Database Schema (Multi-Tenant)

All data is stored in PostgreSQL (self-hosted Supabase) with Row Level Security (RLS) for tenant isolation:

**Core Tables:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `agents` | Agent registration + AIVSS config | `id`, `org_id`, `aivss_config`, `risk_tier` |
| `governance_events` | Event audit trail | `id`, `org_id`, `agent_id`, `session_id`, `event_type` |
| `sessions` | Agent session lifecycle | `id`, `org_id`, `agent_id`, `status`, `goal` |
| `approvals` | HITL approval requests | `id`, `org_id`, `agent_id`, `status`, `expires_at` |
| `policies` | OPA policy versions | `id`, `org_id`, `version`, `rego_content` |
| `behavioral_rules` | Per-org behavioral rules | `id`, `org_id`, `yaml_content`, `enabled` |

**Phase 5 (Adaptation) Tables (NEW in v1.1):**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `trust_score_history` | Trust score calculations over time | `id`, `org_id`, `agent_id`, `trust_score`, `trust_tier`, `calculated_at` |
| `policy_suggestions` | AI-generated policy recommendations | `id`, `org_id`, `agent_id`, `pattern_detected`, `confidence_score`, `status` |
| `trust_tier_changes` | Trust tier adjustment audit trail | `id`, `org_id`, `agent_id`, `previous_tier`, `new_tier`, `created_at` |

**RLS Policy:**
All tables enforce `org_id = auth.org_id()` for complete tenant isolation.

**In-Memory State (Ephemeral):**
- Behavioral conformance state (per-agent semantic type history)
- Semantic classification cache
- Rate limiting counters

**Optional Persistence:**
Behavioral conformance state can optionally be persisted to PostgreSQL for audit and analysis.

**Deployment Note:**
When deploying multiple AGE instances, session affinity (sticky sessions) is required to ensure behavioral conformance state consistency. The load balancer should route all requests for a given `agent_id + session_id` to the same AGE instance.

**Storage Decision Guide:**

| Data Type | Storage | When to Persist to PostgreSQL |
|-----------|---------|------------------------------|
| Conformance State | In-memory (default) | When audit trail required or session spans multiple hours |
| Semantic Cache | In-memory | Never (ephemeral cache) |
| Approval Requests | PostgreSQL (always) | Always - requires durability |
| Rate Limit Counters | In-memory | Never (reset on restart acceptable) |

### 3.3 Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **SDK** | Python 3.9+ | Agent integration (interceptors, telemetry) |
| **Core API** | Go 1.24 + Echo | High-performance governance orchestration |
| **Workflow Engine** | Temporal Cloud | Durable execution, 3 worker types |
| **Policy Engine** | Open Policy Agent (OPA) | Stateless Rego policy evaluation |
| **AGE Sidecar** | Python FastAPI | Risk scoring, behavioral governance, alignment |
| **Database** | PostgreSQL (self-hosted Supabase) | Multi-tenant storage with RLS |
| **State Store** | In-memory + PostgreSQL | Ephemeral state in-memory, persistent data in PostgreSQL |
| **Authentication** | Auth0 | User identity, Organizations, RBAC |
| **Signing** | AWS KMS (ECC P-256) | Cryptographic attestation |
| **Alignment** | LlamaFirewall | Goal drift detection via LLM |
| **Dashboard** | React + TypeScript | Admin interface |
| **Dashboard API** | NestJS | Dashboard backend |

---

## 4. Core Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OPENBOX v1.1 CORE CAPABILITIES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  IDENTITY & ACCESS                      │  ALL-OPERATIONS GOVERNANCE        │
│  ┌───────────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │ • Agent Registration (W3C DID)    │  │  │ • Temporal Workflow Events  │  │
│  │ • API Key Auth (obx_live/test_*)  │  │  │ • Activity Events (I/O)     │  │
│  │ • Multi-tenant (Auth0 + RLS)      │  │  │ • HTTP/DB/Redis (OTel)      │  │
│  │ • Organization-level RBAC         │  │  │ • LLM Calls (OpenAI, etc.)  │  │
│  └───────────────────────────────────┘  │  └─────────────────────────────┘  │
│                                         │                                   │
│  RISK INTELLIGENCE (AIVSS)              │  BEHAVIORAL GOVERNANCE            │
│  ┌───────────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │ • 14-Parameter Risk Scoring       │  │  │ • Behavioral Conformance    │  │
│  │   - Base Security (25%)           │  │  │ • YAML Behavioral Rules     │  │
│  │   - AI-Specific (45%)             │  │  │ • 21 Semantic Types         │  │
│  │   - Impact (30%)                  │  │  │ • Per-Agent State Track     │  │
│  │ • 4 Trust Tiers (Tier 1→4)       │  │  │ • Multi-step Detection      │  │
│  │ • Trust-aware Policy Evaluation   │  │  │ • 6 Built-in Patterns       │  │
│  └───────────────────────────────────┘  │  └─────────────────────────────┘  │
│                                         │                                   │
│  POLICY ENFORCEMENT                     │  GOAL ALIGNMENT                   │
│  ┌───────────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │ • OPA (Open Policy Agent)         │  │  │ • LlamaFirewall Integration │  │
│  │ • Rego Policy Language            │  │  │ • Goal at AGENT_START       │  │
│  │ • Technical & Business Policies   │  │  │ • Real-time Drift Detection │  │
│  │ • Policy Versioning & Rollback    │  │  │ • Alignment Score (0.0-1.0) │  │
│  │ • Policy Testing Sandbox          │  │  │ • Auto Escalation on Drift  │  │
│  └───────────────────────────────────┘  │  └─────────────────────────────┘  │
│                                         │                                   │
│  GUARDRAILS                             │  GRADUATED RESPONSE (5 Verdicts)  │
│  ┌───────────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │ • Input/Output Validation         │  │  │ • HALT - Terminate workflow │  │
│  │ • PII Detection & Masking         │  │  │ • BLOCK - Reject action     │  │
│  │ • Rate Limiting (agent/workflow)  │  │  │ • REQUIRE_APPROVAL - Human  │  │
│  │ • Cost Controls (tokens, calls)   │  │  │ • CONSTRAIN - Sandbox exec  │  │
│  │ • Circuit Breaker                 │  │  │ • ALLOW - Proceed normally  │  │
│  └───────────────────────────────────┘  │  └─────────────────────────────┘  │
│                                         │                                   │
│  CRYPTOGRAPHIC ATTESTATION              │  HUMAN-IN-THE-LOOP (HITL)         │
│  ┌───────────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │ • 2-Level Merkle Tree             │  │  │ • Built-in Approval Flow    │  │
│  │   (Spans → Events → Session)      │  │  │ • Approval Queue Dashboard  │  │
│  │ • AWS KMS (ECC NIST P-256)        │  │  │ • Configurable Timeout      │  │
│  │ • One Signature per Session       │  │  │ • SSE/WebSocket Notify      │  │
│  │ • Tamper-proof Audit Trail        │  │  │ • Approve/Reject + Reason   │  │
│  │ • Verification API                │  │  │ • Manager Escalation        │  │
│  └───────────────────────────────────┘  │  └─────────────────────────────┘  │
│                                         │                                   │
│  OBSERVABILITY                          │  SEMANTIC CLASSIFICATION          │
│  ┌───────────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │ • 8 Metric Types                  │  │  │ • 21 Governance Types       │  │
│  │ • Latency Distribution Buckets    │  │  │   (pii_data, code_exec,     │  │
│  │ • Issue Detection (rate_limit,    │  │  │    external_api, shell_cmd, │  │
│  │   server_error, timeout)          │  │  │    file_write, db_query...) │  │
│  │ • Session Replay + Span Drill     │  │  │ • Tool → Type Mapping       │  │
│  └───────────────────────────────────┘  │  └─────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.1 Cross-Feature Synergies (Trust Lifecycle Integration)

The true power of OpenBox v1.1 comes from how features interact across the Trust Lifecycle. This diagram shows how components feed into each other, creating a self-correcting trust system:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CROSS-FEATURE SYNERGIES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: ASSESS                 PHASE 2: AUTHORIZE                        │
│  ┌──────────────────────┐        ┌──────────────────────┐                  │
│  │ AIVSS Configuration  │        │ OPA Policy Engine    │                  │
│  │ ├─ 14 parameters     │        │ ├─ Stateless rules   │                  │
│  │ └─ Baseline Score    │───────>│ └─ Risk-aware logic  │                  │
│  └──────────────────────┘        └──────────────────────┘                  │
│         │                                   │                               │
│         │ Trust Tier determines             │ Verdict to                    │
│         │ policy strictness                 │ Behavioral Rules              │
│         │                                   │                               │
│         v                                   v                               │
│  ┌──────────────────────┐        ┌──────────────────────┐                  │
│  │ Trust Score = 100    │        │ Behavioral Rules     │                  │
│  │ (Initial)            │        │ ├─ State tracking    │                  │
│  │                      │<───────│ ├─ Multi-step        │                  │
│  └──────────────────────┘        │ └─ Pattern matching  │                  │
│         ▲                        └──────────────────────┘                  │
│         │                                   │                               │
│         │                                   v                               │
│         │                        ┌──────────────────────┐                  │
│         │                        │ Decision Synthesis   │                  │
│         │                        │ ├─ Priority rules    │                  │
│         │                        │ └─ Final verdict     │                  │
│         │                        └──────────────────────┘                  │
│         │                                   │                               │
│  PHASE 3: MONITOR                          v                               │
│  ┌──────────────────────┐        PHASE 4: VERIFY                           │
│  │ Session State        │        ┌──────────────────────┐                  │
│  │ ├─ Semantic types    │        │ Goal Alignment       │                  │
│  │ ├─ Metrics           │───────>│ (LlamaFirewall)      │                  │
│  │ └─ Violations        │        │ ├─ Alignment score   │                  │
│  └──────┬───────────────┘        │ └─ Drift detection   │                  │
│         │                        └──────────┬───────────┘                  │
│         │                                   │                               │
│         │ Violations feed into              │ Goal drift events             │
│         │ Pattern Detection                 │ feed into Violation Log       │
│         │                                   │                               │
│         └────────────────┬───────────────────┘                              │
│                          │                                                  │
│                          v                                                  │
│  PHASE 5: ADAPT                                                             │
│  ┌────────────────────────────────────────────────┐                        │
│  │ Trust Score Calculation                        │                        │
│  │ (0.4 * AIVSS + 0.35 * Behavioral + 0.25 * Alignment) │                  │
│  │                                                │                        │
│  │ Trust Tier Re-evaluation                       │                        │
│  │ ├─ Auto-upgrade if >= 90                       │                        │
│  │ ├─ Auto-downgrade if violations spike         │                        │
│  │ └─ Feedback to Phase 1 (policy update)        │                        │
│  │                                                │                        │
│  │ Violation Pattern Detection                    │                        │
│  │ └─► Policy Suggestion Generator                │                        │
│  │     └─► Human Review → New Behavioral Rules    │                        │
│  └────────────────┬───────────────────────────────┘                        │
│                   │                                                         │
│                   │ Updated policies feed back to                           │
│                   │ Phase 2 (stricter controls)                             │
│                   │                                                         │
│                   └──────────────────────────────────────────┐              │
│                                                              │              │
│                                                              v              │
│                                               Phase 2: AUTHORIZE (Updated)  │
│                                               (Stricter rules applied)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Synergy Flows

**1. AIVSS → Behavioral Rules (Trust Tier → Strictness)**
- Higher AIVSS baseline = lower trust tier → stricter behavioral rules
- Example: Tier 4 agents have more approval requirements than Tier 1 agents

**2. Violations → Trust Score → Policy Strictness (Self-Correcting)**
- Behavioral violations reduce Trust Score
- Score drop triggers trust tier downgrade (e.g., from Tier 2 to Tier 3)
- Downgrade applies stricter policies
- Cycle continues until compliance improves

**3. Goal Drift → Pattern Detection → New Rules (Policy Learning)**
- Goal alignment failures are logged per action
- Pattern detection identifies systematic drift (e.g., "always tries delete during backup")
- Suggestion engine creates new behavioral rule
- Rule blocks future violations

**4. Trust Recovery (Positive Feedback)**
- No violations for N days = Trust Score increases +1/day
- Score reaches threshold = Trust Tier upgrades
- Upgrade enables less restrictive policies
- Reward system encourages compliance

---

## 5. Merkle Tree Attestation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MERKLE TREE ATTESTATION ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SESSION LIFECYCLE                                                          │
│  ────────────────────────────────────────────────────────────               │
│                                                                             │
│  WorkflowStarted ──► Event 1 ──► Event 2 ──► ... ──► WorkflowCompleted     │
│         │                │           │                      │               │
│         ▼                ▼           ▼                      ▼               │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      2-LEVEL MERKLE TREE                              │ │
│  │                                                                       │ │
│  │  Level 1: SPAN TREE (per event)                                       │ │
│  │  ─────────────────────────────                                        │ │
│  │  ┌─────────┐                                                          │ │
│  │  │ Event 1 │                                                          │ │
│  │  │         │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ Spans:  │  │                    span_root                        │ │ │
│  │  │         │  │                       │                             │ │ │
│  │  │ HTTP    │  │              ┌────────┴────────┐                    │ │ │
│  │  │ DB      │  │              │                 │                    │ │ │
│  │  │ LLM     │  │          hash(S1,S2)       hash(S3,S4)              │ │ │
│  │  │         │  │          /      \          /      \                 │ │ │
│  │  └─────────┘  │        S1       S2        S3       S4               │ │ │
│  │               │       (HTTP)  (DB)       (LLM)   (File)             │ │ │
│  │               └─────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  event_hash = SHA256(metadata || span_root)                           │ │
│  │                                                                       │ │
│  │  Level 2: SESSION TREE (all events)                                   │ │
│  │  ─────────────────────────────────                                    │ │
│  │               ┌─────────────────────────────────────────┐             │ │
│  │               │          session_merkle_root            │             │ │
│  │               │                   │                     │             │ │
│  │               │        ┌──────────┴──────────┐          │             │ │
│  │               │        │                     │          │             │ │
│  │               │    hash(E1,E2)          hash(E3,E4)     │             │ │
│  │               │    /       \            /       \       │             │ │
│  │               │  E1        E2          E3        E4     │             │ │
│  │               │ (Start)  (Activity)  (Activity) (End)   │             │ │
│  │               └─────────────────────────────────────────┘             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                         │                                   │
│                                         ▼                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         AWS KMS SIGNING                               │ │
│  │                                                                       │ │
│  │  signature = KMS.Sign(session_merkle_root)                            │ │
│  │                                                                       │ │
│  │  Algorithm: ECDSA with NIST P-256 curve                               │ │
│  │  Key Type:  Customer-managed CMK                                      │ │
│  │  Signing:   ONE signature per session (efficient)                     │ │
│  │                                                                       │ │
│  │  session_attestation = {                                              │ │
│  │    session_id: "...",                                                 │ │
│  │    merkle_root: "...",                                                │ │
│  │    signature: "...",                                                  │ │
│  │    signed_at: "2025-12-25T10:00:00Z",                                 │ │
│  │    key_id: "arn:aws:kms:...",                                         │ │
│  │    algorithm: "ECDSA_SHA_256"                                         │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  VERIFICATION CHAIN                                                         │
│  ─────────────────                                                          │
│                                                                             │
│  To verify any span:                                                        │
│  1. Get span_proof (merkle path from span → event_hash)                     │
│  2. Get event_proof (merkle path from event_hash → session_merkle_root)     │
│  3. Verify KMS signature on session_merkle_root                             │
│                                                                             │
│  span_proof + event_proof + signature = complete verification chain         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Governance Evaluation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GOVERNANCE EVALUATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SDK Telemetry Event                                                        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ OPENBOX CORE                                                         │   │
│  │         │                                                            │   │
│  │         ├──► 1. Semantic Classification (AGE)                        │   │
│  │         │         └─► tool_name → semantic_type mapping              │   │
│  │         │                                                            │   │
│  │         ├──► 2. Trust Tier Lookup (AGE AIVSS)                        │   │
│  │         │         └─► agent_id → trust_tier (Tier 1/2/3/4)         │   │
│  │         │                                                            │   │
│  │         ├──► 3. OPA Policy Evaluation (stateless)                    │   │
│  │         │         └─► input + risk_tier → OPA decision               │   │
│  │         │                                                            │   │
│  │         ├──► 4. Behavioral Conformance (AGE stateful)                │   │
│  │         │         └─► FSM patterns + state tracking                  │   │
│  │         │                                                            │   │
│  │         ├──► 5. Goal Alignment (AGE LlamaFirewall)                   │   │
│  │         │         └─► action vs. goal drift detection                │   │
│  │         │                                                            │   │
│  │         ▼                                                            │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ CONTAINMENT STRATEGY (Priority Resolution)                   │    │   │
│  │  │                                                              │    │   │
│  │  │   OPA Result ──────────┐                                     │    │   │
│  │  │   Conformance Result ──┼──► Verdict Priority ──► Final       │    │   │
│  │  │   Alignment Result ────┘    Resolution           Verdict     │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │         │                                                            │   │
│  │         ▼                                                            │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ VERDICT HANDLING                                             │    │   │
│  │  │                                                              │    │   │
│  │  │   ALLOW ─────────────────► Continue execution                │    │   │
│  │  │   CONSTRAIN ─────────────► Execute with sandbox limits       │    │   │
│  │  │   REQUIRE_APPROVAL ──────► Start HITL workflow, wait         │    │   │
│  │  │   BLOCK ─────────────────► Reject action, workflow continues │    │   │
│  │  │   HALT ──────────────────► Terminate workflow                │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.1 Goal Alignment Fallback Behavior

When LlamaFirewall is unavailable (API down, rate limited, or not configured), the system uses a heuristic fallback:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GOAL ALIGNMENT FALLBACK STRATEGY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Primary Path (LlamaFirewall Available)                                     │
│  ───────────────────────────────────────                                    │
│  1. Extract goal from AGENT_START event                                     │
│  2. On each TOOL_INVOKE, call LlamaFirewall API:                            │
│     - Input: goal + action description + tool arguments                     │
│     - Output: alignment score (0.0 = aligned, 1.0 = misaligned)             │
│  3. If score > 0.7: REQUIRE_APPROVAL                                        │
│     If score > 0.9: BLOCK                                                   │
│                                                                             │
│  Fallback Path (Heuristic)                                                  │
│  ─────────────────────────                                                  │
│  Triggered when:                                                            │
│  - OPENAI_API_KEY and TOGETHER_API_KEY both missing                         │
│  - LlamaFirewall API returns 5xx error                                      │
│  - LlamaFirewall API times out (>5s)                                        │
│  - Rate limit exceeded (429)                                                │
│                                                                             │
│  Heuristic Rules:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. KEYWORD MATCHING                                                  │   │
│  │    - Extract keywords from goal (nouns, verbs)                       │   │
│  │    - Compare with tool_name and arguments                            │   │
│  │    - Score: Jaccard similarity of keyword sets                       │   │
│  │                                                                      │   │
│  │ 2. SEMANTIC TYPE ANALYSIS                                            │   │
│  │    - If goal mentions "read" → allow file_read, database_query       │   │
│  │    - If goal mentions "delete" → flag file_delete, database_delete   │   │
│  │    - If goal mentions "send/share" → allow external_api_call         │   │
│  │    - Mismatch triggers REQUIRE_APPROVAL (not BLOCK)                  │   │
│  │                                                                      │   │
│  │ 3. DESTRUCTIVE ACTION DETECTION                                      │   │
│  │    - Destructive semantic types: file_delete, database_delete,       │   │
│  │      shell_command, code_execution                                   │   │
│  │    - If goal doesn't explicitly mention destruction:                 │   │
│  │      → REQUIRE_APPROVAL for Tier 1/2 agents                          │   │
│  │      → BLOCK for Tier 3/4 agents                                     │   │
│  │                                                                      │   │
│  │ 4. CONSERVATIVE DEFAULT                                              │   │
│  │    - If heuristic confidence < 0.5: ALLOW with warning log           │   │
│  │    - Response includes `fallback_used: true` flag                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Fallback Response Schema:                                                  │
│  {                                                                          │
│    "is_aligned": true,         // Conservative default                      │
│    "score": 0.3,               // Heuristic confidence                      │
│    "reason": "Heuristic fallback - LlamaFirewall unavailable",              │
│    "available": false,         // LlamaFirewall not used                    │
│    "fallback_used": true,      // Heuristic was used                        │
│    "fallback_reason": "API timeout after 5000ms"                            │
│  }                                                                          │
│                                                                             │
│  Monitoring:                                                                │
│  - Metric: `alignment.fallback.count` - track fallback frequency            │
│  - Metric: `alignment.fallback.reason` - categorize failure reasons         │
│  - Alert: If fallback rate > 10% for 5 minutes → PagerDuty alert            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6.2 Governance Evaluation Pipeline with Feedback Loop

The governance evaluation pipeline includes a **feedback loop from Phase 5 (Adapt) back to Phase 1 (Assess)**, enabling continuous trust evolution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  GOVERNANCE PIPELINE WITH ADAPTATION FEEDBACK                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Assess ─────────────────────────────────────────┐                         │
│    │                                              │                         │
│    ▼                                              │                         │
│  Authorize ─────────────────────────────────────┐ │                         │
│    │                                            │ │                         │
│    ├─► OPA Policy                              │ │                         │
│    ├─► Behavioral Rules                        │ │                         │
│    └─► Decision Synthesis                      │ │                         │
│                                                 ▼ │                         │
│  Monitor ────────────────────────────────────── * │                         │
│    │                                            │ │                         │
│    ├─► Session State Tracking                  │ │                         │
│    ├─► Behavioral State Accumulation           │ │                         │
│    └─► Observability Metrics                   │ │                         │
│                  ┌────────────────────────────────┘                         │
│                  │                                                          │
│    ┌─────────────┴──────────────┐                                           │
│    │                            │                                           │
│    ▼                            ▼                                           │
│  Verify                      Adapt                                          │
│    │                          │                                             │
│    ├─► Goal Alignment        ├─► Trust Score Calculation                    │
│    ├─► Drift Detection       ├─► Dynamic Trust Tier Adjustment              │
│    └─► Reasoning Trace       ├─► Violation Pattern Detection                │
│                              ├─► Policy Suggestion Generator                │
│                              └─► Trust Recovery Workflows                   │
│                                   │                                         │
│                                   │ FEEDBACK LOOP                           │
│                                   │ (New in v1.1)                           │
│                                   ▼                                         │
│                              ┌──────────────────┐                           │
│                              │ Update Trust     │                           │
│                              │ Tier & Generate  │                           │
│                              │ Policy Changes   │                           │
│                              └────────┬─────────┘                           │
│                                       │                                     │
│                                       └──────────────────────────┐           │
│                                                                  │           │
│                                                                  ▼           │
│                                                         PHASE 1: RE-ASSESS   │
│                                                         (Trust Tier Updated) │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Adaptation Engine Architecture

The **Adaptation Engine** is the Phase 5 component that closes the governance feedback loop, enabling the system to learn from violations and continuously evolve trust levels and policies.

### Components

**1. Violation Aggregation Service**
Collects violations across all agents and sessions:
- Tracks behavioral rule violations
- Tracks goal drift events
- Tracks REQUIRE_APPROVAL decisions (threshold triggers)
- Stores violations with full context for analysis

**2. Pattern Detection Algorithm**
Identifies recurring violation patterns requiring intervention:
- Temporal patterns: Same violation type within time window
- Sequential patterns: Violation chains (A triggers B)
- Frequency analysis: X violations per N days exceeds threshold
- Scope patterns: Violations affecting specific resource types

Example Pattern Detection:
```
Pattern: Agent "backup-service" attempted deletion 12 times in 7 days,
         always when goal is "backup database"
Trigger: 5+ violations of same type within 7 days
Action: Flag for policy suggestion, reduce trust score
```

**3. Policy Suggestion Generator**
Creates AI-generated recommendations for new behavioral rules:
- Analyzes detected patterns
- Generates YAML rule templates
- Assigns confidence scores (0.0-1.0)
- Flags for human review

Example Suggestion:
```json
{
  "suggestion_id": "sug_789",
  "agent_id": "backup-service",
  "pattern_detected": "delete_during_backup_goal",
  "frequency": 12,
  "time_period_days": 7,
  "suggested_rule": {
    "name": "Block deletion during backup operations",
    "trigger": { "semantic_type": "file_delete" },
    "context": { "goal_contains": "backup" },
    "verdict": "DENY_ACTION",
    "severity": "high"
  },
  "confidence": 0.95,
  "status": "pending_review"
}
```

**4. Trust Tier Adjustment Rules**
Automatic trust tier downgrade/upgrade based on trust score thresholds:

| Trust Score | Trust Tier | Action | Rationale |
|-------------|-----------|--------|-----------|
| >= 90 | Tier 1 | Auto-upgrade if previously Tier 2/3 | Perfect compliance deserves high trust |
| 75-89 | Tier 2 | Maintain or upgrade from Tier 3 if > 10 days good behavior | Consistent compliance |
| 50-74 | Tier 3 | Downgrade if 10+ violations in 7 days | Active monitoring needed |
| 25-49 | Tier 4 | Downgrade if 20+ violations or critical violation | Severe misuse pattern |
| < 25 | Untrusted | Flag for admin review | Recommend decommission |

### Data Flow

```
Violations ──────────► Aggregation ──────────► Pattern Detection
                       Service                 Algorithm
                                                    │
                                                    ▼
                                            Suggestions Queue
                                                    │
                                        ┌──────────┴───────────┐
                                        │                      │
                                        ▼                      ▼
                                    Human Review         Trust Score
                                  (Dashboard)           Recalculation
                                        │                      │
                                        ├─► Approve            │
                                        │   │                  │
                                        │   ▼                  ▼
                                   New Rules          Updated Trust Tier
                                        │                      │
                                        └──────────┬───────────┘
                                                   │
                                                   ▼
                                          Phase 2: Authorization
                                        (Updated Rules Applied)
```

### Data Storage

```sql
CREATE TABLE policy_suggestions (
    id BIGSERIAL PRIMARY KEY,
    agent_id UUID REFERENCES agents(id),
    org_id UUID NOT NULL,
    suggestion_type VARCHAR(50) NOT NULL,  -- 'behavioral_rule', 'opa_policy'
    pattern_detected JSONB NOT NULL,
    pattern_frequency INTEGER NOT NULL,
    time_period_days INTEGER NOT NULL,
    suggested_policy JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'archived'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- Suggestions expire after 30 days if not reviewed
    INDEX (agent_id, created_at DESC),
    INDEX (org_id, status),
    CONSTRAINT rls_org_id CHECK (org_id IS NOT NULL)
);

CREATE TABLE trust_tier_changes (
    id BIGSERIAL PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),
    org_id UUID NOT NULL,
    previous_tier VARCHAR(20) NOT NULL,
    new_tier VARCHAR(20) NOT NULL,
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    change_reason VARCHAR(50) NOT NULL,  -- 'auto_upgrade', 'auto_downgrade', 'manual_override'
    triggered_by VARCHAR(50),  -- 'adaptation_engine', 'admin', 'policy_update'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    INDEX (agent_id, created_at DESC),
    INDEX (org_id, created_at DESC),
    CONSTRAINT rls_org_id CHECK (org_id IS NOT NULL)
);
```

---

## 7. 5-Tier Verdict System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VERDICT PRIORITY HIERARCHY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Priority 1 (Highest)                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ HALT                                                                 │   │
│  │ - Critical policy violation                                          │   │
│  │ - Behavioral rule with on_reject: halt                               │   │
│  │ - Goal alignment violation with safety risk                          │   │
│  │ - Action: Terminate workflow with GovernanceViolationError           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           ↓                                                 │
│  Priority 2                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BLOCK                                                                │   │
│  │ - OPA BLOCK decision                                                 │   │
│  │ - Conformance violation                                              │   │
│  │ - Goal misalignment (high confidence)                                │   │
│  │ - Action: Reject action with error, workflow continues               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           ↓                                                 │
│  Priority 3                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ REQUIRE_APPROVAL                                                     │   │
│  │ - OPA requires_approval decision                                     │   │
│  │ - Behavioral rule with verdict: require_approval                     │   │
│  │ - Goal misalignment (medium confidence)                              │   │
│  │ - Action: Pause execution, create approval request, wait for human   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           ↓                                                 │
│  Priority 4                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CONSTRAIN                                                            │   │
│  │ - High-risk semantic types (code_execution, shell_command)           │   │
│  │ - Tier 3/4 agents with unusual operations                            │   │
│  │ - Action: Execute with sandbox restrictions (timeout, network, fs)   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                           ↓                                                 │
│  Priority 5 (Lowest)                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ALLOW                                                                │   │
│  │ - All checks pass                                                    │   │
│  │ - Action: Execute without restrictions                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. HITL Approval Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HITL APPROVAL WORKFLOW SEQUENCE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Agent          OpenBox Core        AGE               Dashboard   Human     │
│    │                 │               │                    │          │      │
│    │ TOOL_INVOKE     │               │                    │          │      │
│    │────────────────>│               │                    │          │      │
│    │                 │               │                    │          │      │
│    │                 │ /authorize    │                    │          │      │
│    │                 │──────────────>│                    │          │      │
│    │                 │               │                    │          │      │
│    │                 │  REQUIRE_     │                    │          │      │
│    │                 │  APPROVAL     │                    │          │      │
│    │                 │<──────────────│                    │          │      │
│    │                 │               │                    │          │      │
│    │                 │ Create        │                    │          │      │
│    │                 │ ApprovalReq   │                    │          │      │
│    │                 │──────────────>│                    │          │      │
│    │                 │               │                    │          │      │
│    │                 │               │ SSE/WebSocket      │          │      │
│    │                 │               │ Notification       │          │      │
│    │                 │               │───────────────────>│          │      │
│    │                 │               │                    │          │      │
│    │                 │               │                    │ Review   │      │
│    │                 │               │                    │<─────────│      │
│    │                 │               │                    │          │      │
│    │                 │               │                    │ Approve/ │      │
│    │                 │               │                    │ Reject   │      │
│    │                 │               │                    │<─────────│      │
│    │                 │               │                    │          │      │
│    │                 │               │ POST /respond      │          │      │
│    │                 │               │<───────────────────│          │      │
│    │                 │               │                    │          │      │
│    │                 │ Poll status   │                    │          │      │
│    │                 │ (or signal)   │                    │          │      │
│    │                 │<──────────────│                    │          │      │
│    │                 │               │                    │          │      │
│    │  ALLOW/BLOCK    │               │                    │          │      │
│    │<────────────────│               │                    │          │      │
│    │                 │               │                    │          │      │
│    │ Continue/Fail   │               │                    │          │      │
│    │────────────────>│               │                    │          │      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. AIVSS Risk Scoring Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AIVSS RISK SCORING PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BASE SECURITY METRICS (25% weight)                                   │   │
│  │                                                                      │   │
│  │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │   │
│  │ │ Attack Vector  │ │ Attack         │ │ Privileges     │            │   │
│  │ │ (1-4)          │ │ Complexity     │ │ Required       │            │   │
│  │ │ Network→Phys   │ │ (1-2)          │ │ (1-3)          │            │   │
│  │ └────────────────┘ │ Low→High       │ │ None→High      │            │   │
│  │                    └────────────────┘ └────────────────┘            │   │
│  │ ┌────────────────┐ ┌────────────────┐                               │   │
│  │ │ User           │ │ Scope          │   base_score = AV×AC×PR×UI×S │   │
│  │ │ Interaction    │ │ (1-2)          │   (capped at 10)              │   │
│  │ │ (1-2)          │ │ Unchanged→     │                               │   │
│  │ │ None→Required  │ │ Changed        │                               │   │
│  │ └────────────────┘ └────────────────┘                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ AI-SPECIFIC METRICS (45% weight)                                     │   │
│  │                                                                      │   │
│  │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │   │
│  │ │ Model          │ │ Data           │ │ Ethical        │            │   │
│  │ │ Robustness     │ │ Sensitivity    │ │ Impact         │            │   │
│  │ │ (1-5)          │ │ (1-5)          │ │ (1-5)          │            │   │
│  │ │ VeryHigh→VLow  │ │ VeryHigh→VLow  │ │ VeryHigh→VLow  │            │   │
│  │ └────────────────┘ └────────────────┘ └────────────────┘            │   │
│  │ ┌────────────────┐ ┌────────────────┐                               │   │
│  │ │ Decision       │ │ Adaptability   │   ai_score = MR×DS×EI×DC×AD  │   │
│  │ │ Criticality    │ │ (1-5)          │   (capped at 10)              │   │
│  │ │ (1-5)          │ │ VeryHigh→VLow  │                               │   │
│  │ │ VeryHigh→VLow  │ └────────────────┘                               │   │
│  │ └────────────────┘                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ IMPACT METRICS (30% weight)                                          │   │
│  │                                                                      │   │
│  │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────┐ │   │
│  │ │ Confidentiality│ │ Integrity      │ │ Availability   │ │ Safety │ │   │
│  │ │ Impact (1-5)   │ │ Impact (1-5)   │ │ Impact (1-5)   │ │ (1-5)  │ │   │
│  │ │ None→Critical  │ │ None→Critical  │ │ None→Critical  │ │ None→  │ │   │
│  │ └────────────────┘ └────────────────┘ └────────────────┘ │Critical│ │   │
│  │                                                          └────────┘ │   │
│  │   impact_score = (C + I + A + S) / 4                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ FINAL CALCULATION                                                    │   │
│  │                                                                      │   │
│  │   AIVSS_score = 0.25×base + 0.45×AI + 0.30×impact                   │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│   │
│  │   │ Tier 1       │  │ Tier 2       │  │ Tier 3       │  │ Tier 4   ││   │
│  │   │ Lowest Risk  │  │ Low Risk     │  │ High Risk    │  │ Critical ││   │
│  │   │ 0.00 - 0.24  │  │ 0.25 - 0.49  │  │ 0.50 - 0.74  │  │ 0.75-1.0 ││   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9.1 Trust Score Architecture

The **Trust Score** is a unified metric (0-100) that combines baseline risk assessment, runtime behavioral compliance, and goal alignment consistency into a single trust indicator.

### Trust Score Formula

```
trust_score = (0.4 * AIVSS_baseline) + (0.35 * behavioral_compliance) + (0.25 * alignment_consistency)

Where:
- AIVSS_baseline: Initial risk assessment score (0-100), inverted from AIVSS tier
  * Tier 1: 100, Tier 2: 80, Tier 3: 60, Tier 4: 30, Untrusted: 0

- behavioral_compliance: Rolling 30-day behavioral rule compliance rate (0-100)
  * Calculated as: (total_actions - violations) / total_actions * 100

- alignment_consistency: LlamaFirewall goal alignment success rate (0-100)
  * Calculated as: (aligned_actions) / total_actions * 100
  * Actions with alignment_score <= 0.3 count as aligned
```

### Trust Score Components

| Component | Weight | Source | Update Frequency | Range |
|-----------|--------|--------|-------------------|-------|
| AIVSS Baseline | 40% | Agent registration (AIVSS config) | On re-assessment | 0-100 |
| Behavioral Compliance | 35% | Violations in past 30 days | Real-time | 0-100 |
| Alignment Consistency | 25% | Goal drift events in past 30 days | Real-time | 0-100 |

### Calculation Triggers

**Initial Calculation:**
- On agent registration: `trust_score = 100`
- AIVSS baseline component set based on trust tier

**Runtime Calculation:**
- Per-session completion (real-time): After behavioral violations or goal drift events
- Batch recalculation (daily): All active agents for trend analysis
- Manual trigger: Admin override via dashboard

### Storage and History

```sql
CREATE TABLE trust_score_history (
    id BIGSERIAL PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),
    org_id UUID NOT NULL,
    trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
    trust_tier VARCHAR(20) NOT NULL,  -- TIER_1/TIER_2/TIER_3/TIER_4/UNTRUSTED
    aivss_component INTEGER NOT NULL,      -- 0-100
    behavioral_component INTEGER NOT NULL, -- 0-100
    alignment_component INTEGER NOT NULL,  -- 0-100
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculation_trigger VARCHAR(50) NOT NULL,  -- 'session_complete', 'daily_batch', 'manual_override'
    previous_score INTEGER,
    score_change INTEGER,
    INDEX (agent_id, calculated_at DESC),
    INDEX (org_id, calculated_at DESC),
    CONSTRAINT rls_org_id CHECK (org_id IS NOT NULL)
);

CREATE INDEX trust_score_agent_time ON trust_score_history(agent_id, calculated_at DESC);
CREATE INDEX trust_score_org_time ON trust_score_history(org_id, calculated_at DESC);
```

### Trust Tier Mapping

Trust Score drives automatic Trust Tier assignment:

| Score Range | Trust Tier | Description | Policy Template |
|-------------|-----------|-------------|-----------------|
| 90-100 | Tier 1 | Highly trusted, proven track record | Minimal controls, autonomous operation |
| 75-89 | Tier 2 | Trusted, good compliance history | Standard controls, periodic review |
| 50-74 | Tier 3 | Moderate trust, requires monitoring | Active monitoring, frequent review |
| 25-49 | Tier 4 | Low trust, restricted operations | Sandboxed testing, high oversight |
| 0-24 | Untrusted | Untrustworthy, recommend decommission | Quarantine, investigation only |

---

## 10. Behavioral Conformance Engine

Behavioral Conformance provides **stateful, state-based policy enforcement** for agent behavior. Unlike OPA's stateless per-event authorization, the conformance engine tracks what semantic types an agent has accessed during a session and evaluates rules based on prior state conditions.

### Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   BEHAVIORAL CONFORMANCE ENGINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT                          ENGINE                      OUTPUT          │
│  ─────                          ──────                      ──────          │
│                                                                             │
│  ┌─────────────────┐     ┌───────────────────┐     ┌────────────────────┐  │
│  │ YAML Rules      │────>│ Match trigger?    │     │ ALLOW              │  │
│  │ (behavioral/)   │     │                   │────>│ (conditions met)   │  │
│  └─────────────────┘     │                   │     └────────────────────┘  │
│                          │                   │                              │
│  ┌─────────────────┐     │ Check after       │     ┌────────────────────┐  │
│  │ State Tracker   │────>│ conditions:       │     │ BLOCK |            │  │
│  │ (per-agent)     │     │ + depends_on      │────>│ REQUIRE_APPROVAL | │  │
│  └─────────────────┘     │ + within_minutes  │     │ HALT | CONSTRAIN   │  │
│                          └───────────────────┘     └────────────────────┘  │
│  ┌─────────────────┐            ▲                                          │
│  │ Incoming Event  │────────────┘                                          │
│  └─────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OPA vs Behavioral Conformance

| Aspect | OPA Authorization | Behavioral Conformance |
|--------|-------------------|------------------------|
| **Evaluation** | Stateless (per-event) | Stateful (tracks prior accesses) |
| **Question** | "Can this agent do this?" | "Has the agent done X, Y, Z?" |
| **Rules** | Rego (declarative) | YAML (state-based conditions) |
| **Scope** | Single event in isolation | Required prior states before trigger action |
| **Example** | "Tier-3 cannot delete files" | "Must have approval before sharing PII externally" |

### Rule Structure

Rules are defined in YAML with trigger (what activates) and after (required prior states):

```yaml
behavioral_rule:
  name: "External sharing requires approval"
  trigger:
    semantic_type: "external_api_call"
  after:
    - semantic_type: "pii_data"
    - semantic_type: "approval_received"
  enforcement:
    verdict: "require_approval"
    on_reject: "block"
    timeout_minutes: 5
```

### Common Patterns

**Pattern 1: Human-in-the-Loop Approval**
- Trigger: `external_api_call` after `pii_data` access
- Requires: `approval_received` before external sharing

**Pattern 2: Security Gate**
- Trigger: `code_execution`
- Requires: `security_scan` within last 30 minutes

**Pattern 3: Ordered Workflow**
- Trigger: `database_delete`
- Requires: `backup_created` → `approval_received` (ordered with `depends_on`)

> For detailed rule syntax and advanced features, see AGE documentation: `BEHAVIORAL_CONFORMANCE.md`

---

## 11. SDK Interceptor Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SDK INTERCEPTOR FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Temporal        Workflow         Activity         Span          OpenBox   │
│  Runtime         Interceptor      Interceptor      Processor     Core      │
│     │                │                │               │             │      │
│     │ workflow.start │                │               │             │      │
│     │───────────────>│                │               │             │      │
│     │                │                │               │             │      │
│     │                │ register_workflow              │             │      │
│     │                │───────────────────────────────>│             │      │
│     │                │                │               │             │      │
│     │                │ execute_activity               │             │      │
│     │                │ (send_governance_event)        │             │      │
│     │                │────────────────────────────────┼────────────>│      │
│     │                │                │               │  Workflow   │      │
│     │                │                │               │  Started    │      │
│     │                │<───────────────────────────────┼─────────────│      │
│     │                │                │               │             │      │
│     │ activity.execute               │               │             │      │
│     │───────────────────────────────>│               │             │      │
│     │                │                │               │             │      │
│     │                │                │ register_trace│             │      │
│     │                │                │──────────────>│             │      │
│     │                │                │               │             │      │
│     │                │                │ [HTTP calls with OTel]      │      │
│     │                │                │               │             │      │
│     │                │                │ get_buffer    │             │      │
│     │                │                │<──────────────│             │      │
│     │                │                │               │             │      │
│     │                │                │ POST /governance/evaluate   │      │
│     │                │                │────────────────────────────>│      │
│     │                │                │               │  Activity   │      │
│     │                │                │               │  Completed  │      │
│     │                │                │<────────────────────────────│      │
│     │                │                │               │             │      │
│     │                │                │ [Apply guardrails redaction]│      │
│     │                │                │               │             │      │
│     │                │                │ [Check verdict]             │      │
│     │                │                │               │             │      │
│     │  activity.result               │               │             │      │
│     │<───────────────────────────────│               │             │      │
│     │                │                │               │             │      │
│     │ workflow.complete              │               │             │      │
│     │───────────────>│                │               │             │      │
│     │                │                │               │             │      │
│     │                │ execute_activity               │             │      │
│     │                │ (send_governance_event)        │             │      │
│     │                │────────────────────────────────┼────────────>│      │
│     │                │                │               │  Workflow   │      │
│     │                │                │               │  Completed  │      │
│     │                │<───────────────────────────────┼─────────────│      │
│     │                │                │               │             │      │
│     │                │ unregister_workflow            │             │      │
│     │                │───────────────────────────────>│             │      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Component Deep Dives

### 12.1 OpenBox SDK (Python)

**Key Files:**
- `src/poc-ai-agent/openbox/activity_interceptor.py`
- `src/poc-ai-agent/openbox/workflow_interceptor.py`
- `src/poc-ai-agent/openbox/types.py`
- `src/poc-ai-agent/openbox/span_processor.py`
- `src/poc-ai-agent/openbox/activities.py`

**Type Definitions:**

```python
class GovernanceVerdict(str, Enum):
    ALLOW = "allow"
    CONSTRAIN = "constrain"
    REQUIRE_APPROVAL = "require_approval"
    BLOCK = "block"
    HALT = "halt"

@dataclass
class GovernanceVerdictResponse:
    action: str              # 5 possible values
    reason: Optional[str]
    risk_score: float        # Populated by AIVSS
    risk_tier: int           # 1-4
    alignment_score: float   # 0.0 = aligned, 1.0 = misaligned
    behavioral_violations: List[str]
    approval_required: bool
    constraints: Optional[ExecutionConstraints]
    guardrails_result: Optional[GuardrailsCheckResult]
```

### 12.2 OpenBox Core (Go)

**Key Files:**
- `src/openbox-core/internal/services/governance_workflow.go`
- `src/openbox-core/internal/services/attestation_workflow.go`
- `src/openbox-core/internal/services/observability_workflow.go`
- `src/openbox-core/internal/services/opa.go`
- `src/openbox-core/internal/content/governance.go`

**Workflow Activities:**

```go
// Governance Event Workflow Activities
func ValidateAgentActivity(ctx context.Context, input) (*ValidationResult, error)
func SessionLifecycleActivity(ctx context.Context, input) (*Session, error)
func SemanticClassificationActivity(ctx context.Context, input) (string, error)
func RiskTierLookupActivity(ctx context.Context, agentID string) (int, error)
func PolicyEvaluationActivity(ctx context.Context, input) (*PolicyResult, error)
func BehavioralConformanceActivity(ctx context.Context, input) (*ConformanceResult, error)
func GoalAlignmentActivity(ctx context.Context, input) (*AlignmentResult, error)
func GuardrailsCheckActivity(ctx context.Context, input) (*GuardrailsResult, error)
func ContainmentDecisionActivity(ctx context.Context, input) (*ContainmentResult, error)
func StoreGovernanceEventActivity(ctx context.Context, input) error
func HandleApprovalRequiredActivity(ctx context.Context, input) (*ApprovalResult, error)
func StartAttestationWorkflow(ctx context.Context, sessionID string) error
```

### 12.3 Agent Governance Engine (Python)

**Key Files:**
- `src/agent-governance-engine/server/components/ari_calculator.py`
- `src/agent-governance-engine/server/components/alignment_checker.py`
- `src/agent-governance-engine/server/components/behavioral_conformance.py`
- `src/agent-governance-engine/server/components/conformance_fsm.py`
- `src/agent-governance-engine/server/components/containment.py`
- `src/agent-governance-engine/server/api/routers/governance.py`
- `src/agent-governance-engine/server/api/routers/agent_risk.py`

---

## 13. API Reference

### AGE Governance APIs

**Register Agent with AIVSS Configuration**
```
POST /api/v1/agents/register
Request: {
  agent_id: string,
  aivss_config: AIVSSConfig
}
Response: {
  aivss_score: float,
  normalized_score: float,
  risk_tier: int,
  breakdown: object
}
```

**Authorize Agent Action**
```
POST /api/v1/governance/authorize
Request: {
  agent_id: string,
  event_type: string,
  verb: string,
  attributes: object,
  risk_tier: int
}
Response: {
  verdict: string,
  reason: string,
  is_sandboxable: bool,
  constraints: object,
  details: object
}
```

**Request Human Approval**
```
POST /api/v1/governance/approvals/request
Request: {
  agent_id: string,
  tool_name: string,
  operation_scope: string,
  context: object,
  timeout_seconds: int
}
Response: {
  approval_id: string,
  status: string,
  poll_url: string,
  respond_url: string,
  expires_at: string
}
```

**Respond to Approval Request**
```
POST /api/v1/governance/approvals/{approval_id}/respond
Request: {
  approved: bool,
  approver: string,
  reason: string
}
Response: {
  approval_id: string,
  status: string,
  approved: bool,
  approver: string,
  responded_at: string
}
```

**Get Pending Approvals**
```
GET /api/v1/governance/approvals/pending
Response: {
  count: int,
  approvals: []ApprovalRequest
}
```

**Check Behavioral Conformance**
```
POST /api/v1/governance/conformance/check
Request: {
  org_id: string,
  agent_id: string,
  session_id: string,
  semantic_type: string,
  event_context: object
}
Response: {
  conforms: bool,
  violations: []string,
  current_state: string,
  pattern_name: string,
  verdict: string,
  reason: string
}
```

**Check Goal Alignment**
```
POST /api/v1/governance/alignment/check
Request: {
  org_id: string,
  agent_id: string,
  session_id: string,
  action: string,
  tool_name: string,
  arguments: object
}
Response: {
  is_aligned: bool,
  score: float,           # 0.0 = aligned, 1.0 = misaligned
  reason: string,
  available: bool,        # Whether LlamaFirewall was used
  fallback_used: bool     # Whether heuristic fallback was used
}
```

**Store Agent Goal**
```
POST /api/v1/governance/alignment/goal
Request: {
  org_id: string,
  agent_id: string,
  session_id: string,
  goal: string
}
Response: {
  stored: bool,
  goal_hash: string
}
```

**Get Trust Tier**
```
GET /api/v1/governance/trust/{agent_id}
Response: {
  agent_id: string,
  trust_tier: string,     # TIER_1/TIER_2/TIER_3/TIER_4
  aivss_score: float,
  normalized_score: float,
  breakdown: {
    base_score: float,
    ai_score: float,
    impact_score: float
  }
}
```

**Classify Semantic Type**
```
POST /api/v1/governance/semantic/classify
Request: {
  org_id: string,
  tool_name: string,
  event_type: string,
  context: object
}
Response: {
  semantic_type: string,
  confidence: float,
  source: string          # "mapping" | "pattern" | "llm_fallback"
}
```

### Trust Score APIs (Phase 5: Adaptation)

**Get Current Trust Score**
```
GET /api/v1/governance/trust-score/{agent_id}
Response: {
  agent_id: string,
  trust_score: integer,           # 0-100
  trust_tier: string,             # TIER_1/TIER_2/TIER_3/TIER_4/UNTRUSTED
  aivss_component: integer,
  behavioral_component: integer,
  alignment_component: integer,
  calculated_at: string,          # ISO 8601 timestamp
  trend: string,                  # "improving" | "stable" | "declining"
  score_change_30d: integer       # Change in last 30 days
}
```

**Get Trust Score History**
```
GET /api/v1/governance/trust-score/{agent_id}/history
Query Parameters:
  days: integer                   # Default: 30, max: 365
  limit: integer                  # Default: 100, max: 1000

Response: {
  agent_id: string,
  history: [
    {
      trust_score: integer,
      trust_tier: string,           # TIER_1/TIER_2/TIER_3/TIER_4/UNTRUSTED
      aivss_component: integer,
      behavioral_component: integer,
      alignment_component: integer,
      calculated_at: string,
      calculation_trigger: string
    }
  ],
  trend_analysis: {
    average_score: float,
    min_score: integer,
    max_score: integer,
    volatility: float             # Standard deviation
  }
}
```

### Policy Suggestion APIs

**Get Policy Suggestions Queue**
```
GET /api/v1/governance/policy-suggestions
Query Parameters:
  status: string                  # "pending", "approved", "rejected", "all"
  agent_id: string                # Optional: filter by agent
  limit: integer                  # Default: 50, max: 500

Response: {
  count: integer,
  suggestions: [
    {
      suggestion_id: string,
      agent_id: string,
      pattern_detected: string,
      pattern_frequency: integer,
      time_period_days: integer,
      suggested_policy: object,
      confidence_score: float,    # 0.0-1.0
      status: string,
      created_at: string,
      expires_at: string
    }
  ]
}
```

**Review Policy Suggestion**
```
POST /api/v1/governance/policy-suggestions/{suggestion_id}/review
Request: {
  approved: boolean,
  notes: string
}
Response: {
  suggestion_id: string,
  status: string,                 # "approved" | "rejected"
  reviewed_by: string,
  reviewed_at: string,
  notes: string
}
```

### Adaptation Evaluation API

**Trigger Adaptation Evaluation**
```
POST /api/v1/governance/adaptation/evaluate
Query Parameters:
  agent_id: string                # Optional: specific agent
  force: boolean                  # Default: false

Response: {
  evaluation_id: string,
  triggered_at: string,
  agents_evaluated: integer,
  violations_analyzed: integer,
  patterns_detected: integer,
  suggestions_created: integer,
  tier_changes: [
    {
      agent_id: string,
      previous_tier: string,        # TIER_1/TIER_2/TIER_3/TIER_4/UNTRUSTED
      new_tier: string,             # TIER_1/TIER_2/TIER_3/TIER_4/UNTRUSTED
      reason: string
    }
  ]
}
```

**Get Adaptation Status**
```
GET /api/v1/governance/adaptation/status/{agent_id}
Response: {
  agent_id: string,
  violation_count_30d: integer,
  violation_count_7d: integer,
  violation_patterns: [
    {
      pattern_type: string,
      frequency: integer,
      first_detected: string,
      last_detected: string,
      severity: string            # "low" | "medium" | "high" | "critical"
    }
  ],
  trust_recovery_status: string,  # "not_required" | "in_progress" | "completed"
  days_since_last_violation: integer,
  estimated_recovery_days: integer
}
```

---

## 14. Performance & Scalability Requirements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE REQUIREMENTS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Metric                          │ Requirement  │ Notes                     │
│  ────────────────────────────────┼──────────────┼───────────────────────────│
│  Governance decision (p95)       │ <250ms       │ Full pipeline             │
│  Policy evaluation (avg)         │ <10ms        │ OPA cached                │
│  Risk tier lookup (avg)          │ <5ms         │ AGE cache                 │
│  Behavioral check (p95)          │ <30ms        │ FSM state lookup          │
│  Goal alignment (p95)            │ <100ms       │ LLM call (cached)         │
│  HITL approval (p95)             │ <30s         │ Human response time       │
│  Attestation creation (avg)      │ <100ms       │ KMS signing               │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  SCALABILITY REQUIREMENTS                                                   │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  Metric                          │ Target                                   │
│  ────────────────────────────────┼──────────────────────────────────────────│
│  Policy evaluations              │ 1,000+/minute                            │
│  Risk tier lookups               │ 10,000+/minute                           │
│  Behavioral checks               │ 5,000+/minute                            │
│  Alignment checks                │ 1,000+/minute (LLM rate limit)           │
│  Approval requests               │ 100+/minute                              │
│  Organizations supported         │ 100+                                     │
│  Agents per organization         │ 10,000+                                  │
│  Uptime SLA                      │ 99.5%+                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Security & Compliance Requirements

### 15.1 Multi-Tenant Security

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Database-layer isolation** | PostgreSQL RLS with `org_id = auth.org_id()` | REQUIRED |
| **API-layer isolation** | Derive org_id from JWT, never accept from client | REQUIRED |
| **In-memory state isolation** | Key by `(org_id, agent_id, session_id)` | REQUIRED |
| **Cache isolation** | Org-scoped cache keys | REQUIRED |

### 15.2 API Security

| Requirement | Description |
|-------------|-------------|
| **NFR-SEC-1** | API endpoints MUST derive `org_id` from authenticated JWT, never from request body |
| **NFR-SEC-2** | API key authentication MUST bind key to single organization |
| **NFR-SEC-3** | Cross-org resource access MUST return 404 (not 403) to prevent enumeration |
| **NFR-SEC-4** | All state mutations MUST validate org ownership before write |

### 15.3 Audit Trail Requirements

| Event Type | Audit Requirement | Retention |
|------------|-------------------|-----------|
| Governance events | `governance_events` table with RLS | 7 years |
| Policy changes | Admin audit log with version history | 5 years |
| API key lifecycle | Create/rotate/revoke with actor_id | 5 years |
| User role changes | Admin audit log | 5 years |
| Approval responses | governance_events with decision metadata | 7 years |

### 15.4 Critical Security Controls

**Before Production Deployment:**

1. **In-memory state MUST enforce org_id scoping** - All in-memory state stores (conformance state, semantic cache, rate limit counters) must be keyed by `org_id` to prevent cross-tenant data exposure.

2. **Fail-secure defaults** - LlamaFirewall fallback must use BLOCK (not ALLOW) for high-risk operations when external service is unavailable.

3. **RLS enforcement verification** - Integration tests must verify cross-org data access is blocked at database level.

4. **Administrative audit log** - Create `admin_audit_log` table for policy changes, API key management, and user role changes.

### 15.5 OWASP Compliance Notes

| OWASP Risk | Mitigation |
|------------|------------|
| **A01 Broken Access Control** | RLS + API-layer org validation + ownership checks |
| **A02 Cryptographic Failures** | API keys hashed with PBKDF2-SHA256, TLS 1.3 enforced |
| **A03 Injection** | YAML safe_load for behavioral rules, parameterized queries |
| **A04 Insecure Design** | Fail-secure defaults, defense in depth |
| **A07 Identification/Auth** | Auth0 with optional MFA for admin roles |

---

## 16. Gap Analysis Summary (Functional)

| Capability | v1.0 | v1.1 | Integration Point |
|------------|------|------|-------------------|
| Risk Scoring | risk_score: 0.0 (hardcoded) | AIVSS 14-parameter model | AGE `/governance/risk` |
| Verdict Types | 2 (continue/stop) | 5 (HALT/BLOCK/HITL/CONSTRAIN/ALLOW) | SDK + Core types |
| Goal Alignment | Not implemented | LlamaFirewall integration | AGE `/governance/alignment` |
| Behavioral Rules | Stateless OPA only | FSM + YAML rules | AGE `/governance/conformance` |
| HITL Workflow | Manual | Built-in approval | AGE `/governance/approvals/*` |
| Cryptographic Attestation | KMS + Merkle tree | Preserved | No change |
| Temporal Integration | Native workflows | Extended | New activities added |

---

## 17. Migration Guide (v1.0 → v1.1)

### Backward Compatibility

- SDK v1.1 is compatible with v1.0 governance events
- Agents without AIVSS config are assigned default Tier 2
- Verdict mapping: v1.0 `continue` → v1.1 `ALLOW`, v1.0 `stop` → v1.1 `HALT`
- Existing OPA policies work unchanged

### Migration Steps

1. **Deploy AGE Sidecar** alongside OpenBox Core
2. **Configure PostgreSQL** for persistent state storage (approvals, policies, behavioral rules)
3. **Upgrade OpenBox Core** with new workflow activities
4. **Upgrade Dashboard** with AIVSS UI and Approval Queue
5. **Configure AIVSS parameters** for agents (optional, defaults to Tier 2)
6. **Define behavioral rules** in YAML (optional)

---

## Source Files Referenced

**OpenBox Core:**
- `src/openbox-core/internal/services/governance_workflow.go`
- `src/openbox-core/internal/services/attestation_workflow.go`
- `src/openbox-core/internal/services/observability_workflow.go`
- `src/openbox-core/internal/services/opa.go`
- `src/openbox-core/internal/content/governance.go`

**Agent Governance Engine:**
- `src/agent-governance-engine/server/components/ari_calculator.py`
- `src/agent-governance-engine/server/components/alignment_checker.py`
- `src/agent-governance-engine/server/components/behavioral_conformance.py`
- `src/agent-governance-engine/server/components/conformance_fsm.py`
- `src/agent-governance-engine/server/components/containment.py`
- `src/agent-governance-engine/server/api/routers/governance.py`

**OpenBox SDK:**
- `src/poc-ai-agent/openbox/activity_interceptor.py`
- `src/poc-ai-agent/openbox/workflow_interceptor.py`
- `src/poc-ai-agent/openbox/types.py`
- `src/poc-ai-agent/openbox/span_processor.py`

---

## Appendix: Terminology

### AIVSS vs ARI Naming Convention

| Term | Full Name | Description |
|------|-----------|-------------|
| **AIVSS** | AI Vulnerability Scoring System | The 14-parameter methodology for assessing AI agent risk. Defines the parameters, weights, and calculation formula. |
| **AIVSS Score** | AI Vulnerability Severity Score | The calculated score (0.0-1.0) produced by applying the AIVSS methodology to an agent's configuration. |
| **AIVSS Calculator** | AIVSS Score Calculator | The component (`aivss_calculator.py`) that computes scores using AIVSS methodology. |
| **Trust Tier** | Trust Classification Tier | The tier assignment (Tier 1/2/3/4) derived from the AIVSS score (Tier 1: 90-100, Tier 2: 75-89, Tier 3: 50-74, Tier 4: 25-49). |

**Usage in APIs:**
- Request/response fields use `aivss_score` and `aivss_config` (methodology reference)
- Internal calculations use `ari_score` (calculated value)
- Trust tier is always `trust_tier` (TIER_1, TIER_2, TIER_3, TIER_4, or UNTRUSTED)

**Usage in Documentation:**
- Technical documentation uses "AIVSS" when referring to the configuration/methodology
- Tech Spec uses "ARI Calculator" for the component name
- API responses include both `aivss_score` (the calculated numeric value) and `trust_tier` (the categorical assignment)
- Database enum values: TIER_1, TIER_2, TIER_3, TIER_4, UNTRUSTED
