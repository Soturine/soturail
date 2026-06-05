# Agent QA Rail

Agent QA Rail is a proposed future rail for testing SotuRail-generated agent artifacts like software outputs, not magic prompts.

It is inspired by small QA-agent repos that combine automated tests, fixed datasets, scoring, observability and CI. SotuRail should keep the useful discipline while staying local-first, host-independent and deterministic by default.

## Goals

- Test host exports, context packs, skills, rules, workflows, evidence packs and reports.
- Catch regressions in agent-facing files before release.
- Keep default evals offline and cheap.
- Allow optional provider-backed judging only when explicitly requested.
- Generate JSON and Markdown reports that can be attached to release evidence.

## Proposed Commands

```bash
soturail eval dataset init
soturail eval dataset run
soturail eval golden
soturail eval regression
soturail eval report
soturail eval doctor
soturail eval judge --optional
```

These commands can begin as report-only or fixture-only surfaces before becoming full command implementations.

## Local Artifact Layout

```txt
.soturail/evals/
  datasets/
    host-compatibility.json
    context-quality.json
    skill-routing.json
  golden/
    claude-export.md
    codex-export.md
    cursor-rules.md
  runs/
    latest.json
  reports/
    latest.md
```

## Deterministic Checks First

Default checks should not call real LLMs or external services.

Examples:

- export is not empty;
- export contains safe next commands;
- export includes required policy warnings;
- export does not contain secrets;
- export does not contain unrelated project names such as SoturAI when the target is SotuRail;
- JSON artifacts parse successfully;
- duplicate JSON keys are detected where relevant;
- host matrix fields are present;
- MCP exports keep read-only mutation boundaries;
- reports include evidence paths and verification status;
- generated docs keep local-first and no-cloud-by-default claims honest.

## Optional LLM-As-Judge

Provider-backed judges can be useful for hallucination or answer-quality review, but they must not be the default release gate.

Policy:

```txt
Offline fixtures are release-blocking.
LLM-as-judge is optional, explicit and non-blocking unless a project opts in.
Provider outputs must be stored as separate integration evidence.
```

## CI Split

Recommended tiers:

| Tier | Network | Release blocking | Purpose |
| --- | --- | --- | --- |
| unit/offline | no | yes | deterministic docs, schemas, exports and fixtures |
| integration | optional | no by default | provider/API behavior, external host smoke |
| nightly | optional | no by default | long-running or flaky judge/eval experiments |

## Non-Goals

- no required Groq, OpenAI, Anthropic, LangFuse or other provider;
- no real model calls in default tests;
- no scoring metric based only on marketing-friendly numbers;
- no claim that passing evals proves a real agent will always behave well.
