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
| Evaluation Suite | Quality benchmarks for context, payload formats, diagrams, evidence and role packs | v0.5.2 | `docs/evaluation-suite.md`, `docs/benchmarking.md`, `ROADMAP.md` |
| Reverse Specification Rail | Turn existing code/docs/config/logs into claims, rules, specs, gaps and validation tasks | v0.8.0 primary, v0.5.x design | `docs/roadmap-agent-runtime-addendum.md`, `docs/knowledge-to-rules.md` |
| Project Brain | Docs, diagrams, decisions, recurring bugs and release history | v0.8.0 | `ROADMAP.md` |
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

- evaluation suite;
- memory recall quality;
- context selection quality;
- context budget quality;
- role-pack quality;
- skill-routing quality;
- MCP exposure report quality;
- format quality: Markdown vs tagged vs JSON vs compact formats;
- strict JSON fixtures;
- evidence-pack completeness;
- filesystem evidence quality;
- harness scenario fixtures;
- acceptance-contract fixtures;
- diagram validation fixtures.

### v0.6.0

Focus:

- real agent runtime integration;
- host capability matrix;
- Agent Runtime Adapter;
- prompt-only fallbacks;
- agent-specific docs for context, rules, hooks, skills, settings and policy;
- optional compatibility notes for Claude Code Harness-style workflows.

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

- Knowledge Rail;
- Reverse Specification Rail;
- Project Brain;
- diagrams and specs as part of project memory;
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

## What Should Not Happen

SotuRail should not become:

- a Claude-only plugin;
- a Mermaid-only CLI;
- a heavy production gateway;
- a LangChain/LangGraph/Deep Agents clone;
- a Leoflow/Airflow clone;
- a Kubernetes volume orchestrator;
- a tool that claims token savings without quality checks;
- a tool that exposes arbitrary shell execution through MCP by default.

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
