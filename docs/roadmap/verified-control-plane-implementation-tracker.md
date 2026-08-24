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
| FND-001 | WorkspaceGuard | 1.5.0 | [x] | `src/core/workspace-guard.ts`; guarded read/MCP/knowledge/raw | `tests/workspace-integrity.test.ts` | artifact model; threat model | Canonical and real paths remain inside allowed root; traversal, absolute, Windows and symlinks covered. |
| FND-002 | ArtifactRegistry / WorkspacePaths | 1.5.0 | [x] | `artifact-registry.ts`; `config.ts` delegates canonical paths | workspace integrity | artifact model | Canonical paths cover artifacts, migrations, receipts, capabilities, outcomes and canonical `evals/`. |
| FND-003 | ArtifactStore / recovery | 1.5.0 | [x] | `artifact-store.ts`; critical writers delegated | workspace integrity | artifact model | Atomic JSON and concurrent-safe/recoverable JSONL tail behavior pass. |
| FND-004 | ArtifactEnvelope | 1.5.0 | [x] | `artifact-envelope.ts`; evidence integration | evidence/knowledge integrity | artifact model | Producer, fingerprint, lineage, freshness, dependencies, supersedes and digest are schema-bound. |
| FND-005 | WorkspaceFingerprint | 1.5.0 | [x] | `workspace-fingerprint.ts` | workspace + evidence integrity | artifact model | Repository, HEAD, dirty, lock/config/toolchain digests are reproducible and secret-free. |
| FND-006 | Migration framework | 1.6.0 | [>] | schema boundaries only | compatibility fixtures retained | artifact model; roadmap | Requires N-1 dry-run, backup, validation, atomic replace and rollback. |
| INT-001 | Modern typed MCP | 1.5.0 | [x] | official SDK v2 server and zod schemas | `tests/mcp-integrity.test.ts`; smoke | control-plane; security | Stable `2026-07-28` path plus tested legacy negotiation, small mapped surface. |
| INT-002 | Raw lifecycle and policy | 1.5.0 | [x] | raw store/lifecycle/CLI; MCP bypass removed | MCP + workspace integrity | security model; threat model | Redaction, sensitivity, fingerprint, retention, status/inspect/doctor/purge; no self-authorization. |
| INT-003 | Evidence workspace binding | 1.5.0 | [x] | `evidence-provenance.ts` | evidence/knowledge integrity | artifact model; contracts | One-byte workspace change makes prior verified evidence stale. |
| INT-004 | Knowledge collision/cleanup | 1.5.0 | [x] | `knowledge-rail.ts` guarded hashed topic IDs and cleanup | evidence/knowledge integrity | artifact model | Slug collisions remain unique; renamed/deleted source residue is removed. |
| INT-005 | Local SQLite/FTS index | 1.7.0 | [>] | JSON index remains canonical | future provider/index tests | roadmap | Rebuildable cache only; deletion never destroys truth. |
| RUN-001 | Run Manifest | 1.5.0 | [x] | `run-manifest.ts`; `run-workspace.ts` | governance contracts | control-plane | Manifest records workspace, epoch, inputs and explicit UNKNOWN/UNAVAILABLE states. |
| CAP-001 | Capability Registry | 1.5.0 | [x] | `capability-registry.ts`; CLI + MCP mapping | governance + MCP contracts | control-plane | Canonical maturity, CLI/MCP, permission, side-effect and output metadata; `capabilities tools`. |
| CAP-002 | Capability security / epochs | 1.5.0 | [x] | phase-scoped registry digest/epoch | governance contracts | control-plane; governance | Side-effect/approval/security metadata is real and explicitly not a sandbox. |
| GOV-001 | GovernanceProvider / NativeMinimal | 1.5.0 | [x] | `governance.ts`; governance CLI | governance contracts | governance model | Offline provider implements evaluate, validate, health and capabilities and fails closed. |
| GOV-002 | AGT/ACS provider | 1.6.0 | [>] | fail-closed `AgtAcsGovernanceProvider` boundary | unavailable verdict contract | provider + governance docs | No mandatory Microsoft dependency; integrate only against verified upstream API/license. |
| GOV-003 | Dual Gate | 1.5.0 | [x] | `evaluateDualGate` | all allow/deny/not-ready combinations | governance + contracts | Only authority `allow` plus readiness `ready` permits progression. |
| GOV-004 | Execution Envelope | 1.5.0 | [x] | `execution-envelope.ts` | exact and mismatched digest cases | governance + contracts | Executed payload must equal evaluated digest; mismatch is `NOT_ATTESTED`. |
| CON-001 | Change Contract / readiness | 1.5.0 | [x] | `change-contract.ts`; contract CLI | governance contracts | contracts and verification | Risk, fidelity, evidence policy, checks and blockers are distinct deterministic fields. |
| CTX-001 | Context Artifact / hard budget | 1.5.0 | [x] | `context-artifact.ts`; `context-pack.ts` | governance contracts + existing context suites | context architecture | Byte/token budget, fingerprint, truncation and degradation are explicit and enforced. |
| STR-001 | StructuralProvider NativeLite | 1.7.0 | [>] | heuristic index exists | provider tests pending | roadmap pending | Provider contract, symbol identity, freshness, impact and doctor. |
| KNW-001 | Knowledge drift / re-attestation | 1.6.0 | [~] | fingerprint/hash freshness and cleanup shipped | one-byte/rename/delete pass | artifact/context docs | Full dependency propagation and explicit re-attestation remain. |
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
