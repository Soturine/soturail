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

## Planned Rails

| Rail | Purpose | Main version target | Primary docs |
| --- | --- | --- | --- |
| Memory Rail | Store, recall, capture and consolidate approved local memory | v0.5.0+ | `docs/context-packs.md`, `ROADMAP.md` |
| Context Intelligence | Select, prune, route and offload task-specific context | v0.5.0+ | `docs/context-packs.md`, `docs/ecosystem-influences.md` |
| Context Expert Router | Route tasks to code/docs/release/security/workflow/memory/research context experts | v0.5.0+ | `docs/context-packs.md`, `ROADMAP.md` |
| Role Packs | Generate planner/executor/reviewer/release-manager/researcher packs | v0.5.0+ | `docs/context-packs.md`, `docs/workflow-rail.md` |
| Harness Rail | setup/plan/work/review/release discipline, evidence packs and failure ledger | v0.5.0 seeds, v0.7.0 expansion | `docs/harness-rail.md`, `docs/workflow-rail.md` |
| Policy Rail | Rules, approvals, risky action queue, auth checks and MCP exposure reports | v0.5.0+ | `docs/policy-rail.md`, `docs/security-model.md`, `docs/rules.md` |
| Structured Payload Rail | Target-aware Markdown/JSON/tagged/TOON-table/Mermaid context formats | v0.5.1+ | `docs/structured-payload-rail.md`, `docs/context-packs.md` |
| Diagram Rail | Mermaid diagrams and `.spec.md` visual contracts | v0.5.1 docs, v0.7.0 expansion | `docs/diagram-rail.md`, `docs/spec-driven-workflow.md` |
| Agent Docs Hygiene | Keep `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and Cursor rules short and referenced | v0.5.0+ | `docs/agent-docs-hygiene.md` |
| Evidence Pack | Connect build/test/audit/pack/raw IDs/policy decisions/release notes | v0.5.0 seeds, v0.7.0 expansion | `docs/harness-rail.md`, `docs/workflow-rail.md` |
| Evaluation Suite | Quality benchmarks for context, payload formats, diagrams, evidence and role packs | v0.5.2 | `docs/benchmarking.md`, `ROADMAP.md` |
| Project Brain | Docs, diagrams, decisions, recurring bugs and release history | v0.8.0 | `ROADMAP.md` |
| Local Dashboard | Local reports, trace viewer, Mermaid rendering and policy/evidence views | v0.10.0 | `ROADMAP.md` |

## Version Summary

### v0.5.0

Focus:

- Memory Rail;
- Context Intelligence;
- Context Expert Router;
- Role-Based Context Packs;
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
- structured payload docs and examples;
- JSON strict validator planning;
- target-aware context formats;
- Diagram Rail docs and basic validation plan;
- `AUTH.md` scaffold docs if policy/auth-check lands.

### v0.5.2

Focus:

- evaluation suite;
- memory recall quality;
- context selection quality;
- role-pack quality;
- format quality: Markdown vs tagged vs JSON vs compact formats;
- strict JSON fixtures;
- evidence-pack completeness;
- harness scenario fixtures;
- diagram validation fixtures.

### v0.6.0

Focus:

- real agent runtime integration;
- host capability matrix;
- prompt-only fallbacks;
- agent-specific docs for context, rules, hooks and policy;
- optional compatibility notes for Claude Code Harness-style workflows.

### v0.7.0

Focus:

- Workflow Rail 2.0;
- setup/plan/work/review/release phases;
- review perspectives;
- evidence packs;
- Diagram Rail commands;
- `.spec.md` visual contracts;
- workflow/release/policy/MCP/context diagrams.

### v0.8.0

Focus:

- Knowledge Rail;
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
- a tool that claims token savings without quality checks;
- a tool that exposes arbitrary shell execution through MCP by default.

## Related Docs

- `ROADMAP.md`
- `docs/harness-rail.md`
- `docs/policy-rail.md`
- `docs/diagram-rail.md`
- `docs/structured-payload-rail.md`
- `docs/agent-docs-hygiene.md`
- `docs/workflow-rail.md`
- `docs/context-packs.md`
- `docs/spec-driven-workflow.md`
- `docs/security-model.md`
- `docs/rules.md`
- `docs/ecosystem-influences.md`
- `docs/comparisons.md`
- `docs/roadmap-harness-diagram-payload-addendum.md`
