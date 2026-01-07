# OpenBox v1.1 Glossary

**Purpose:** Unified terminology reference for Trust Lifecycle Model
**Version:** 1.1.0
**Last Updated:** 2026-01-07

---

## Core Concepts

### Trust Lifecycle
A 5-phase framework for establishing, maintaining, and adapting trust in AI agents throughout their operational lifetime. Phases: Assess → Authorize → Monitor → Verify → Adapt.

### Trust Score
**Definition:** Unified metric (0-100) representing an agent's trustworthiness based on baseline assessment, runtime behavior, and goal alignment.

**Formula:**
```
trust_score = f(AIVSS_baseline, behavioral_compliance, alignment_consistency)

Proposed weights:
- AIVSS baseline: 40%
- Behavioral compliance: 35%
- Alignment consistency: 25%
```

**Calculation Triggers:**
- Initial: On agent registration (baseline = 100)
- Runtime: After behavioral violations or goal drift events
- Batch: Daily recalculation for all active agents
- Manual: Admin-triggered recalculation (via Agent Detail → Assess tab)

**Storage:** PostgreSQL with time-series history for trend analysis

### Trust Tier
**Definition:** Categorization of agent trustworthiness using numerical tiers (higher number = lower trust).

**Tier Definitions:**

| Trust Tier | Score Range | Description | Use Case |
|------------|-------------|-------------|----------|
| **Tier 1** | 90-100 | Highly trusted agents with proven track record | Critical operations, minimal oversight |
| **Tier 2** | 75-89 | Trusted agents with good compliance history | Standard operations, periodic review |
| **Tier 3** | 50-74 | Moderate trust, requires active monitoring | Limited scope, frequent review |
| **Tier 4** | 25-49 | Low trust, restricted operations | Sandboxed testing, high oversight |
| **Tier 5 (Untrusted)** | 0-24 | Untrustworthy, recommend decommission | Quarantine, investigation |

**Mapping from Legacy Risk Tier:**

| Previous (Risk Tier) | New (Trust Tier) | Notes |
|---------------------|------------------|-------|
| Tier 1 (Low Risk) | Tier 1 | Direct mapping |
| Tier 2 (Medium Risk) | Tier 2 | Direct mapping |
| Tier 3 (High Risk) | Tier 3 | Direct mapping |
| Tier 4 (Critical Risk) | Tier 4 | Direct mapping |
| N/A | Tier 5 (Untrusted) | New tier for degraded trust |

---

## Phase 1: Assess

### AIVSS (AI Vulnerability Surface Scoring)
**Definition:** Baseline risk assessment using 14 parameters covering model capabilities, data sensitivity, and operational context.

**Key Parameters:**
- `model_capability`: General/Specialized/Proprietary (0-2)
- `data_sensitivity`: Low/Medium/High (0-2)
- `decision_scope`: Limited/Significant/Critical (0-2)
- `autonomy`: Human-in-loop/Supervised/Autonomous (0-2)
- And 10 more parameters...

**Output:** AIVSS score (0-100) and initial Trust Tier assignment.

### Baseline Trust Assessment
Initial trustworthiness evaluation performed during agent registration, establishing starting Trust Score = 100 and Trust Tier based on AIVSS.

---

## Phase 2: Authorize

### OPA Policy
**Definition:** Stateless authorization rules using Open Policy Agent (Rego language) that evaluate per-action based on agent metadata and request context.

**Risk-Aware:** Policies can reference Trust Tier to apply stricter controls for lower-trust agents.

**Example:**
```rego
allow {
    input.agent.trust_tier == "Tier 1"
    input.action.type == "database_query"
}

allow {
    input.agent.trust_tier == "Tier 3"
    input.action.type == "database_query"
    requires_approval(input)
}
```

### Behavioral Rule
**Definition:** Stateful pattern-matching rules defined in YAML that track semantic types across an agent's session to enforce temporal constraints.

**Structure:**
```yaml
behavioral_rule:
  name: "PII requires approval before external sharing"
  trigger:
    semantic_type: "external_api_call"
  before:
    - semantic_type: "pii_data"
  after:
    - semantic_type: "approval_received"
  on_violation:
    verdict: REQUIRE_APPROVAL
```

**Risk-Proportional Enforcement:** (Proposed v1.1 enhancement) Rules can specify different actions per Trust Tier.

### Semantic Type
**Definition:** Structured metadata tag (organization.category.subcategory) assigned to actions to enable behavioral tracking.

**Examples:**
- `acme.data.pii`
- `acme.integration.external_api`
- `acme.approval.manager_approved`

### Governance Decision
**Definition:** Authorization verdict returned by the governance evaluation pipeline.

**Possible Decisions:**
- `ALLOW` - Action permitted, proceed
- `DENY_ACTION` - Action blocked, request rejected
- `REQUIRE_APPROVAL` - Human review required (HITL)
- `CONSTRAIN` - Action allowed with modifications
- `TERMINATE_AGENT` - Severe violation, halt agent execution

**(Previously called "Verdict")**

### Decision Synthesis
**Definition:** Process of combining verdicts from OPA, Behavioral, and Goal Alignment components into a single governance decision with prioritization rules.

**Prioritization:**
1. TERMINATE_AGENT (highest priority)
2. REQUIRE_APPROVAL
3. DENY_ACTION
4. CONSTRAIN
5. ALLOW (default)

**(Previously called "Containment Strategy")**

---

## Phase 3: Monitor

### Behavioral State
**Definition:** Accumulator tracking all semantic types observed during an agent's session, used for evaluating stateful behavioral rules.

**Example:**
```json
{
  "session_id": "sess_123",
  "semantic_types": [
    "acme.data.pii",
    "acme.approval.pending",
    "acme.integration.external_api"
  ]
}
```

### Observability Metrics
**Definition:** Quantitative performance indicators tracked per agent:
- Latency (p50, p95, p99)
- Error rate
- Rate limits (requests/min)
- Token usage (LLM cost tracking)

### Telemetry Span
**Definition:** OpenTelemetry distributed trace representing a single unit of work in an agent's execution, with metadata for correlation and debugging.

---

## Phase 4: Verify

### Goal Alignment
**Definition:** Process of comparing agent's stated goal against action being performed to detect goal drift or misalignment.

**Implementation:** LlamaFirewall integration using LLM-based semantic comparison.

**Output:** Alignment score (0.0 = perfect alignment, 1.0 = complete misalignment)

### Goal Drift
**Definition:** Detected discrepancy between agent's declared goal and observed action, indicating potential misalignment.

**Thresholds:**
- 0.0-0.3: Aligned (no action)
- 0.3-0.7: Partial drift (log warning)
- 0.7-1.0: Severe drift (trigger REQUIRE_APPROVAL or DENY_ACTION)

### Reasoning Trace
**Definition:** Structured log of agent's decision-making process captured via OpenTelemetry spans, used for audit and debugging.

---

## Phase 5: Adapt

### Trust Adaptation
**Definition:** Feedback loop that adjusts Trust Score and Trust Tier based on observed violations, compliance patterns, and goal alignment history.

**Triggers:**
- Behavioral violations
- Goal drift events
- Manual tier adjustments (admin override)
- Time-based trust recovery

### Violation Pattern Detection
**Definition:** Analysis of repeated behavioral violations or goal drift to identify systematic misalignment requiring policy changes.

**Example:**
```
Pattern detected: Agent "data-processor" repeatedly attempts
deletion when goal is "backup" (5 occurrences in 7 days)
→ Suggestion: Create rule "backup goal + delete action = REQUIRE_APPROVAL"
```

### Policy Suggestion
**Definition:** AI-generated recommendation for new behavioral rules or OPA policies based on observed violation patterns.

**Structure:**
```json
{
  "suggestion_id": "sug_789",
  "type": "behavioral_rule",
  "pattern": "backup_goal_with_delete_action",
  "frequency": 5,
  "proposed_rule": {...},
  "confidence": 0.85,
  "status": "pending_review"
}
```

### Trust Recovery
**Definition:** Gradual increase in Trust Score over time for agents that demonstrate consistent compliance after violations.

**Recovery Rate:** Configurable (default: +1 point per day without violations, up to original baseline)

---

## Human-in-the-Loop (HITL)

### Approval Workflow
**Definition:** Process where high-risk actions are paused and routed to human reviewers for explicit approval/rejection.

**Trigger Conditions:**
- Governance Decision = REQUIRE_APPROVAL
- Trust Tier = Tier 4/Tier 5 + sensitive action
- Manual policy override

### Approval Context
**Definition:** Metadata package provided to human reviewers including:
- Agent Trust Score and Trust Tier
- Action details
- Relevant behavioral rules
- Goal alignment score
- Impact analysis (effect on Trust Score if approved/rejected)

---

## Attestation & Provenance

### Cryptographic Attestation
**Definition:** Tamper-proof, signed record of governance decisions and agent actions stored in blockchain-compatible format (Merkle tree + signatures).

**Comprehensive Trust Attestation:** (Proposed v1.1 enhancement) Include all trust dimensions:
```json
{
  "session_id": "sess_123",
  "merkle_root": "0x...",
  "signature": "...",
  "trust_context": {
    "trust_score": 87,
    "trust_tier": "Tier 2",
    "aivss_score": 0.35,
    "behavioral_compliance_rate": 0.95,
    "goal_alignment_score": 0.0,
    "violations_count": 2
  }
}
```

---

## Terminology Migration

### Deprecated Terms (v1.0 → v1.1)

| Deprecated Term | New Term | Rationale |
|----------------|----------|-----------|
| Risk Score | Trust Score | Unified metric concept |
| Verdict | Governance Decision | Less judicial tone |
| Containment Strategy | Decision Synthesis | Less hostile framing |
| HALT | TERMINATE_AGENT | Clearer distinction |
| BLOCK | DENY_ACTION | More specific |

### Transition Guidelines
- Documentation: Use new terms with deprecated terms in parentheses for 1 release cycle
- API: Support both terms during v1.1, deprecate old terms in v1.2
- UI: Display new terms only (no legacy reference)

---

## Cross-Feature Synergies

### AIVSS → Behavioral
Trust Tier from AIVSS assessment informs strictness of behavioral rule enforcement (risk-proportional governance).

### Behavioral → Trust Tier
Repeated behavioral violations reduce Trust Score and may trigger Trust Tier downgrade from Tier 1 to higher-numbered tiers (trust degradation).

### Goal Alignment → Behavioral
Persistent goal drift patterns trigger automatic creation of new behavioral rules (policy learning).

### Goal Alignment → Trust Score
Severe goal drift events reduce Trust Score and may trigger Trust Tier re-evaluation.

### All Components → Trust Score
Unified Trust Score aggregates signals from AIVSS baseline, behavioral compliance, and goal alignment consistency.

---

## References

- **Trust Lifecycle Model:** See `docs/concepts/trust-lifecycle-model.md`
- **Domain Analysis:** See `docs/analysis/260106-ai-governance-domain-analysis.md`
- **Technical Architecture:** See `docs/architecture/openbox-v1.1-technical-spec.md`
- **Product Requirements:** See `docs/prds/openbox-v1.1.md`
