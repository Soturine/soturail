# Provider Architecture

Providers enrich SotuRail through small, replaceable interfaces. They sit behind canonical capabilities. A provider advertises capabilities and health, validates configuration, returns attributed results, and fails without changing the meaning of a deny, blocker or evidence state.

v1.6 separates three concerns:

```text
Skill / Semantic Worker = how an agent understands and composes work
Canonical capability     = what SotuRail promises
Provider                 = one implementation that may supply the capability
```

A Skill must not need to know whether `structural.impact` came from NativeLite, codebase-memory, code-review-graph, Graphify or another conforming provider.

## Decision matrix

| Class | Projects / standards | Decision and boundary |
|---|---|---|
| Native trust core | WorkspaceGuard, ArtifactStore, WorkspaceFingerprint, NativeMinimal governance | Required offline baseline for proof, provenance, freshness and policy. |
| Agent Skill / operating-procedure influences | Ponytail, Hallmark, clarification/grilling, reverse-skill, ECC, HyperFrames, Three Man Team, book-to-skill | Absorb workflow, routing, progressive-disclosure and evaluation patterns without copying product scope. |
| Integrate as provider or standard | Microsoft AGT/ACS, OKF, codebase-memory, code-review-graph, Context7/official docs | High-priority adapters/standards only after API, license, schema, health, fallback and fixture verification. |
| Provider candidates | Graphify, CodeGraph, Memtrace, code-graph-rag, Headroom, AgentScope, Orca, Nango, turbovec | Optional enrichment/runtime/connectivity implementations; never mandatory core dependencies. |
| Runtime / host references | Claude, Codex, Cursor, Gemini, Kimi-compatible/generic agents, MiMoCode, Pi, AgentScope, Orca | Semantic/execution workers or runtime references. Native support is claimed only when verified by fixtures. |
| Benchmark target | RTK, LeanCTX, Graphify, CodeGraph, Memtrace, Headroom, turbovec | Compare only through reproducible fixtures and equivalent correctness criteria; no unsupported superiority claim. |
| Research reference | Repomix, Serena, Aider, Sourcegraph/Cody, Tree-sitter, SQLite/FTS5, Secretlint, Playwright/Appium | Inform parsing, storage, security and validation; reference does not imply dependency. |
| Vertical/product reference | LibreChat, Agentic Inbox, TradingAgents, Flowsint, MoneyPrinterTurbo, VoxCPM, Fincept | Absorb narrow patterns when useful; do not pull vertical product scope into core. |
| Do not incorporate as core | Desktop Commander MCP, OmniRoute, Pake, RxDB, large MCP catalogs, full browser/media frameworks | Different product boundary, excessive capability surface or unnecessary runtime weight. May interoperate through explicit adapters later. |

The cumulative research inventory lives in [2026 External Research Master Index](../ecosystem/2026-external-research-master-index.md). Historical detail remains in [External Projects Audit](../ecosystem/external-projects-audit.md).

## Provider rules

1. Keep a usable SotuRail fallback when the capability is required for baseline operation.
2. Pin and record provider/API/schema versions.
3. Report `healthy`, `degraded` or `unavailable`; do not hide fallback.
4. Preserve source, version, query, digest, timestamp and workspace provenance.
5. Enforce WorkspaceGuard, hard context budgets and capability policy at the SotuRail boundary.
6. Test failure, timeout, malformed schema, stale output and fallback behavior.
7. Reconcile provider capability metadata with the canonical registry to detect drift.
8. Declare language/query/output limitations when a provider performs semantic work.
9. Never let provider output self-upgrade to verified project truth.
10. Keep provider identity out of portable Skill workflow unless the provider itself is the task subject.

Structural, dependency-doc, context-transform, runtime, registry, integration and vector interfaces remain independent so choosing one provider cannot redefine another trust boundary.

## Semantic routing rule

Do not add a provider merely to replace agent reasoning with another hardcoded classifier.

Use providers when they add evidence or capability the agent does not reliably have on its own, for example:

- source/version-matched dependency docs;
- code graph facts;
- symbol resolution;
- runtime observations;
- governed external integrations;
- semantic retrieval over large corpora.

The Semantic Worker may combine those outputs, but SotuRail records where each fact came from.
