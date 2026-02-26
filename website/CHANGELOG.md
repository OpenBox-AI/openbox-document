# Changelog

All notable changes to this documentation site are recorded in this file.

## 2026-02-13

### Changed

- Aligned risk scoring and tier documentation to percentage-based **Risk Profile Score (0-100)** language across trust and lifecycle docs.
- Updated trust/risk tier tables to a 4-tier model:
  - Tier 1: 0%-24%
  - Tier 2: 25%-49%
  - Tier 3: 50%-74%
  - Tier 4: 75%-100%
- Updated Trust Scores examples to reflect UI-style calculation output (including Risk Profile contribution).
- Refreshed dashboard and agents docs to reflect updated trust tier ranges and labels.
- Updated Authorize defaults table to remove deprecated "Untrusted" row.

### Added

- Added **n8n** and **LangChain** as workflow engine options marked **Coming soon** in agent registration docs.
- Added detailed **Event Detail Modal** documentation for Organization Audit Log, including:
  - Event Overview
  - Request Details (method/path, request body, response)
  - Technical Information (Event ID, Organization ID, Actor ID)

### Compliance Documentation Refresh

- Rewrote **Attestation** documentation as **Attestation & Cryptographic Proof** with:
  - AWS KMS and External Attestation provider model
  - SHA-256 Merkle pipeline
  - Proof certificate fields
  - Viewing flow from Agent Detail
- Rewrote **Compliance** landing page as **Compliance & Audit** with:
  - Immutable audit trail coverage
  - Organization audit log structure and filters
  - On-demand export flow and formats
  - Compliance best practices
- Reworked **Organization Audit Log** page to match current UI:
  - Search + event-type + time-range controls
  - Table column definitions (Timestamp, Event Type, Actor, Action, Result, Details)
  - Export flow via Export Log button

### Removed

- Removed stale references to normalized/baseline Risk Profile wording in score/tier docs.
- Removed obsolete tier definitions (Tier 5 / Untrusted) from pages now aligned to the 4-tier model.
- Removed references to deprecated approval-workflows navigation in related docs and pointers.
