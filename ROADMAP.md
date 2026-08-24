# SotuRail Roadmap

This roadmap is dependency-ordered future work. Current v1.5 contracts live in `docs/reference/` and `docs/architecture/`; release history lives in `CHANGELOG.md` and `docs/releases/`. Operational status and acceptance criteria live in the [Verified Control Plane Implementation Tracker](docs/roadmap/verified-control-plane-implementation-tracker.md).

SotuRail stays a local-first engineering control plane. It governs readiness and verified context without replacing the coding model/runtime, OS sandbox, or third-party provider.

## Milestone A — Integrity / Foundation (v1.5 baseline, migration follow-up v1.6)

Delivered baseline: WorkspaceGuard, Artifact Envelope/Registry/Store, workspace fingerprints, atomic storage, JSONL tail recovery, MCP hardening, raw lifecycle, evidence freshness, knowledge cleanup, and Run Manifest.

Next dependency: a general N-1 migration engine with dry run, backup, schema validation, atomic replacement, and rollback.

## Milestone B — Governance Foundation (v1.5 baseline, adapters v1.6)

Delivered baseline: Capability Registry and security metadata, Capability Epochs, `GovernanceProvider`, offline `NativeMinimal`, fail-closed AGT/ACS boundary, Dual Gate, and exact-digest Execution Envelope.

Next dependency: implement AGT/ACS only after a pinned upstream API/license decision and provider conformance fixtures. Add capability-lease expiry and lifecycle receipts without treating metadata as a sandbox.

## Milestone C — Contracts / Verification (v1.5–v1.6)

Delivered baseline: workspace-bound Change Contract, risk/fidelity/evidence fields, readiness verdict, and Dual Gate integration.

Next: Decision Graph, deterministic risk classifier, evidence-policy engine, spec-fidelity/anti-cheat checks, Evidence Receipts, and phase-specific Artifact Handoffs. Readiness may consume only current, relevant evidence.

## Milestone D — Context Foundation (v1.5–v1.7)

Delivered baseline: shared context artifact metadata, workspace fingerprint, hard budget, explicit overflow/degradation, and stable-before-dynamic ordering.

Next: Context Spine and escalation policy, DependencyDocsProvider with version/source provenance, ContextTransformProvider with loss classes, and OKF interchange. Each depends on artifact lineage and freshness.

## Milestone E — Structural Intelligence (v1.7+)

Define `StructuralProvider`, symbol identity, structural freshness, impact analysis, doctor, and hybrid retrieval. Preserve NativeLite/offline fallback before optional codebase-memory or code-review-graph adapters. Graphify, CodeGraph, Memtrace, and code-graph-rag remain provider/benchmark candidates.

## Milestone F — Knowledge / Outcomes (v1.6+)

Add knowledge drift propagation and re-attestation after the migration foundation. Then add Evidence Receipts, Outcome Ledger, temporal project brain, and co-change signals. Outcomes remain observed/accepted records, not self-awarded model scores.

## Milestone G — Runtime / Orchestration (later)

Define a runtime-neutral `RuntimeProvider`, session coordination, policy-aware concurrency, candidate evaluation, attempt budget, and loop detection before any optional Conductor. A daemon or orchestration runtime is not required for the CLI control plane.

## Later / optional

- `VectorIndexProvider` after a reproducible turbovec benchmark.
- IntegrationBroker/Nango after credential and provider-boundary design.
- Tauri Run/Governance Console only as a client of stable contracts.
- Media, browser, and external enrichers as narrow opt-in providers.
- SQLite/FTS5 as a rebuildable local index, never the sole source of truth.

Full Conductor, desktop runtime, multi-agent runtime, full temporal graph, OAuth platform, marketplace, browser automation framework, video pipeline, and all-language adapters are deliberately outside the near-term core.
