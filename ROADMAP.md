# SotuRail Roadmap

This roadmap is dependency-ordered future work. Current v1.5 contracts live in `docs/reference/` and `docs/architecture/`; release history lives in `CHANGELOG.md` and `docs/releases/`. Operational status and acceptance criteria live in the [Verified Control Plane Implementation Tracker](docs/roadmap/verified-control-plane-implementation-tracker.md).

SotuRail stays a local-first engineering control plane. The v1.6 direction makes it agent-native and language-neutral: AI agents perform natural-language interpretation and semantic work through portable skills, while SotuRail owns capability contracts, provenance, freshness, policy, evidence and readiness.

The governing rule is:

```text
AI understands.
SotuRail organizes, constrains and proves.
```

See [Agent-Native Semantic Architecture](docs/architecture/agent-native-semantic-architecture.md).

## Architectural priority

Do not hardcode semantic intelligence that a capable agent can perform better across languages, stacks and domains. Do not delegate objective proof that deterministic systems can establish better.

Therefore:

- natural-language intent, requirement interpretation, semantic classification, ambiguity handling and synthesis belong primarily to the agent/semantic worker;
- Git state, paths, hashes, schemas, test results, exit codes, permissions, provenance, freshness and gate enforcement remain deterministic;
- parsers such as AST/LSP/Tree-sitter remain useful for objective program structure, not as a universal replacement for semantic reasoning;
- keyword matching, English-specific text heuristics and stack-specific rule lists may exist only as bounded fallback/diagnostic mechanisms, never as the authoritative semantic layer;
- CLI remains important for humans, CI, administration, diagnostics and deterministic fallback, but agents should primarily discover SotuRail through Skills, MCP, structured artifacts and capability discovery.

## Milestone A — Integrity / Foundation (v1.5 baseline, migration follow-up)

Delivered baseline: WorkspaceGuard, Artifact Envelope/Registry/Store, workspace fingerprints, atomic storage, JSONL tail recovery, MCP hardening, raw lifecycle, evidence freshness, knowledge cleanup, and Run Manifest.

Follow-up: a general N-1 migration engine with dry run, backup, schema validation, atomic replacement and rollback. This remains important, but must not block the v1.6 agent-native surface if it can be implemented independently.

## Milestone B — Governance Foundation (v1.5 baseline)

Delivered baseline: Capability Registry and security metadata, Capability Epochs, `GovernanceProvider`, offline `NativeMinimal`, fail-closed AGT/ACS boundary, Dual Gate, and exact-digest Execution Envelope.

AGT/ACS remains an optional provider integration after a pinned upstream API/license decision and conformance fixtures. It is not required for the v1.6 core.

## Milestone C — Verified Change Lifecycle (v1.5–v1.6)

Delivered baseline: workspace-bound Change Contract, risk/fidelity/evidence fields, readiness verdict and Dual Gate integration.

Next:

- Decision Graph for explicit facts, decisions, assumptions and unresolved questions;
- evidence-policy engine;
- Evidence Receipts;
- spec-fidelity / anti-cheat checks;
- phase-specific Artifact Handoffs;
- knowledge drift propagation and re-attestation.

The agent may propose candidates, interpretations and decisions. Only source-backed, current evidence may satisfy readiness.

## Milestone D — Agent Skill & Semantic Surface (v1.6 primary)

v1.6 makes SotuRail self-describing and directly usable by coding agents.

Deliver:

- a portable SotuRail Core Skill using the open `SKILL.md` pattern and progressive disclosure;
- a small set of task-oriented skills such as change, debug, review, security, research, knowledge and release;
- Capability Descriptor v2 as the canonical source for purpose, inputs, outputs, permissions, evidence, freshness, providers and available surfaces;
- capability-to-skill binding so one capability can be consumed through Skill, MCP, CLI, SDK/context artifacts without duplicate implementations;
- Semantic Worker contracts for Claude, Codex, Cursor, Gemini, Kimi-compatible/generic agents and future hosts;
- host adapters that project canonical skills into verified host-native formats, with generic fallback when native support is unknown;
- agent-led skill selection from concise name/description metadata instead of English keyword routing as the primary mechanism;
- structured candidate outputs for claims, impact, decisions, questions and interpretations;
- Skill eval fixtures that measure task correctness, capability selection, evidence discipline and context cost.

The current v1.5 keyword-based skill routing may remain temporarily as a deterministic fallback, but it is not the future semantic authority.

## Milestone E — Language-Neutral Semantics (v1.6 primary)

Core machine semantics must not depend on English or any other human language.

Deliver:

- stable machine-readable IDs and enums independent of display language;
- source-language preservation for requirements, evidence, docs, logs and claims;
- locale metadata for user/project/source/output when known, with `mixed`/unknown support;
- multilingual skill descriptions/presentations as projections over the same canonical capability IDs;
- Unicode-safe paths and identifiers;
- cross-language semantic fixtures such as Portuguese task -> English code/docs and Japanese/Spanish examples;
- no translation step in the deterministic critical path;
- provider language-capability metadata when external semantic providers are used.

Translation is a derived presentation. It never replaces the original source as evidence.

## Milestone F — Context Foundation (v1.6–v1.7)

Delivered baseline: shared context artifact metadata, workspace fingerprint, hard budget, explicit overflow/degradation and stable-before-dynamic ordering.

Next:

- Context Spine and escalation policy;
- agent-directed context selection using declared capabilities and task semantics;
- DependencyDocsProvider with version/source provenance;
- ContextTransformProvider with loss classes;
- OKF interchange;
- optional multilingual semantic retrieval after benchmark.

Context selection must remain budgeted and explainable. Agent reasoning may select candidates, but provenance/freshness remain explicit.

## Milestone G — Structural Intelligence (v1.7+)

Define `StructuralProvider`, symbol identity, structural freshness, impact analysis, doctor and hybrid retrieval. Preserve a small offline fallback before optional codebase-memory or code-review-graph adapters.

Graphify, CodeGraph, Memtrace and code-graph-rag remain provider/benchmark candidates.

Do not build a growing stack of language-specific business-rule parsers. Structural parsers should report syntax/program facts; the Semantic Worker interprets meaning in project context.

## Milestone H — Knowledge / Outcomes (v1.6+)

Add full knowledge drift propagation and re-attestation, Evidence Receipts, Outcome Ledger, temporal project brain and co-change signals. Outcomes remain observed/accepted records, not self-awarded model scores.

## Milestone I — Runtime / Orchestration (later)

Define a runtime-neutral `RuntimeProvider`, session coordination, policy-aware concurrency, candidate evaluation, attempt budget and loop detection before any optional Conductor.

SotuRail may expose runtime integration surfaces, but it does not need to become the coding agent. Claude, Codex, Cursor, Gemini, Kimi and other hosts remain the semantic/execution workers.

## v1.6 release theme — Agent-Native Semantic Control Plane

Required P0:

1. Agent-Native Semantic Architecture contracts.
2. Portable Core Skill with progressive disclosure.
3. Capability Descriptor v2 and skill/capability binding.
4. Semantic Worker candidate-artifact contract.
5. Language-neutral semantics and preserve-source policy.
6. Host adapter/generic fallback contract.
7. Skill routing that treats model/agent selection as primary and keyword scoring as fallback only.
8. Skill/capability evaluation fixtures across multiple languages and project styles.
9. Documentation and migration guidance from Skill Rail 2.0.
10. No regression to v1.5 integrity, governance, evidence and security contracts.

P1 when independent and ready:

- Evidence Receipts;
- knowledge re-attestation propagation;
- N-1 migration engine;
- Decision Graph;
- Context Spine.

Not required for v1.6 core:

- full AGT/ACS integration;
- sophisticated native graph engine;
- mandatory vector database/embeddings;
- daemon;
- desktop UI;
- Conductor;
- full coding-agent runtime.

## Later / optional

- `VectorIndexProvider` after reproducible multilingual retrieval benchmarks.
- IntegrationBroker/Nango after credential and provider-boundary design.
- Tauri Run/Governance Console only as a client of stable contracts.
- Media, browser and external enrichers as narrow opt-in providers.
- SQLite/FTS5 as a rebuildable local index, never the sole source of truth.

Full Conductor, desktop runtime, multi-agent runtime, full temporal graph, OAuth platform, marketplace, browser automation framework, video pipeline and all-language bespoke parsers remain outside the near-term core.
