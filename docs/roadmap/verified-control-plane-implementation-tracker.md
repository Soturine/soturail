# Verified Control Plane Implementation Tracker

Operational source of truth for work after `v1.4.0`. Update code, tests and docs before changing an item to implemented.

## Legend

- `[ ]` not started
- `[~]` partial
- `[x]` implemented and covered by code, tests and docs
- `[!]` blocked
- `[>]` deliberately deferred

## Release / Milestone Matrix

| ID | Feature | Target | Status | Code | Tests | Docs | Dependencies / acceptance |
|---|---|---:|:---:|---|---|---|---|
| FND-001 | WorkspaceGuard | 1.5.0 | [~] | planned `src/core/workspace-guard.ts` | adversarial suite pending | audit only | Canonical and real paths remain inside allowed root; Windows and symlinks covered. |
| FND-002 | ArtifactRegistry / WorkspacePaths | 1.5.0 | [~] | existing `config.ts`; canonical expansion pending | pending | audit only | Canonical paths for artifacts, migrations, receipts, capabilities and outcomes. |
| FND-003 | ArtifactStore / recovery | 1.5.0 | [~] | shared direct writers exist; replacement pending | pending | audit only | Validated atomic JSON writes and recoverable coordinated JSONL. |
| FND-004 | ArtifactEnvelope | 1.5.0 | [ ] | pending | pending | pending | Discriminated envelope with producer, fingerprint, lineage and freshness. |
| FND-005 | WorkspaceFingerprint | 1.5.0 | [ ] | pending | pending | pending | Reproducible identity, HEAD, dirty digest, lock/config/toolchain digests; no secrets. |
| FND-006 | Migration framework | 1.6.0 | [>] | boundary in 1.5.0 | compatibility test pending | roadmap pending | N-1 dry-run, backup, validate, atomic replace and rollback. |
| INT-001 | Modern typed MCP | 1.5.0 | [~] | legacy manual server confirmed | pending | audit only | Official SDK v2, stable `2026-07-28`, small surface, typed schemas, compatibility test. |
| INT-002 | Raw lifecycle and policy | 1.5.0 | [~] | raw store exists; caller bypass confirmed | pending | audit only | No self-authorization; sensitivity/redaction/fingerprint/retention metadata and doctor/status. |
| INT-003 | Evidence workspace binding | 1.5.0 | [ ] | pending | pending | pending | One-byte workspace change makes old verified evidence stale. |
| INT-004 | Knowledge collision/cleanup | 1.5.0 | [~] | compiler exists; collision/residue confirmed | pending | audit only | Stable unique topic IDs and no stale generated source topics. |
| INT-005 | Local SQLite/FTS index | 1.7.0 | [>] | JSON index remains canonical | pending | roadmap pending | Rebuildable cache only; deletion never destroys truth. |
| RUN-001 | Run Manifest | 1.5.0 | [~] | run workspace v1 exists | pending | pending | Manifest records known facts and explicit UNKNOWN/UNAVAILABLE states. |
| CAP-001 | Capability Registry | 1.5.0 | [ ] | pending | pending | pending | Canonical CLI/MCP/permission/output metadata and `capabilities tools`. |
| CAP-002 | Capability security / epochs | 1.5.0 | [ ] | pending | pending | pending | Phase-scoped epoch plus side-effect/approval metadata; metadata is not a sandbox. |
| GOV-001 | GovernanceProvider / NativeMinimal | 1.5.0 | [ ] | pending | pending | pending | Offline deterministic provider with validate, health and capabilities. |
| GOV-002 | AGT/ACS provider | 1.6.0 | [>] | interface boundary in 1.5.0 | contract test pending | upstream audit pending | No mandatory Microsoft dependency; implement only against verified upstream API/license. |
| GOV-003 | Dual Gate | 1.5.0 | [ ] | pending | pending | pending | All authority/readiness combinations fail closed unless both pass. |
| GOV-004 | Execution Envelope | 1.5.0 | [ ] | pending | pending | pending | Evaluated digest equals executed digest; mismatch is denied/not attested. |
| CON-001 | Change Contract / readiness | 1.5.0 | [ ] | pending | pending | pending | Risk, fidelity, evidence policy and blockers are distinct deterministic fields. |
| CTX-001 | Context Artifact / hard budget | 1.5.0 | [ ] | pending | pending | pending | Hard token/byte budget, fingerprint and explicit overflow/degradation. |
| STR-001 | StructuralProvider NativeLite | 1.7.0 | [>] | heuristic index exists | provider tests pending | roadmap pending | Provider contract, symbol identity, freshness, impact and doctor. |
| KNW-001 | Knowledge drift / re-attestation | 1.6.0 | [>] | hash verification exists | rename/delete in 1.5.0 | roadmap pending | Drift propagates without silent trust. |
| VER-001 | Evidence Receipts | 1.6.0 | [>] | evidence foundation in 1.5.0 | pending | roadmap pending | Receipt links contract, envelope, verdict, checks and outcome. |
| OUT-001 | Outcome Ledger | 1.7.0 | [>] | pending | pending | roadmap pending | Append-only accepted/rejected outcome tracking with provenance. |
| RUN-002 | RuntimeProvider / Conductor | Later | [>] | pending | pending | roadmap pending | Optional approval-gated coordination; never mandatory agent runtime. |

## Foundation

The v1.5.0 foundation is deterministic and local-first. Human-readable files remain canonical; optional indexes and providers must be rebuildable or replaceable.

## Integrity

No caller-controlled path or raw-log argument may grant itself authority. Freshness must bind evidence and artifacts to the actual workspace state.

## Governance

Authority answers whether an actor may act. Readiness answers whether engineering evidence is sufficient. Both must pass, and neither metadata nor a verdict is a sandbox.

## Contracts

Generated, reviewed, deterministically verified, runtime-observed and human-approved states remain distinct.

## Context

Context retrieval follows a hard budget and escalation policy. Truncation, transformation and stale state must be visible.

## Structural Intelligence

External graphs and code-memory systems remain provider candidates. NativeLite is the future offline fallback, not a claim that the current heuristic index is a semantic graph.

## Knowledge

Knowledge stays source-backed. Source hashes, workspace fingerprints and re-attestation prevent compiled summaries from becoming silent ground truth.

## Verification

Evidence records what ran and what was observed. It never upgrades missing proof to verification.

## Runtime

Claude, Codex, MiMoCode and other hosts are executors/providers. SotuRail governs context, contracts, readiness and evidence without replacing them.

## Future

SQLite/FTS, structural adapters, vector indexes, AGT/ACS integration, temporal brain, Conductor, Tauri and integration brokers remain dependency-ordered work, not v1.5.0 marketing claims.
