# Future Rails Index

This document is the quick index for planned SotuRail rails after v0.4.x.

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

## 2026 Agent Runtime Update

The newest planning layer is tracked in [`docs/roadmap-agent-runtime-addendum.md`](roadmap-agent-runtime-addendum.md).

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
| Memory Rail | Store, recall, capture and consolidate approved local memory | v0.5.0+ | `docs/memory-rail.md`, `docs/context-packs.md`, `ROADMAP.md` |
| Context Intelligence | Select, prune, route and offload task-specific context | v0.5.0+ | `docs/context-packs.md`, `docs/ecosystem-influences.md` |
| Context Expert Router | Route tasks to code/docs/release/security/workflow/memory/research context experts | v0.5.0+ | `docs/context-packs.md`, `ROADMAP.md` |
| Context Budget Rail | Estimate context drivers and recommend compaction/offload before agent handoff | v0.5.0 seed | `docs/roadmap-agent-runtime-addendum.md`, `docs/context-packs.md` |
| Role Packs | Generate planner/executor/reviewer/release-manager/researcher packs | v0.5.0+ | `docs/context-packs.md`, `docs/workflow-rail.md` |
| Run Workspace Rail | Store per-run input, output, raw logs, offloads, artifacts, summaries and evidence | v0.5.0 seed | `docs/roadmap-agent-runtime-addendum.md`, `docs/workflow-rail.md` |
| MCP Exposure Rail | Report exposed MCP tools/resources/prompts/roots and local risk notes | v0.5.0 seed | `docs/roadmap-agent-runtime-addendum.md`, `docs/mcp.md`, `docs/policy-rail.md` |
| Skill Boundary Rail | Route skills by task, role, evidence and host capability instead of always loading them | v0.5.0 seed | `docs/roadmap-agent-runtime-addendum.md`, `docs/skill-rail.md` |
| Harness Rail | setup/plan/work/review/release discipline, evidence packs and failure ledger | v0.5.0 seeds, v0.7.0 expansion | `docs/harness-rail.md`, `docs/workflow-rail.md` |
| Acceptance Harness Contracts | Require build/typecheck/lint/test/coverage/docs/policy gates before accepting work | v0.5.0 seed, v0.7.0 expansion | `docs/roadmap-agent-runtime-addendum.md`, `docs/harness-rail.md` |
| Policy Rail | Rules, approvals, risky action queue, auth checks and MCP exposure reports | v0.5.0+ | `docs/policy-rail.md`, `docs/security-model.md`, `docs/rules.md` |
| Structured Payload Rail | Target-aware Markdown/JSON/tagged/TOON-table/Mermaid context formats | v0.5.1+ | `docs/structured-payload-rail.md`, `docs/context-packs.md` |
| Diagram Rail | Mermaid diagrams and `.spec.md` visual contracts | v0.5.1 docs, v0.7.0 expansion | `docs/diagram-rail.md`, `docs/spec-driven-workflow.md` |
| Agent Docs Hygiene | Keep `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and Cursor rules short and referenced | v0.5.0+ | `docs/agent-docs-hygiene.md`, `docs/agents.md` |
| Filesystem Evidence Rail | Snapshot, touched-file and diff evidence tied to workflows and raw IDs | v0.5.0 seeds, v0.7.0 expansion | `docs/filesystem-evidence-rail.md`, `docs/workflow-rail.md` |
| Evidence Pack | Connect build/test/audit/pack/raw IDs/policy decisions/release notes | v0.5.0 seeds, v0.7.0 expansion | `docs/harness-rail.md`, `docs/workflow-rail.md` |
| Evaluation Suite | Quality benchmarks for context, payload formats, diagrams, evidence and role packs | v0.6.1 | `docs/evaluation-suite.md`, `docs/benchmarking.md`, `ROADMAP.md` |
| Reverse Specification Rail | Turn existing code/docs/config/logs into claims, rules, specs, gaps and validation tasks | v0.8.0 primary | `docs/reverse-specification-rail.md`, `docs/knowledge-to-rules.md` |
| Project Brain | Verified claims, decisions, bugs, gaps, rules, stale events and agent-safe briefs | v0.8.0 | `docs/project-brain.md`, `ROADMAP.md` |
| Host Compatibility Rail | Host-aware exports, capability matrix and conservative prompt-only fallback for OpenCode, Antigravity, Claude, Codex, Cursor, Deep Agents-style and generic hosts | v1.1.0 | `docs/host-compatibility-rail.md`, `docs/agents.md`, `docs/mcp.md` |
| Spec Rail | PRD, requirements, design, tasks and acceptance criteria as workflow inputs | v1.2.0 | `docs/spec-driven-workflow.md`, `docs/design-rail.md`, `docs/diagram-rail.md` |
| Design Rail | Local `DESIGN.md`, design token lint/diff/export and agent-readable visual guidance | v1.2.0 | `docs/design-rail.md`, `docs/dashboard-rail.md` |
| Knowledge Graph Rail | Local graph of files, claims, decisions, tests, workflows, diagrams and releases | v1.3.0 | `docs/knowledge-graph-rail.md`, `docs/code-graph.md`, `docs/project-brain.md` |
| Skill Rail 2.0 | Domain skill templates, lint/eval/report and role-aware exports | v1.4.0 | `docs/skill-rail-2.md`, `docs/skill-rail.md`, `docs/policy-rail.md` |
| Governance And Cost Rail | Context budget, dynamic workflow risk and MCP/skill exposure warnings | v1.5.0 | `docs/governance-cost-rail.md`, `docs/report-rail.md`, `docs/policy-rail.md` |
| Redacted Evidence Sharing | Local redacted evidence bundles for reports/logs without hosting by default | v1.4+ exploration | `docs/report-redaction.md`, `docs/external-projects-audit.md` |
| Local Dashboard | Local reports, trace viewer, Mermaid rendering and policy/evidence views | v0.10.0 | `ROADMAP.md` |

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

- Host Compatibility Rail;
- OpenCode, Antigravity, Deep Agents-style and generic host exports;
- host capability matrix;
- read-only MCP host manifests.

### v1.2.0

Focus:

- Spec, Design And Diagram Rail;
- PRD/requirements/design/tasks scaffolds;
- local `DESIGN.md` lint/diff/export;
- Mermaid render/diff validation.

### v1.3.0

Focus:

- Knowledge Graph Rail;
- graph build/explain/impact/tour;
- local dashboard graph views;
- stale-edge detection.

### v1.4.0

Focus:

- Skill Rail 2.0;
- domain skill templates;
- skill lint/eval/report;
- role-aware exports and safety gates.

### v1.5.0

Focus:

- Governance And Cost Rail;
- context budget reports;
- dynamic workflow guardrails;
- MCP/skill exposure risk summaries.


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
- `docs/roadmap-agent-runtime-addendum.md`
- `docs/memory-rail.md`
- `docs/harness-rail.md`
- `docs/policy-rail.md`
- `docs/diagram-rail.md`
- `docs/structured-payload-rail.md`
- `docs/agent-docs-hygiene.md`
- `docs/filesystem-evidence-rail.md`
- `docs/evaluation-suite.md`
- `docs/workflow-rail.md`
- `docs/context-packs.md`
- `docs/spec-driven-workflow.md`
- `docs/security-model.md`
- `docs/rules.md`
- `docs/benchmarking.md`
- `docs/metrics.md`
- `docs/mcp.md`
- `docs/agents.md`
- `docs/ecosystem-influences.md`
- `docs/comparisons.md`
- `docs/roadmap-harness-diagram-payload-addendum.md`
