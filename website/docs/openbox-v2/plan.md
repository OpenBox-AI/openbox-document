# Implementation Plan: AGE Production Readiness for OpenBox v1.1

## Overview

Transform Agent Governance Engine (AGE) from proof-of-concept to production-ready multi-tenant service integrated with OpenBox v1.1.

**Critical Gaps to Address:**
1. **Multi-Tenancy**: Zero org_id concept, cross-tenant data exposure
2. **Production Readiness**: OPA in testing mode, missing tests, no rate limiting

**Current State**: AGE is 70-80% functionally complete but NOT production-ready.

---

## Goals

### Business Goals
- Enable AGE integration with OpenBox v1.1 multi-tenant platform
- Support 100+ organizations with complete data isolation
- Meet production SLA requirements (99.9% uptime, `<200ms` p95 latency)

### Technical Goals
- Complete org-scoped data isolation (zero cross-tenant data leakage)
- Comprehensive test coverage (>80% unit, 100% critical path integration)
- Production-grade error handling and monitoring
- Backward compatible SDK (v1.0 agents upgrade without code changes)

### Security Goals
- Multi-tenant isolation with concurrency safety
- Per-org rate limiting (prevent noisy neighbor attacks)
- Comprehensive OPA policies (exit testing mode)

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | All AGE components must accept and enforce `org_id` parameter | Critical |
| FR-2 | Database tables must use RLS with org_id for tenant isolation | Critical |
| FR-3 | OPA policies must evaluate org context in decisions | Critical |
| FR-4 | Approval workflows must be org-scoped (no cross-org visibility) | Critical |
| FR-5 | Behavioral rules must be configurable per-org | High |
| FR-6 | API endpoints must validate org ownership via Auth0 JWT | Critical |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Org-scoping latency overhead | `<50ms p95` |
| NFR-2 | Scalability | 10K agents across 100 orgs |
| NFR-3 | Reliability | 99.9% uptime with graceful degradation |
| NFR-4 | Security | Zero cross-tenant data exposure |
| NFR-5 | Maintainability | >80% test coverage, documented APIs |

---

## Architecture

### Multi-Tenant Data Model

```
Organization (Auth0 org_id)
  ├── Agents (agent_id scoped to org)
  ├── Behavioral Rules (per-org configs)
  ├── OPA Policies (per-org versioned policies)
  ├── Approval Store (org-scoped approvals)
  └── Conformance State (in-memory, optionally persisted)
```

### Storage Strategy

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Agent metadata + AIVSS config | PostgreSQL | Persistent, queryable, RLS-protected |
| Approvals | PostgreSQL | Durable, needs audit trail |
| Policies | PostgreSQL | Versioned, per-org |
| Behavioral conformance state | In-memory (default) | Ephemeral per-session |
| Semantic classification cache | In-memory | Fast lookup, TTL-based |
| Rate limiting counters | In-memory | Sub-second operations |

### Auth Flow Integration

```
Client Request → FastAPI Middleware → Auth0 JWT Validation → Extract org_id →
Inject into request.state.org_id → All services receive org_id →
Database queries scoped to org via RLS
```

---

## Implementation Phases

### Phase 1: Multi-Tenancy Foundation (CRITICAL)

**Goal**: Add org_id to all data models, APIs, and components with zero cross-tenant leakage.

#### Task 1.1: Core Data Model Updates
- Add `org_id` to all Pydantic models (ATSEvent, AgentMetadata, governance types)
- Create org context utility for async request handling

**Acceptance Criteria:**
- All Python files compile without org_id errors
- No function accepts agent_id without org_id

#### Task 1.2: Auth0 JWT Middleware
- Create JWT validation middleware
- Extract org_id from JWT custom claim
- Inject org_id into request state for all handlers

**Acceptance Criteria:**
- Requests without valid JWT return 401
- Requests with valid JWT have org_id available in handlers

#### Task 1.3: Database Org-Scoping
- Add RLS policies to all PostgreSQL tables
- Update all database queries to include org_id
- Create database schema for agent metadata, approvals, policies

**Acceptance Criteria:**
- All persistent data protected by RLS
- Integration test: 2 orgs write same agent_id, read different data

#### Task 1.4: Org-Scoped Component Refactoring
- **StateTracker**: Use in-memory storage with org+agent scoping
- **ApprovalStore**: Remove global singleton, add org_id to all methods
- **AlignmentChecker**: Store goals per org+agent+session
- **SemanticClassifier**: Add org-scoped cache for custom tool mappings

**Acceptance Criteria:**
- All components accept org_id as parameter
- No global singleton instances
- Integration test: 2 orgs with same agent_id have separate state

#### Task 1.5: API Endpoint Updates
- Add org_id validation to all endpoints via dependency injection
- Validate agent ownership before operations
- Return 404 for cross-org access (not 403 to avoid enumeration)

**Acceptance Criteria:**
- All endpoints require org_id from JWT
- Cross-org access attempts return 404

#### Task 1.6: OPA Policy Org Context
- Add org_id to OPA input context
- Create org config structure for per-org policy overrides
- Enable org-specific policy rules

**Acceptance Criteria:**
- OPA policies receive org_id in input
- Test: Org A allows action, Org B blocks it

---

### Phase 2: Security Hardening

**Goal**: Enable production OPA policies, add rate limiting, concurrency locks.

#### Task 2.1: Enable Production OPA Policies
- Uncomment production rules in authorization.rego
- Add comprehensive policy tests
- Integrate org context from Phase 1

**Acceptance Criteria:**
- All OPA tests pass with production policies
- Testing mode disabled (no allow-all rules)

#### Task 2.2: Per-Org Rate Limiting
- Create in-memory sliding window rate limiter
- Add rate limit middleware to FastAPI
- Configure per-endpoint limits:
  - `/governance/authorize`: 1000/min
  - `/telemetry/events`: 5000/min
  - `/governance/approvals/request`: 100/min

**Acceptance Criteria:**
- Rate limits enforced per org (not global)
- 429 response includes retry-after header
- Org A at limit doesn't block Org B

#### Task 2.3: Concurrency Safety
- Add locks to approval response operations
- Add locks to state tracker updates

**Acceptance Criteria:**
- Concurrent approval responses don't cause double-approval
- No race conditions under concurrent load

#### Task 2.4: Exception Handling
- Create specific exception classes
- Configure FastAPI exception handlers
- Cross-org access returns 404 (not 403)

**Acceptance Criteria:**
- No bare `except Exception:` blocks
- All errors have specific exception types

---

### Phase 3: Production Hardening

**Goal**: Bounded caches, cleanup tasks, configurable timeouts, policy versioning.

#### Task 3.1: Bounded Caches
- Use LRU cache with size limits for semantic classifier
- Add cache monitoring/metrics

**Acceptance Criteria:**
- Cache size bounded to configurable limit
- Memory usage stable under load

#### Task 3.2: Background Cleanup Task
- Create cleanup task for stale conformance state
- Remove expired approvals

**Acceptance Criteria:**
- Cleanup runs periodically
- Stale state (>24h) removed

#### Task 3.3: Complete Semantic Type Coverage
- Add missing semantic types
- Expand tool classification patterns
- Add LLM fallback for unknown tools

**Acceptance Criteria:**
- All 21 semantic types have classification logic
- UNKNOWN rate `<5%` in production

#### Task 3.4: Configurable Timeouts
- Create centralized configuration
- Make all timeouts configurable via environment variables

**Acceptance Criteria:**
- All timeouts configurable via environment
- Default values match production requirements

#### Task 3.5: Policy Versioning
- Create policy version manager for per-org versioning
- Add API endpoints for version management
- Support rollback to previous versions

**Acceptance Criteria:**
- Policies versioned per org
- Rollback to previous version supported

---

### Phase 4: Testing Infrastructure

**Goal**: Comprehensive test suite with >80% coverage.

#### Task 4.1: Unit Test Suite
- Write unit tests for all components
- Achieve >80% code coverage

**Acceptance Criteria:**
- All components have unit tests
- Code coverage >80%

#### Task 4.2: Multi-Tenancy Isolation Tests
- Create concurrent org request tests
- Test data isolation across all components

**Acceptance Criteria:**
- 10 orgs concurrent test passes
- All component isolation verified

#### Task 4.3: Integration Tests for Governance Flow
- Test full verdict paths (ALLOW, DENY_ACTION, REQUIRE_APPROVAL, TERMINATE_AGENT, CONSTRAIN)
- Test HITL workflow end-to-end

**Acceptance Criteria:**
- All 5 governance decision paths tested
- HITL workflow tested

#### Task 4.4: Performance Benchmark Tests
- Create load tests
- Test p95 latency under load

**Acceptance Criteria:**
- p95 latency `<200ms`
- Throughput >500 req/s across 100 orgs

---

### Phase 5: Adaptation Implementation

**Objective:** Complete the Trust Lifecycle feedback loop with dynamic trust adjustment.

#### Task 5.1: Trust Score Calculation Engine
- Implement trust score formula: (0.4 × AIVSS) + (0.35 × Behavioral) + (0.25 × Alignment)
- Create PostgreSQL time-series storage for score history
- Build calculation triggers (per-session and batch)
- API endpoints: `GET /trust-score/{agent_id}`, `GET /trust-score/{agent_id}/history`
- **Depends on:** Phase 1 (AIVSS), Phase 2 (Behavioral), Phase 3 (Goal Alignment)

**Acceptance Criteria:**
```
Given: An agent with baseline AIVSS score, behavioral compliance rate, and alignment score
When: Trust score calculation engine evaluates
Then: Score = (0.4 × AIVSS) + (0.35 × behavioral) + (0.25 × alignment)
And: Result persisted to PostgreSQL time-series table
```

#### Task 5.2: Dynamic Trust Tier Adjustment
- Implement automatic tier promotion rules (sustained high scores >90 for 7 days)
- Implement automatic tier demotion rules (score drops below tier threshold)
- Create tier change notification system
- Add tier change audit logging (agent_id, old_tier, new_tier, reason, timestamp)
- **Depends on:** Task 5.1

**Acceptance Criteria:**
```
Given: An agent with Trust Score dropping below tier threshold
When: Tier adjustment rules evaluate
Then: Agent is automatically demoted with audit trail
And: Organization admins notified of tier change
```

#### Task 5.3: Violation Pattern Detection
- Build violation aggregation service (group by agent, semantic type, time window)
- Implement pattern detection algorithm (frequency >3 in 7 days, severity weighting)
- Create pattern visualization for UI (table view with action count, last occurrence)
- Store detected patterns in policy_suggestions table
- **Depends on:** Phase 2 (Behavioral), Phase 3 (Goal Alignment)

**Acceptance Criteria:**
```
Given: Multiple similar violations across sessions (e.g., PII access without approval)
When: Pattern detection runs (daily batch or triggered by threshold)
Then: Pattern aggregated with frequency/severity metrics
And: Stored for policy suggestion generation
```

#### Task 5.4: Policy Suggestion Generator
- AI-assisted policy recommendation engine (LLM-generated from patterns)
- Confidence scoring for suggestions (0.0-1.0, based on frequency and severity)
- Integration with OPA policy format (exportable as Rego)
- HITL review workflow for suggestions (pending → approved → applied)
- **Depends on:** Task 5.3

**Acceptance Criteria:**
```
Given: A violation pattern with 5+ occurrences
When: Policy suggestion generator evaluates
Then: Suggested behavioral rule or OPA policy generated with confidence score
And: Suggestion queued for admin review in HITL workflow
```

#### Task 5.5: Feedback Loop to Phase 1 (AIVSS)
- Trust history influences initial assessment for similar agents (organization-wide baseline learning)
- Learning system for AIVSS question weights (agents with similar profiles benchmarked)
- Organization-wide trust baseline calculation (context for tier assignment)
- **Depends on:** Tasks 5.1-5.4

**Acceptance Criteria:**
```
Given: Historical trust data from 100+ agents over 90 days
When: Baseline learning algorithm runs
Then: AIVSS question weights adjusted to better predict Trust Tier
And: Org-wide trust distribution metrics available for context
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database migration breaks existing AGE | High | Phased rollout with data migration script |
| Auth0 JWT validation adds latency | Medium | Cache JWKS, benchmark validation |
| Breaking SDK changes | High | Maintain backward compatibility |
| OPA policy migration breaks customers | High | Policy versioning with canary deployment |
| Cross-org data leak | Critical | Comprehensive isolation tests, security audit |
| Phase 5 Complexity: Adaptation engine requires ML components for pattern detection | High | Phased rollout: manual suggestions first (Task 5.4), then AI-assisted (v1.2+) |

---

## PRD Story Dependencies

This AGE Production Readiness plan unblocks the following PRD v1.1 user stories:

| PRD Story | Description | AGE Phase |
|-----------|-------------|-----------|
| S5.1 | AIVSS Configuration | Phase 1 |
| S5.3 | Risk-Based Policy | Phase 1 |
| S6.1 | Behavioral Conformance | Phase 1 |
| S6.3 | Goal Alignment | Phase 1 |
| S6.4 | Semantic Classification | Phase 1, 3 |
| S7.2 | HITL Approval | Phase 1, 2 |
| S7.3 | Approval Queue UI | Phase 1 |
| S8.1 | Trust Score Dashboard | Phase 5 |
| S8.2 | Dynamic Trust Tier Adjustment | Phase 5 |
| S8.3 | Violation Pattern Detection | Phase 5 |
| S8.4 | Policy Suggestion Engine | Phase 5 |
| S8.5 | Trust Recovery Workflow | Phase 5 |

**Critical Path**: Without Phase 1 completion, **none** of the v1.1 features can operate in multi-tenant production. Phase 5 requires completion of Phases 1-4 for feedback loop closure.

---

## Summary

### Production Blockers

| Gap | Phase | Priority |
|-----|-------|----------|
| No org_id concept | Phase 1 | CRITICAL |
| Database isolation | Phase 1 | CRITICAL |
| Global singleton ApprovalStore | Phase 1 | CRITICAL |
| OPA in testing mode | Phase 2 | CRITICAL |
| No rate limiting | Phase 2 | CRITICAL |
| No test suite | Phase 4 | CRITICAL |

### Estimated Effort

| Phase | Focus | Effort |
|-------|-------|--------|
| Phase 1 | Multi-Tenancy Foundation | 2 weeks |
| Phase 2 | Security Hardening | 1.5 weeks |
| Phase 3 | Production Hardening | 1 week |
| Phase 4 | Testing Infrastructure | 1.5 weeks |
| Phase 5 | Adaptation Implementation | 2-3 weeks |
| **Total** | | **9-10 weeks** |

**Phase 5 Note:** Effort varies based on LLM integration approach. Manual policy suggestions (MVP) = 2 weeks; AI-assisted suggestions with pattern learning = 3 weeks. Recommend phased rollout: Ship MVP in v1.1, AI components in v1.2.
