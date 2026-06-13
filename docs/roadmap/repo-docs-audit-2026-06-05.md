# Repository Documentation Audit - 2026-06-05

This audit records the documentation consistency check after the 2026 agent-harness synthesis update.

## Scope

Checked areas:

- main docs entry points: `README.md`, `ROADMAP.md`, `CHANGELOG.md`;
- planning parents: `docs/roadmap/future-rails-index.md`, `docs/ecosystem/ecosystem-influences.md`, `docs/ecosystem/external-projects-audit.md`;
- old related docs: workflow, context packs, report, observability, host docs, evaluation, harness, skills and governance;
- new future rails: Agent QA, Evidence/Provenance, Agent Governance, Harness Lifecycle, Knowledge, Resilience, Host Router and Tasklet;
- examples under `examples/workflows/`.

## Result

The 2026 ideas are now represented as documentation and roadmap items, not as implemented runtime features.

Confirmed coverage:

- QA/eval/golden checks are covered by `docs/rails/evaluation/agent-qa-rail.md`, `docs/rails/evaluation/eval-datasets.md`, `docs/rails/evaluation/golden-agent-tests.md` and `docs/rails/evaluation/llm-as-judge-policy.md`.
- Validate/fix/verify/report pipeline ideas are covered by `docs/architecture/observability-rail.md`, `docs/rails/harness/workflow-rail.md` and `examples/workflows/agent-pipeline-workflow.md`.
- OpenTracy-style trace, ledger, boundary, experiments and approval ideas are covered by `docs/rails/governance/agent-governance-rail.md`.
- Harness engineering lifecycle is covered by `docs/rails/harness/harness-lifecycle-rail.md` and linked from `docs/rails/harness/harness-rail.md` and `docs/rails/harness/workflow-rail.md`.
- ECC-style host/profile/doctor/audit/skills ideas are covered across `docs/roadmap/future-rails-index.md`, `docs/rails/hosts/host-compatibility-rail.md`, `docs/rails/hosts/agent-hosts.md` and `docs/rails/skills/skill-rail-2.md`.
- Feynman-style provenance is covered by `docs/rails/evidence/evidence-provenance-rail.md` and linked from Report and Workflow docs.
- book-to-skill-style document-to-skill packs are covered by `docs/rails/knowledge/knowledge-rail.md`, `docs/rails/context/context-packs.md` and `docs/rails/skills/skill-rail-2.md`.
- Tasklet ideas are covered by `docs/rails/tasklets/tasklet-rail.md` and linked from Context/Workflow/Skill planning docs.
- 9Router ideas are safely mapped to `docs/rails/hosts/host-router-rail.md`, without proxy, MITM, quota bypass or credential-routing scope.

## Link Check

Local Markdown links were checked after this update. No broken local Markdown links were found.

## Boundaries Confirmed

The documentation keeps the following boundaries explicit:

- SotuRail is not SoturAI and does not contain trading/backtest/market-agent scope.
- SotuRail is not a model provider, model router, proxy, MITM bridge or quota-bypass tool.
- SotuRail remains local-first and provider-agnostic by default.
- Optional LLM-as-judge and provider-backed checks are not default release gates.
- Future self-improvement/governance loops require deterministic evals and human approval.
- Security-oriented skills must stay defensive, scoped, evidence/report-focused and non-operational.

## Remaining Work

This audit does not claim the planned rails are implemented. The next work is code, fixtures and tests for the staged roadmap:

- v1.1.1: docs polish, golden export checks and examples;
- v1.2.0: harness lifecycle/session/feature commands;
- v1.3.0: knowledge, evidence and local evaluation artifacts;
- v1.4.0: Skill Rail 2.0 and tasklets;
- v1.5.0: governance, cost, resilience and host-router reports;
- v1.6.0: trace, ledger, approval gates and experiment workflow.
