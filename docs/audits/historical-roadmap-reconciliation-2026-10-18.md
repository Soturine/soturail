# Historical Roadmap Reconciliation — 2026-10-18

**Repository:** [Soturine/soturail](https://github.com/Soturine/soturail)  
**Inspected HEAD:** `dc69775131e9442f9f39362c1a311a03c4fc9c85` (after v1.6.1 publication and errata)  
**Published baseline:** [v1.6.1](../releases/RELEASE_NOTES_v1.6.1.md), tag `242999ab76d9cdc7d68b12676d58a6f43d1f6289`.  
**Type:** evidence-oriented planning reconciliation, **not** a claim that all commands passed a fresh local end-to-end execution in this audit.

## Why this exists

The modern [roadmap](../../ROADMAP.md) and [control-plane tracker](../roadmap/verified-control-plane-implementation-tracker.md) are detailed about v1.5–v1.7, but earlier proposed capabilities are scattered across archived release plans, the [Future Rails Index](../roadmap/future-rails-index.md), [Agent Runtime Addendum](../roadmap/roadmap-agent-runtime-addendum.md), [Harness/Diagram/Payload Addendum](../roadmap/roadmap-harness-diagram-payload-addendum.md), and the [v1.6 Master Prompt](../roadmap/v1.6.0-agent-native-semantic-control-plane-master-prompt.md).

A former version target does **not** imply that the entire envisioned feature shipped in that version. Keep old plans as historical evidence, not as active contracts.

Historical tagged references:

- [Roadmap at v0.10.1](https://github.com/Soturine/soturail/blob/v0.10.1/ROADMAP.md) — early v0.5 through v1.0 staging.
- [Roadmap at v1.0.0](https://github.com/Soturine/soturail/blob/v1.0.0/ROADMAP.md) — original v1.1 Host, v1.2 Spec/Design/Diagram, v1.3 Graph, v1.4 Skill, v1.5 Governance plan.
- [Current Future Rails Index](../roadmap/future-rails-index.md) — evolving idea catalog, not implementation proof.
- [Current tracker](../roadmap/verified-control-plane-implementation-tracker.md) — operational owner of current v1.5+ statuses.

## Method and evidence limits

1. Read the historical plans and current owner docs. Check the registered command surface in `src/cli.ts` and relevant `src/commands/` modules, plus core modules, selected tests, release notes and existing qualification results.
2. **IMPLEMENTED** means a concrete code/CLI path was found and is covered in project engineering documents or tests. It does not prove every original subfeature or performance claim.
3. **PARTIAL** means only a meaningful subset of the original promise is implemented, or current real-agent validation is insufficient. **REFORMULATED** means the old requirement was intentionally superseded by a new contract. **DEFERRED** means planned without the specified feature surface. **DECLARED_UNAVAILABLE** means the capability exists only as a discovery/contract state, not an installed provider. **FUTURE_OPTIONAL** means no current delivery commitment.
4. A registered CLI command alone is not proof of operational quality, and the absence of a named CLI command does not prove that no internal helper exists. Negative claims here are strictly about the advertised feature/command surface and the reviewed modules.
5. Release and dogfood data are from [v1.6.1 notes](../releases/RELEASE_NOTES_v1.6.1.md) and [v1.7 qualification results](v1.7.0-real-agent-qualification-results.md). Only the repository and CI/release metadata were independently inspected here; no new paid-agent or native benchmark was run.
6. Status is **as of this inspected revision**, not an evergreen label. A new implementation needs linked tests/evidence and a new inspection before the status changes.

## Historical milestone disposition

| Original milestone | Reconciled disposition |
|---|---|
| v0.5–v0.6: memory/context/budget/offload/payload/host integration | Mostly implemented; target-format transformation and actual agent efficiency remain partial |
| v0.7: workflow/harness/diagram | Core phases and diagram validation exist; full diagram rendering/sync and some harness behaviors still deferred |
| v0.8: Project Brain/reverse specs | Implemented foundationally; linked evidence/drift propagation not complete |
| v0.9: benchmark-gated native | Implemented as an optional path; no native-only requirement |
| v0.10: reports/dashboard/observability | Implemented static local surface; interactive trace experience deferred |
| v1.0: stable local product | Replaced by narrower, enforceable verified-control-plane and agent-native contracts |
| v1.1: host compatibility | Implemented with canonical host adapters and conservative fallback |
| v1.2: Spec/Design/Diagram | Spec and Diagram partially implement old promises; **Design Rail deferred** |
| v1.3: Knowledge Graph | Former milestone absorbed into v1.4 planning, **graph runtime not delivered** |
| v1.4: Knowledge/Evidence/Skills/Tasklets | Core implementations exist; portable Skills further expanded in v1.6 |
| v1.5: governance/cost/resilience | Governance/evidence gates delivered; reporting exists but not a provider cost/rate-limit control plane |
| v1.6: agent-native semantic surface | Implemented; real-agent adoption, proportionality and provider gaps remain |
| Future: Agent Evolution/Conductor/UI integrations | Remain optional/deferred and must not be advertised as shipping |

## Capability-by-capability crosswalk

| ID | Historical commitment | Disposition | Grounded implementation / document | Remaining gap or decision |
|---|---|---|---|---|
| H01 | Memory capture, recall, approvals, consolidation | **IMPLEMENTED** | `src/commands/memory.ts`; `src/core/memory-rail.ts` | Retain; freshness/approval remain bounded, not semantic memory guarantees |
| H02 | Context selection, prune, route and experts | **PARTIAL** | `src/commands/context.ts`; `src/core/context-intelligence.ts` | Agent-led escalation and real task-quality proof still needed; no English expert router as authority |
| H03 | Role-based context packs and budget | **IMPLEMENTED** | `src/commands/context.ts`; `src/core/context-pack.ts` | Retain; measure context relevance, token cost and recovery against baseline |
| H04 | Offload/restore, stable/dynamic ordering | **IMPLEMENTED** | `src/commands/context.ts`; `src/core/context-artifact.ts` | Retain hard budgets, explicit loss/degradation and raw recovery |
| H05 | Tagged/JSON/TOON and target-aware payload transformation | **PARTIAL** | `src/commands/format.ts`; `src/core/format-compare.ts`; `docs/rails/context/structured-payload-rail.md` | Format comparison and text compression exist; documented `context pack --format tagged` is still an example, not a registered flag |
| H06 | Strict JSON safety checks | **IMPLEMENTED** | `src/commands/validate.ts`; `src/core/json-validator.ts` | Retain bounded duplicate-key, size and probable-secret diagnostics |
| H07 | Per-run workspaces and safe lifecycle | **IMPLEMENTED** | `src/commands/run.ts`; `src/core/run-workspace.ts` | Retain; review TTL, large raw logs and retention policy before more benchmark runs |
| H08 | Agent-doc hygiene and host rules | **IMPLEMENTED** | `src/commands/agents.ts`; `src/core/agent-docs-hygiene.ts` | Retain lint/split-context; requalify host behavior rather than infer compatibility |
| H09 | Host matrix, exports and doctors | **IMPLEMENTED** | `src/commands/agents.ts`; `src/core/host-adapters.ts` | v1.6 host registry supersedes duplicated host-specific branching; honor generic fallback limitations |
| H10 | MCP tools, discovery and safe exposure | **IMPLEMENTED** | `src/commands/mcp.ts`; `src/commands/capabilities.ts` | Typed, bounded; maintain negative/path-escape tests and version-pinned host config |
| H11 | Skill Rail 2.0 and portable Agent Skills | **IMPLEMENTED** | `src/commands/skills.ts`; `tests/v160-skills.test.ts` | Canonical portable Skill/Capability model supersedes large always-loaded or per-host copies |
| H12 | Spec-driven PRD/requirements/design/tasks and planning | **PARTIAL** | `src/commands/spec.ts`; `docs/rails/design/spec-driven-workflow.md` | `spec new|status|validate|task` exist; old `spec init|check|plan` and complete cross-artifact traceability not delivered as specified |
| H13 | Design Rail (DESIGN.md, tokens, lint/diff/export) | **DEFERRED** | `docs/rails/design/design-rail.md`; no `src/commands/design.ts` | Keep as optional candidate; define a task and tests before adding another rail |
| H14 | Diagram create/audit/validate/from-workflow | **IMPLEMENTED** | `src/commands/diagram.ts`; `src/core/diagram-rail.ts` | Keep lightweight Mermaid/spec contracts; avoid overstating full Mermaid syntax support |
| H15 | Diagram render/diff/sync/from-repo | **DEFERRED** | `docs/rails/design/diagram-rail.md`; `src/commands/diagram.ts` | Not registered; benchmark developer need and avoid duplicating host/IDE renderers |
| H16 | Workflow phases, local plans/review/verify/evidence | **IMPLEMENTED** | `src/commands/workflow.ts`; `src/core/workflow-store.ts` | Keep source-linked evidence and phase state; no claim of autonomous job execution |
| H17 | Harness failures, sessions/handoffs, acceptance checks | **PARTIAL** | `src/commands/harness.ts`; `src/core/harness-lifecycle.ts`; `src/commands/contract.ts` | Harness `contract check` validates specification only; recorded check execution/readiness belongs to Change Contracts |
| H18 | Filesystem evidence, reports and provenance | **IMPLEMENTED** | `src/core/fs-evidence.ts`; `src/commands/evidence.ts`; `src/commands/report.ts` | Preserve observed vs asserted status and secret-redaction boundary |
| H19 | Policy queue and risky-action decisions | **IMPLEMENTED** | `src/commands/policy.ts`; `src/core/policy-rail.ts` | A local gate/report, not OS sandbox or blanket external enforcement |
| H20 | Verified Control Plane, dual gate and execution envelope | **IMPLEMENTED** | `src/core/governance.ts`; `src/core/execution-envelope.ts`; `tests/governance-contracts.test.ts` | New authoritative trust core; older harness concepts are not separate sources of readiness truth |
| H21 | Change Contracts, revisions, interactive attestations | **IMPLEMENTED** | `src/commands/contract.ts`; `src/core/contract-lifecycle.ts` | Keep immutable baseline vs current verification state; no self-approved model claims |
| H22 | Reverse Specification extraction | **IMPLEMENTED** | `src/commands/reverse.ts`; `src/core/reverse-specification.ts` | `scan|claims|specs|gaps|export` exists; candidate specs require evidence and review |
| H23 | Project Brain claims/stale/repair/consolidation | **IMPLEMENTED** | `src/commands/brain.ts`; `src/core/project-brain.ts` | Keep source-aware; full dependency drift propagation remains separate |
| H24 | Knowledge compile/update/verify/list | **IMPLEMENTED** | `src/commands/knowledge.ts`; `src/core/knowledge-rail.ts` | Maintains source-backed knowledge, not a fully linked semantic graph |
| H25 | Knowledge Graph and code-graph commands | **DEFERRED** | `docs/rails/knowledge/knowledge-graph-rail.md`; `docs/rails/knowledge/code-graph.md`; no `src/commands/graph.ts` | Do not claim `graph build|impact|tour|export`; consider small objective structural provider first |
| H26 | Agent QA local datasets/golden/regression | **IMPLEMENTED** | `src/commands/eval.ts`; `src/core/agent-qa.ts` | These deterministic checks do not alone prove real agents select/use Skills |
| H27 | Agent-real differential qualification | **PARTIAL** | `benchmarks/agent-qualification/`; `docs/audits/v1.7.0-real-agent-qualification-results.md` | Pilot exists; stronger repeatability and larger tasks needed, no proven success gain on small tasks |
| H28 | Tasklet templates and dry run | **IMPLEMENTED** | `src/commands/tasklet.ts` | Keep as templates; do not claim agent scheduler or autonomous executor |
| H29 | Governance/cost/resilience warnings | **PARTIAL** | `src/commands/governance.ts`; `src/commands/context.ts`; `docs/rails/governance/resilience-rail.md` | Budget/exposure guidance exists; no live provider billing/rate-limit enforcement claim |
| H30 | Native benchmark and optional Rust acceleration | **IMPLEMENTED** | `src/commands/bench.ts`; `src/commands/native.ts`; `native/soturail-native/` | Keep TS default, bench-gated adoption and no mandatory native dependency |
| H31 | Local report/dashboard/observability | **IMPLEMENTED** | `src/commands/report.ts`; `src/commands/dashboard.ts`; `src/commands/obs.ts` | Static local reports/HTML; not interactive tracing or hosted console |
| H32 | Trace viewer and live local interactive graph UI | **DEFERRED** | `docs/architecture/observability-rail.md`; `docs/rails/knowledge/knowledge-graph-rail.md` | Do not infer from static dashboard or timeline output |
| H33 | Host-independent semantic worker and candidate artifacts | **REFORMULATED** | `src/commands/candidates.ts`; `src/core/semantic-candidate.ts`; `src/core/host-adapters.ts` | v1.6 agent-led semantics replaces old English lexical router as authoritative plan |
| H34 | N-1 artifact migration with rollback | **DEFERRED** | `docs/architecture/artifact-model-and-lineage.md`; tracker `FND-006` | Require dry-run, backup, validation, atomic replacement and rollback before qualifying |
| H35 | Evidence Receipts and Outcome Ledger | **DEFERRED** | tracker `VER-001`, `OUT-001`; current envelope/evidence primitives | Do not confuse existing evidence artifacts with complete receipt/outcome lifecycle |
| H36 | Decision Graph and knowledge drift propagation | **PARTIAL** | `src/core/project-brain.ts`; tracker `CON-002`, `KNW-001` | Basic records/freshness exist; graph of decisions and dependency re-attestation missing |
| H37 | StructuralProvider (`structural.impact`) | **DECLARED_UNAVAILABLE** | Capability Descriptor v2; tracker `STR-001`; v1.7 qualification report | Require 50+ file, hidden-dependent benchmark and ≥2/3 repeated reduction in misses before implementation |
| H38 | DependencyDocsProvider (`dependency.docs`) | **DECLARED_UNAVAILABLE** | Capability Descriptor v2; roadmap milestone F | Need version-matched, provenance-backed docs access; avoid generic unverified web summarization |
| H39 | Agent governance: trace/ledger/experiment/improve loop | **DEFERRED** | `docs/rails/governance/agent-governance-rail.md`; no registered `trace|ledger|experiment|improve` CLI | Candidate experiments and review must not become agent self-authorization |
| H40 | Full Conductor / agent-runtime orchestration | **FUTURE_OPTIONAL** | `docs/ecosystem/conductor-mode.md`; tracker `RUN-002` | Not part of current core; host agent remains executor |
| H41 | MCP Apps/AG-UI/gateway/desktop | **FUTURE_OPTIONAL** | historical v1.0 roadmap and `ROADMAP.md` later/optional section | Do not promote into mandatory release scope without consumer need and security design |
| H42 | Release qualification, provenance and reproducibility | **IMPLEMENTED** | `src/commands/release.ts`; `.github/workflows/release-provenance.yml`; v1.6.1 release notes | Published artifact identity verified; keep release immutable and distinguish corrected current docs from tagged history |

## Cross-cutting release reality after v1.6.1

The corrective release has a successfully verified GitHub Release, tag, GitHub SLSA v1/CycloneDX attestations, hash-matched npm tarball, and seven-project isolated-install smoke. These are release facts, not proof of greater task correctness with agents.

Remaining supply-chain/quality concerns:

- **SBOM scope mismatch:** the CycloneDX file attests the build-time resolved dependency graph (MCP core/server 2.0.0, zod 4.4.3), whereas unpinned downstream installs within permitted ranges resolved MCP core/server 2.3.1 and zod 4.6.7 on publication day. Define whether a released SBOM describes build, package contents, tested install, or a supported resolution envelope; test and label that scope honestly rather than asserting a single SBOM lists every future downstream resolution.
- **Registry provenance:** GitHub attestations bind the tarball to the tagged commit; npm-native provenance and a registry `gitHead` entry were absent. This is a separate delivery enhancement. Do not imply a manually published tarball has npm provenance.
- **Tagged documentation errata:** the immutable v1.6.1 package says `UNRELEASED`/`prepared` in its bundled release docs; corrected `main` and GitHub Release state the errata. Preserve tag and historical bytes.
- **Windows CI tail risk:** some heavier integration tests can exceed tight budgets on slower Windows runners. Measure and isolate before adjusting budgets.
- **Post-cut scope:** minimal `init --with-docs`, `run --summary-only` and five-dimensional harness readiness remain on `main`, not in the v1.6.1 tarball. Do not present them as shipped in v1.6.1.

## Next-step backlog, reconciled (not version promises)

| Gate | Area / old roadmap linkage | Proposed decision | Promotion evidence |
|---|---|---|---|
| P0 | Release supply chain and published-package UX (H42) | Define SBOM identity semantics and downstream install matrix; preserve manual publisher trust boundary unless owner opts into CI/OIDC | Independent packaged install on allowed Node versions, dependency-resolution report, provenance/hash checks |
| P0 | Benchmark evidence retention (H07, H27) | Remove noisy generated per-run artifacts from current Git tracking **only after** a reviewed archival manifest, checksums, privacy scan, and verified access path | Raw runs reproducibly retrievable by run ID; CI guards newly tracked results; no tag/history rewrite |
| P1 | Agent adoption, context-cost and qualification (H02, H03, H11, H27, H33) | Finish valid three-repeat measurements before claiming improvements, then target medium/high-risk tasks | Correctness, false-ready, false-not-ready(policy-held vs invalid), token/call/wall-time, independent oracles and host-use attribution |
| P1 | Structural benchmark (H25, H37) | Build 50+ file hidden-dependent fixture first; no provider implementation without passing gate | ≥2/3 repetitions with fewer missed dependents/regressions; provenance and unknown edges |
| P1 | Knowledge drift / receipts / N-1 migration (H34–H36) | Advance only one reusable primitive at a time where a consumer requires it | Reattestation invalidation, lineage, crash/recovery and backward-compatibility evidence |
| P2 | Spec/design/diagram reconciliation (H12–H15) | Prototype a small real design/spec-to-evidence workflow; avoid parallel gate semantics | Example in a real repo; before/after verification, accessibility/token lint tests and time-to-first-use |
| P2 | Knowledge/structural graph and outcomes (H25, H35–H38) | Prefer evidence-backed optional graph projections over a mandatory graph database | Linked source/test/decision evidence and stale-edge detection, no fabricated edges |
| P2 | Agent Evolution (H39) | Keep as governed experiment candidate; do not build automatic self-improvement runtime | Traceability, independent eval, approval, rollback and no agent self-promotion |
| P3 | UI/gateway/Conductor (H40, H41) | No current commitment until real users prove a need | A supported use case, security model, cost budget and measured adoption |

## Status-change protocol

For each deferred/partial item selected for implementation, update this reconciliation and the [tracker](../roadmap/verified-control-plane-implementation-tracker.md) with: original requirement → current equivalent → owner/consumer → acceptance oracle → source-code path → tests → negative case → release/version boundary → residual limitations. Do not change a status based on a proposal, README claim, successful CI alone, or one agent's assertion.

No new Rail or graph/database runtime should be introduced simply to satisfy an old label. The question is whether the user-visible outcome and its trust boundary still matter, not whether the historical command name can be reproduced.

## Explicit decisions needed from the owner

1. Keep **Design Rail** as a measured optional candidate, or close it as out of scope after a small real design-handoff experiment?
2. Should the original **Knowledge Graph** become an optional view over StructuralProvider/Project Brain, rather than a separate mandatory subsystem?
3. Retain **Agent Evolution** as a human-approved eval experiment service only, not a runtime that self-applies patches?
4. Which evidence-retention policy and storage location will support the next real-agent benchmark without inflating the Git tree?
5. Should package publication remain manual with GitHub byte attestations, or migrate to approved npm OIDC provenance?

Until decided, these items remain candidates or future directions; no release target is promised.
