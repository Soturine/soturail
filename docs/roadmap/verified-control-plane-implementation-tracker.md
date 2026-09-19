# Verified Control Plane Implementation Tracker

Operational source of truth for work after `v1.4.0`. Update code, tests and docs before changing an item to implemented.

## Legend

- `[ ]` not started
- `[~]` partial
- `[x]` implemented and covered by code, tests and docs
- `[!]` blocked
- `[>]` deliberately deferred / planned

## Release / Milestone Matrix

| ID | Feature | Target | Status | Code | Tests | Docs | Dependencies / acceptance |
|---|---|---:|:---:|---|---|---|---|
| FND-001 | WorkspaceGuard | 1.5.0 | [x] | `src/core/workspace-guard.ts`; guarded read/MCP/knowledge/raw | workspace integrity | artifact model; threat model | Canonical and real paths remain inside allowed root; traversal, absolute, Windows and symlinks covered. |
| FND-002 | ArtifactRegistry / WorkspacePaths | 1.5.0 | [x] | `artifact-registry.ts`; config delegates canonical paths | workspace integrity | artifact model | Canonical paths cover artifacts, migrations, receipts, capabilities, outcomes and canonical `evals/`. |
| FND-003 | ArtifactStore / recovery | 1.5.0 | [x] | `artifact-store.ts`; critical writers delegated | workspace integrity | artifact model | Atomic JSON and concurrent-safe/recoverable JSONL tail behavior pass. |
| FND-004 | ArtifactEnvelope | 1.5.0 | [x] | `artifact-envelope.ts`; evidence integration | evidence/knowledge integrity | artifact model | Producer, fingerprint, lineage, freshness, dependencies, supersedes and digest are schema-bound. |
| FND-005 | WorkspaceFingerprint | 1.5.0 | [x] | `workspace-fingerprint.ts` | workspace + evidence integrity | artifact model | Repository, HEAD, dirty, lock/config/toolchain digests are reproducible and secret-free. |
| FND-006 | Migration framework | 1.6.x | [>] | schema boundaries only | compatibility fixtures retained | artifact model; roadmap | N-1 dry-run, backup, validation, atomic replace and rollback. Independent P1; must not block agent-native P0. |
| INT-001 | Modern typed MCP | 1.5.0 | [x] | official SDK v2 server and zod schemas | MCP integrity + smoke | control-plane; security | Stable modern path plus tested legacy negotiation, small mapped surface. |
| INT-002 | Raw lifecycle and policy | 1.5.0 | [x] | raw store/lifecycle/CLI; MCP bypass removed | MCP + workspace integrity | security model; threat model | Redaction, sensitivity, fingerprint, retention, status/inspect/doctor/purge; no self-authorization. |
| INT-003 | Evidence workspace binding | 1.5.0 | [x] | `evidence-provenance.ts` | evidence/knowledge integrity | artifact model; contracts | One-byte workspace change makes prior verified evidence stale. |
| INT-004 | Knowledge collision/cleanup | 1.5.0 | [x] | guarded hashed topic IDs and cleanup | evidence/knowledge integrity | artifact model | Slug collisions remain unique; renamed/deleted source residue is removed. |
| RUN-001 | Run Manifest | 1.5.0 | [x] | `run-manifest.ts`; `run-workspace.ts` | governance contracts | control-plane | Manifest records workspace, epoch, inputs and explicit UNKNOWN/UNAVAILABLE states. |
| CAP-001 | Capability Registry v1 | 1.5.0 | [x] | `capability-registry.ts`; CLI + MCP mapping | governance + MCP contracts | control-plane | Canonical maturity, CLI/MCP, permission, side-effect and output metadata. |
| CAP-003 | Capability Descriptor v2 | 1.6.0 | [>] | pending | descriptor schema + compatibility fixtures | agent-native architecture | Adds stable semantic keys, Skill surface, provider class, trust/freshness and locale-neutral metadata without breaking v1 consumers. |
| CAP-004 | Capability-to-Skill binding | 1.6.0 | [>] | pending | skill/capability conformance fixtures | skill + agent-native architecture | One canonical capability may project to Skill/MCP/CLI/artifact surfaces without duplicate business logic. |
| CAP-002 | Capability security / epochs | 1.5.0 | [x] | phase-scoped registry digest/epoch | governance contracts | control-plane; governance | Side-effect/approval/security metadata is real and explicitly not a sandbox. |
| GOV-001 | GovernanceProvider / NativeMinimal | 1.5.0 | [x] | `governance.ts`; governance CLI | governance contracts | governance model | Offline provider evaluates/validates/health/capabilities and fails closed. |
| GOV-002 | AGT/ACS provider | 1.7+ | [>] | fail-closed boundary only | unavailable verdict contract | provider + governance docs | Optional integration after pinned API/license and conformance fixtures; not required for v1.6. |
| GOV-003 | Dual Gate | 1.5.0 | [x] | `evaluateDualGate` | allow/deny/not-ready combinations | governance + contracts | Only authority `allow` plus readiness `ready` permits progression. |
| GOV-004 | Execution Envelope | 1.5.0 | [x] | `execution-envelope.ts` | exact and mismatched digest cases | governance + contracts | Executed payload must equal evaluated digest; mismatch is NOT_ATTESTED. |
| CON-001 | Change Contract / readiness | 1.5.0 | [x] | `change-contract.ts`; contract CLI | governance contracts | contracts and verification | Risk, fidelity, evidence policy, checks and blockers are distinct deterministic fields. |
| CON-002 | Decision Graph | 1.6.x | [>] | pending | fact/decision/unknown fixtures | roadmap | Separate discovered facts from human decisions and unresolved questions. |
| CTX-001 | Context Artifact / hard budget | 1.5.0 | [x] | `context-artifact.ts`; `context-pack.ts` | governance/context suites | context architecture | Byte/token budget, fingerprint, truncation and degradation are explicit and enforced. |
| CTX-002 | Context Spine / agent escalation | 1.6.x | [>] | pending | task/context quality fixtures | context architecture | Stable compact prefix plus agent-led escalation; source/provenance remain explicit. |
| SKL-001 | Portable SotuRail Core Skill | 1.6.0 | [>] | pending | trigger/non-trigger + progressive disclosure | Skill Rail; agent-native architecture | Small `SKILL.md` teaches discover -> select -> act -> verify. |
| SKL-002 | Task Skill set | 1.6.0 | [>] | pending | change/debug/review/security/research/knowledge/release fixtures | Skill Rail | Start with a small measured catalog; avoid always-loaded skill bloat. |
| SKL-003 | Host Skill adapters + generic fallback | 1.6.0 | [>] | pending | verified host layout/export fixtures | host compatibility; Skill Rail | Canonical skill projects to verified host-native layouts; unsupported hosts use generic portable fallback. |
| SKL-004 | Agent-led routing | 1.6.0 | [>] | v1.5 keyword fallback exists | multilingual routing/eval | Skill Rail | Agent selection from skill metadata becomes primary; keyword scoring remains fallback/diagnostic only. |
| SEM-001 | Semantic Worker contract | 1.6.0 | [>] | pending | structured candidate fixtures | agent-native architecture | Agent receives task/capabilities/constraints/schemas and returns candidate claims/impact/decisions/questions. |
| SEM-002 | Candidate/verified boundary | 1.6.0 | [>] | trust-state model exists | adversarial/self-award fixtures | contracts/evidence | Model/provider output cannot self-promote to verified/current/approved/ready. |
| I18N-001 | Language-neutral machine semantics | 1.6.0 | [>] | partial via stable IDs | pt-BR/en/es/ja + mixed fixtures | agent-native architecture | IDs/enums/schemas are locale-independent; no English keyword authority. |
| I18N-002 | Preserve-source locale metadata | 1.6.0 | [>] | pending | Unicode/source-preservation fixtures | artifact/context docs | Original source remains evidence; translations are derived views; Unicode paths supported. |
| STR-001 | StructuralProvider NativeLite | 1.7+ | [>] | heuristic index exists | provider tests pending | roadmap | Objective symbol/freshness/impact facts; do not evolve into a stack/language-specific semantic-rule engine. |
| INT-005 | Local SQLite/FTS index | 1.7+ | [>] | JSON index remains canonical | provider/index tests | roadmap | Rebuildable cache only; deletion never destroys truth. |
| KNW-001 | Knowledge drift / re-attestation | 1.6.x | [~] | fingerprint/hash freshness and cleanup shipped | one-byte/rename/delete pass | artifact/context docs | Full dependency propagation and explicit re-attestation remain. |
| VER-001 | Evidence Receipts | 1.6.x | [>] | evidence foundation in 1.5.0 | pending | roadmap | Receipt links contract, envelope, verdict, checks and outcome. |
| OUT-001 | Outcome Ledger | 1.7+ | [>] | pending | pending | roadmap | Append-only accepted/rejected outcome tracking with provenance. |
| RUN-002 | RuntimeProvider / Conductor | Later | [>] | pending | pending | roadmap | Optional approval-gated coordination; never required for the agent-native Skill surface. |

## Foundation

The v1.5 foundation remains deterministic and local-first. Human-readable artifacts stay canonical where appropriate; optional indexes/providers must be rebuildable or replaceable.

## Agent-native semantics

v1.6 moves natural-language meaning to the capable agent instead of expanding hardcoded semantic heuristics. SotuRail supplies Skills, capability contracts, source context and output schemas, then verifies objective claims through evidence.

## Integrity

No caller-controlled path, skill instruction, provider output or raw-log argument may grant itself authority. Freshness binds evidence/artifacts to actual workspace state.

## Governance

Authority answers whether an actor may act. Readiness answers whether engineering evidence is sufficient. Both must pass. Skill metadata, provider output and model confidence are not a sandbox or approval.

## Context

Context remains budgeted and source-backed. Agent-led selection may choose candidates, but truncation, transformation, provider use and stale state must be visible.

## Structural intelligence

External graph/code-memory systems remain provider candidates. Syntax/structure facts can be deterministic. Business/project meaning belongs to the Semantic Worker unless backed by an explicit machine-readable source.

## Knowledge

Knowledge stays source-backed. Preserve original source language; translated/localized text is derived. Re-attestation prevents compiled summaries from becoming silent ground truth.

## Verification

Evidence records what ran and what was observed. A model saying "verified" does not make it verified.

## Runtime

Claude, Codex, Cursor, Gemini, Kimi-compatible/generic agents and future hosts are semantic/execution workers. SotuRail exposes portable capabilities without replacing them.

## Research traceability

External projects, standards, benchmarks and skill/runtime/provider inspirations are cataloged in [2026 External Research Master Index](../ecosystem/2026-external-research-master-index.md).
