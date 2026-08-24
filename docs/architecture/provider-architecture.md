# Provider Architecture

Providers enrich a deterministic local core through small, replaceable interfaces. A provider advertises capabilities and health, validates its configuration, returns attributed results, and fails without changing the meaning of a deny or readiness blocker.

## Decision matrix

| Class | Projects / standards | Decision and boundary |
|---|---|---|
| Native | WorkspaceGuard, ArtifactStore, WorkspaceFingerprint, NativeMinimal governance, heuristic index | Required offline baseline; human-readable artifacts remain canonical. |
| Integrate as provider or standard | Microsoft AGT/ACS, OKF, codebase-memory, code-review-graph, Context7/official docs | High-priority adapters after API, license, schema, health, fallback, and fixture verification. AGT/ACS is currently fail-closed boundary only. |
| Provider candidates | Graphify, CodeGraph, Memtrace, code-graph-rag, Headroom, AgentScope, Orca, Nango, turbovec | Optional enrichment or runtime/connectivity implementations; never mandatory core dependencies. |
| Absorb concepts | spec-driven, Three Man Team, HyperFrames, Ponytail, clarification/grilling, Raven Stack, Agentic Inbox, TradingAgents, book-to-skill, reverse-skill, LeanCTX, MiMoCode, ECC, Agent-Reach, Flowsint | Adopt useful contracts, evaluation patterns, handoffs, or routing ideas without cloning product/runtime scope. |
| Benchmark target | RTK, LeanCTX, Graphify, CodeGraph, Memtrace, Headroom, turbovec | Compare only through reproducible fixtures and equivalent correctness criteria; no unsupported superiority claim. |
| Research reference | Repomix, Serena, Aider, Sourcegraph/Cody, Tree-sitter, SQLite/FTS5, Secretlint, Playwright/Appium | Inform parsing, storage, security, and validation choices; reference does not imply dependency. |
| Do not incorporate as core | Desktop Commander MCP, OmniRoute, Pake, RxDB, MoneyPrinterTurbo, VoxCPM, Fincept, OfficeCLI, large MCP catalogs, full browser/media frameworks | Different product boundary, excessive capability surface, or unnecessary runtime weight. May interoperate through explicit adapters later. |

The detailed cumulative research trail remains in [External Projects Audit](../ecosystem/external-projects-audit.md). This matrix is the current architectural decision, not a claim that each upstream was integrated or re-audited in v1.5.

## Provider rules

1. Keep the TypeScript fallback usable without the provider.
2. Pin and record provider/API/schema versions.
3. Report `healthy`, `degraded`, or `unavailable`; do not hide fallback.
4. Preserve source, version, query, digest, and timestamp provenance.
5. Enforce WorkspaceGuard, hard context budgets, and capability policy at the SotuRail boundary.
6. Test failure, timeout, malformed schema, stale output, and fallback behavior.
7. Reconcile provider capability metadata with the canonical registry to detect drift.

Structural, dependency-doc, context-transform, runtime, registry, integration, and vector interfaces remain independent so choosing one vendor cannot redefine another trust boundary.
