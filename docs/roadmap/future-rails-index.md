# Future Rails Index

This document is the quick index for implemented rails and planned SotuRail rails after the v1.0 stable surface.

It does not replace `ROADMAP.md`. It exists so planned features are not scattered only across long roadmap sections.

## Core Direction

```txt
SotuRail = local-first Context OS for AI coding agents.
```

SotuRail should remain:

- local-first;
- npm-friendly;
- safe-by-default;
- benchmark-driven;
- independent from any single agent host;
- small enough to use in normal developer projects.

v1.0.0 froze the first stable local Context OS surface. v1.1.0 delivered Host Compatibility Rail 1.0. The remaining post-v1 sequence is now staged with the 2026 agent-harness synthesis:

```txt
v1.1.1  Host Compatibility Polish, ecosystem docs and golden export checks
v1.2.0  Spec, Design, Diagram and Harness Lifecycle Rail
v1.3.0  Absorbed into v1.4.0
v1.4.0  Knowledge, Evidence, Evaluation, Skills and Tasklets
v1.5.0  Governance, Cost, Resilience and Host Router Rail
v1.6.0  Agent Governance / Evolution Rail
```

v1.2.0 also delivers a focused Harness Lifecycle slice: safe scaffold initialization, lifecycle audit, feature state, sessions and handoffs. Spec/design/diagram expansion remains staged and must be documented honestly when not implemented.

## 2026 Agent Runtime Update

The newest planning layer is tracked in [`docs/roadmap/roadmap-agent-runtime-addendum.md`](roadmap-agent-runtime-addendum.md).

It tightens how the future rails connect around current agent-runtime patterns:

- Claude/Codex/Gemini/Cursor/Antigravity-style host-aware exports;
- MCP as an external capability boundary;
- Agent Skills as local reusable operating procedures;
- per-run local workspaces inspired by Leoflow-style staging, without Kubernetes/PVC complexity;
- context budgeting and compaction/offload guidance;
- acceptance harness contracts that prevent premature "done" states;
- reverse specification extraction from existing code/docs into claims, rules, specs, gaps and validation checklists.

## Planned Rails

| Rail | Purpose | Main version target | Primary docs |
| --- | --- | --- | --- |
| Memory Rail | Store, recall, capture and consolidate approved local memory | v0.5.0+ | `docs/rails/context/memory-rail.md`, `docs/rails/context/context-packs.md`, `ROADMAP.md` |
| Context Intelligence | Select, prune, route and offload task-specific context | v0.5.0+ | `docs/rails/context/context-packs.md`, `docs/ecosystem/ecosystem-influences.md` |
| Context Expert Router | Route tasks to code/docs/release/security/workflow/memory/research context experts | v0.5.0+ | `docs/rails/context/context-packs.md`, `ROADMAP.md` |
| Context Budget Rail | Estimate context drivers and recommend compaction/offload before agent handoff | v0.5.0 seed | `docs/roadmap/roadmap-agent-runtime-addendum.md`, `docs/rails/context/context-packs.md` |
| Role Packs | Generate planner/executor/reviewer/release-manager/researcher packs | v0.5.0+ | `docs/rails/context/context-packs.md`, `docs/rails/harness/workflow-rail.md` |
| Run Workspace Rail | Store per-run input, output, raw logs, offloads, artifacts, summaries and evidence | v0.5.0 seed | `docs/roadmap/roadmap-agent-runtime-addendum.md`, `docs/rails/harness/workflow-rail.md` |
| MCP Exposure Rail | Report exposed MCP tools/resources/prompts/roots and local risk notes | v0.5.0 seed | `docs/roadmap/roadmap-agent-runtime-addendum.md`, `docs/rails/hosts/mcp.md`, `docs/rails/governance/policy-rail.md` |
| Skill Boundary Rail | Route skills by task, role, evidence and host capability instead of always loading them | v0.5.0 seed | `docs/roadmap/roadmap-agent-runtime-addendum.md`, `docs/rails/skills/skill-rail.md` |
| Harness Rail | setup/plan/work/review/release discipline, evidence packs and failure ledger | v0.5.0 seeds, v0.7.0 expansion | `docs/rails/harness/harness-rail.md`, `docs/rails/harness/workflow-rail.md` |
| Harness Lifecycle Rail | Safe local instructions, state, sessions, features, audits and handoffs | v1.2.0 implemented | `docs/rails/harness/harness-lifecycle-rail.md`, `docs/security/security-boundaries.md` |
| Acceptance Harness Contracts | Require build/typecheck/lint/test/coverage/docs/policy gates before accepting work | v0.5.0 seed, v0.7.0 expansion | `docs/roadmap/roadmap-agent-runtime-addendum.md`, `docs/rails/harness/harness-rail.md` |
| Policy Rail | Rules, approvals, risky action queue, auth checks and MCP exposure reports | v0.5.0+ | `docs/rails/governance/policy-rail.md`, `docs/security/security-model.md`, `docs/rails/governance/rules.md` |
| Structured Payload Rail | Target-aware Markdown/JSON/tagged/TOON-table/Mermaid context formats | v0.5.1+ | `docs/rails/context/structured-payload-rail.md`, `docs/rails/context/context-packs.md` |
| Diagram Rail | Mermaid diagrams and `.spec.md` visual contracts | v0.5.1 docs, v0.7.0 expansion | `docs/rails/design/diagram-rail.md`, `docs/rails/design/spec-driven-workflow.md` |
| Agent Docs Hygiene | Keep `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and Cursor rules short and referenced | v0.5.0+ | `docs/rails/hosts/agent-docs-hygiene.md`, `docs/rails/hosts/agents.md` |
| Filesystem Evidence Rail | Snapshot, touched-file and diff evidence tied to workflows and raw IDs | v0.5.0 seeds, v0.7.0 expansion | `docs/rails/harness/filesystem-evidence-rail.md`, `docs/rails/harness/workflow-rail.md` |
| Evidence Pack | Connect build/test/audit/pack/raw IDs/policy decisions/release notes | v0.5.0 seeds, v0.7.0 expansion | `docs/rails/harness/harness-rail.md`, `docs/rails/harness/workflow-rail.md` |
| Evaluation Suite | Quality benchmarks for context, payload formats, diagrams, evidence and role packs | v0.6.1 | `docs/rails/evaluation/evaluation-suite.md`, `docs/rails/evaluation/benchmarking.md`, `ROADMAP.md` |
| Reverse Specification Rail | Turn existing code/docs/config/logs into claims, rules, specs, gaps and validation tasks | v0.8.0 primary | `docs/rails/knowledge/reverse-specification-rail.md`, `docs/rails/knowledge/knowledge-to-rules.md` |
| Project Brain | Verified claims, decisions, bugs, gaps, rules, stale events and agent-safe briefs | v0.8.0 | `docs/rails/knowledge/project-brain.md`, `ROADMAP.md` |
| Host Compatibility Rail | Host-aware exports, capability matrix, host doctors and conservative prompt-only fallback for OpenCode, Antigravity, Claude, Codex, Cursor, Deep Agents-style and generic hosts | v1.1.0 implemented | `docs/rails/hosts/host-compatibility-rail.md`, `docs/rails/hosts/agents.md`, `docs/rails/hosts/mcp.md`, `docs/reference/contracts/agent-export-contract.md` |
| Agent QA Rail | Offline datasets, golden exports, regression reports and optional LLM-as-judge policy | v1.1.1 docs, v1.3.0 planned | `docs/rails/evaluation/agent-qa-rail.md`, `docs/rails/evaluation/eval-datasets.md`, `docs/rails/evaluation/golden-agent-tests.md`, `docs/rails/evaluation/llm-as-judge-policy.md` |
| Evidence And Provenance Rail | Provenance sidecars, verification statuses and evidence per run/report | v1.3.0 | `docs/rails/evidence/evidence-provenance-rail.md`, `docs/rails/evidence/report-rail.md`, `docs/rails/harness/filesystem-evidence-rail.md` |
| Knowledge Rail | Compile docs/specs/notes into on-demand SKILL.md/topic/glossary/pattern packs | v1.3.0 docs, v1.4.0 skill integration | `docs/rails/knowledge/knowledge-rail.md`, `docs/rails/skills/skill-rail-2.md`, `docs/rails/knowledge/project-brain.md` |
| Resilience Rail | Rate-limit, fallback and provider-risk documentation/reporting without proxying traffic | v1.5.0 | `docs/rails/governance/resilience-rail.md`, `docs/rails/governance/rate-limit-and-fallback-policy.md`, `docs/rails/governance/governance-cost-rail.md` |
| Host Router Rail | Route one local context source into host-specific export formats with safe fallback | v1.5.0 | `docs/rails/hosts/host-router-rail.md`, `docs/rails/hosts/host-compatibility-rail.md`, `docs/rails/context/context-packs.md` |
| Tasklet Rail | Small local reusable task templates for agents | v1.4.0 exploration | `docs/rails/tasklets/tasklet-rail.md`, `docs/rails/skills/skill-rail-2.md`, `docs/rails/harness/workflow-rail.md` |
| Agent Governance/Evolution Rail | Trace, ledger, experiments, approval gates and improve/eval/apply loop | v1.6.0 | `docs/rails/governance/agent-governance-rail.md`, `docs/rails/evaluation/evaluation-suite.md`, `docs/rails/governance/policy-rail.md` |
| Spec Rail | PRD, requirements, design, tasks and acceptance criteria as workflow inputs | v1.2.0 | `docs/rails/design/spec-driven-workflow.md`, `docs/rails/design/design-rail.md`, `docs/rails/design/diagram-rail.md` |
| Design Rail | Local `DESIGN.md`, design token lint/diff/export and agent-readable visual guidance | v1.2.0 | `docs/rails/design/design-rail.md`, `docs/architecture/dashboard-rail.md` |
| Knowledge Graph Rail | Local graph of files, claims, decisions, tests, workflows, diagrams and releases | v1.3.0 | `docs/rails/knowledge/knowledge-graph-rail.md`, `docs/rails/knowledge/code-graph.md`, `docs/rails/knowledge/project-brain.md` |
| Skill Rail 2.0 | Domain skill templates, lint/eval/report and role-aware exports | v1.4.0 | `docs/rails/skills/skill-rail-2.md`, `docs/rails/skills/skill-rail.md`, `docs/rails/governance/policy-rail.md` |
| Governance And Cost Rail | Context budget, dynamic workflow risk and MCP/skill exposure warnings | v1.5.0 | `docs/rails/governance/governance-cost-rail.md`, `docs/rails/evidence/report-rail.md`, `docs/rails/governance/policy-rail.md` |
| Redacted Evidence Sharing | Local redacted evidence bundles for reports/logs without hosting by default | v1.4+ exploration | `docs/rails/evidence/report-redaction.md`, `docs/ecosystem/external-projects-audit.md` |
| Local Dashboard | Local reports, trace viewer, Mermaid rendering and policy/evidence views | v0.10.0 | `ROADMAP.md` |
| SotuRail Conductor | Optional future planner/verifier/reviewer/tasklet coordinator behind approval gates | Future proposed | `docs/ecosystem/conductor-mode.md`, `docs/security/security-boundaries.md` |

## Version Summary

### v0.5.0

Focus:

- Memory Rail;
- Context Intelligence;
- Context Expert Router;
- Context Budget Rail seed;
- Run Workspace Rail seed;
- Role-Based Context Packs;
- MCP Exposure Rail seed;
- Skill Boundary Rail seed;
- Acceptance Harness Contract seed;
- Harness Failure Ledger seeds;
- early Evidence Pack model;
- Filesystem Evidence seeds;
- Policy Approval Queue seeds;
- Agent Docs Hygiene;
- Policy/Governance Rail;
- Native reliability gate.

### v0.5.1

Focus:

- memory/context polish;
- agent docs linting examples;
- context budget and workspace report examples;
- structured payload docs and examples;
- light JSON strict validator seed;
- light format comparison seed;
- target-aware context formats;
- Diagram Rail docs and basic validation plan;
- `AUTH.md` scaffold docs if policy/auth-check lands.

### v0.5.2

Focus:

- CI stabilization after v0.5.1;
- stale version-test cleanup;
- less brittle agent doctor expectations;
- lightweight quality fixtures for JSON validation, format compare, context routing, budget, run workspace, workflow evidence and agent-doc hygiene;
- roadmap realignment so the full evaluation suite moves to v0.6.1.

### v0.6.0

Focus:

- real agent runtime integration;
- host capability matrix;
- Agent Runtime Adapter;
- prompt-only fallbacks;
- agent-specific docs for context, rules, hooks, skills, settings and policy;
- optional compatibility notes for Claude Code Harness-style workflows.

### v0.6.1

Focus:

- agent UX polish;
- host-specific copy/paste setup examples;
- memory recall quality fixtures;
- context selection and budget quality benchmarks;
- reducer quality checks;
- role-pack, skill-routing and agent-doc hygiene quality;
- offload/restore quality;
- format quality: Markdown vs tagged vs JSON vs compact formats;
- strict JSON quality fixtures;
- evidence-pack completeness;
- harness scenario fixtures;
- acceptance-contract fixtures;
- diagram validation fixtures;
- optional local benchmark reports.

### v0.7.0

Focus:

- Workflow Rail 2.0;
- setup/plan/work/review/release phases;
- review perspectives;
- evidence packs;
- acceptance harness contracts promoted from seed to workflow discipline;
- Diagram Rail commands;
- `.spec.md` visual contracts;
- workflow/release/policy/MCP/context diagrams.

### v0.8.0

Focus:

- Verified Project Brain;
- Reverse Specification Rail;
- JSONL claims, decisions, bugs, gaps, rules and stale events;
- diagrams and specs as source-backed project knowledge;
- recurring bugs and harness failures as rules/checks;
- agent docs freshness.

### v0.10.0

Focus:

- local reports;
- trace viewer;
- dashboard;
- Mermaid rendering;
- policy/evidence/context selection reports;
- structured payload comparison reports.

### v0.10.1

Focus:

- JSON validity and schema compatibility checks;
- report/status/dashboard/observability polish;
- benchmark/native/baseline messaging polish;
- v1 readiness reports;
- stable command surface draft;
- deprecation policy;
- migration-to-v1 draft.

### v1.0.0

Focus:

- stable Context OS surface;
- schema compatibility commitments;
- stable command surface freeze;
- Project Brain refresh before v1 contracts;
- clean onboarding and release evidence;
- no new large rail shipped as a surprise.

### v1.1.0

Focus:

- Host Compatibility Rail 1.0 delivered;
- OpenCode, Antigravity, DeepAgents-style, Gemini legacy-compatible and generic host exports;
- host capability matrix 2.0 fields with backward-compatible schema;
- per-host doctor reports;
- read-only MCP host manifests.

### v1.1.1

Focus:

- 2026 agent-harness synthesis docs;
- Agent QA, golden export and optional judge policy docs;
- Evidence/Provenance, Knowledge, Resilience, Host Router, Tasklet and Agent Governance planning docs;
- validate -> fix -> verify -> report workflow example;
- multi-agent researcher/analyst/writer/verifier template example.

### v1.2.0

Focus:

- Harness Lifecycle Rail implemented with `harness init`, `harness audit`, sessions, handoffs and feature state;
- Spec, Design And Diagram Rail;
- PRD/requirements/design/tasks scaffolds;
- local `DESIGN.md` lint/diff/export;
- Mermaid render/diff validation.

### v1.3.0

Absorbed into v1.4.0. Knowledge packs, evidence/provenance, deterministic evaluation, skills and tasklets share one source-backed lifecycle and are more useful when shipped together. The larger graph runtime remains planned.

### v1.4.0

Implemented focus:

- Knowledge Rail estimate/compile/update/verify/list;
- evidence collection, verification statuses and provenance reports;
- local eval datasets, golden checks and regression reports;
- Skill Rail 2.0 templates, build/fold-in, lint, eval and reports;
- dry-run local tasklet templates;
- reorganized docs and link validation.

### v1.5.0

Focus:

- Governance, Cost, Resilience and Host Router Rail;
- context budget reports and compact context variants;
- rate-limit/fallback policy reports;
- host-format fallback without provider proxying;
- dynamic workflow guardrails;
- MCP/skill exposure risk summaries.

### v1.6.0

Focus:

- Agent Governance / Evolution Rail;
- trace and ledger artifacts;
- agent boundary policy;
- experiments/candidates/results;
- propose -> eval -> approve -> apply loop;
- approval gates before any patch application.


## What Should Not Happen

SotuRail should not become:

- a Claude-only plugin;
- a Mermaid-only CLI;
- a heavy production gateway;
- a LangChain/LangGraph/Deep Agents clone;
- a Leoflow/Airflow clone;
- a Kubernetes volume orchestrator;
- a tool that claims token savings without quality checks;
- a tool that exposes arbitrary shell execution through MCP by default;
- a design-system platform;
- a cloud knowledge graph;
- a tool marketplace;
- a pastebin/hosting service;
- an offensive security automation tool.

## Related Docs

- `ROADMAP.md`
- `docs/roadmap/roadmap-agent-runtime-addendum.md`
- `docs/rails/context/memory-rail.md`
- `docs/rails/harness/harness-rail.md`
- `docs/rails/governance/policy-rail.md`
- `docs/rails/design/diagram-rail.md`
- `docs/rails/context/structured-payload-rail.md`
- `docs/rails/hosts/agent-docs-hygiene.md`
- `docs/rails/harness/filesystem-evidence-rail.md`
- `docs/rails/evaluation/evaluation-suite.md`
- `docs/rails/harness/workflow-rail.md`
- `docs/rails/context/context-packs.md`
- `docs/rails/design/spec-driven-workflow.md`
- `docs/security/security-model.md`
- `docs/rails/governance/rules.md`
- `docs/rails/evaluation/benchmarking.md`
- `docs/rails/evaluation/metrics.md`
- `docs/rails/hosts/mcp.md`
- `docs/rails/hosts/agents.md`
- `docs/ecosystem/ecosystem-influences.md`
- `docs/ecosystem/comparisons.md`
- `docs/roadmap/roadmap-harness-diagram-payload-addendum.md`
- `docs/ecosystem/agent-harness-synthesis-2026.md`
- `docs/rails/evaluation/agent-qa-rail.md`
- `docs/rails/evaluation/eval-datasets.md`
- `docs/rails/evaluation/golden-agent-tests.md`
- `docs/rails/evaluation/llm-as-judge-policy.md`
- `docs/rails/evidence/evidence-provenance-rail.md`
- `docs/rails/governance/agent-governance-rail.md`
- `docs/rails/harness/harness-lifecycle-rail.md`
- `docs/rails/knowledge/knowledge-rail.md`
- `docs/rails/governance/resilience-rail.md`
- `docs/rails/governance/rate-limit-and-fallback-policy.md`
- `docs/rails/tasklets/multi-agent-workflow-templates.md`
- `docs/rails/hosts/host-router-rail.md`
- `docs/rails/tasklets/tasklet-rail.md`
- `docs/security/security-boundaries.md`
- `docs/ecosystem/conductor-mode.md`
