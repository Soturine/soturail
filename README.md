<p align="center">
  <img src="docs/assets/soturail-fox.svg" alt="SotuRail fox logo" width="180" />
</p>

# SotuRail

[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-3c873a)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](tsconfig.json)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![CI](https://github.com/Soturine/soturail/actions/workflows/ci.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/soturail.svg)](https://www.npmjs.com/package/soturail)
[![npm downloads](https://img.shields.io/npm/dm/soturail.svg)](https://www.npmjs.com/package/soturail)
[![local-first](https://img.shields.io/badge/local--first-yes-f97316)](docs/security-model.md)
[![context-engineering](https://img.shields.io/badge/context--engineering-SotuRail-7c3aed)](docs/prompt-caching.md)

SotuRail — Local-first context rails for AI coding agents.
SotuRail — trilhos locais de contexto para agentes de IA.

## 1. What Is SotuRail?

SotuRail is a local-first Context OS for AI coding agents such as Claude Code, Codex CLI, Gemini CLI, Cursor, Antigravity-style hosts and similar tools.

It wraps a repository and terminal session with reversible evidence rails: heuristic repo maps, progressive file reading, safe command execution, raw log recovery, reducers, prompt-cache-friendly blocks, Spec-Driven Development artifacts, local memory, hooks, benchmarks, rules extraction, context packs, agent exports and workflow records.

SotuRail is not the agent, not a Claude-only harness, not a Mermaid-only workflow tool and not a heavy production gateway. It is the local rail layer that helps agents work with better context, safer logs, smaller prompts, approved memory, structured payloads, diagrams, policies and auditable workflows.

## Project Status

v1.0.0 freezes the first stable local Context OS surface for AI coding agents. The stable surface covers status, reports, dashboard, observability, Project Brain, evaluation, benchmarks, native candidate reporting, baseline snapshots, release checks, workflow/harness/diagram rails, agent exports and read-only MCP report resources.

Experimental rails remain available but are not part of the stable contract until promoted. SotuRail does not add cloud telemetry, a required dashboard server, destructive MCP tools or a native-only runtime. TypeScript remains the portable fallback. See [ROADMAP.md](ROADMAP.md), [docs/v1-contract.md](docs/v1-contract.md), [docs/schema-contracts.md](docs/schema-contracts.md), [docs/stable-command-surface.md](docs/stable-command-surface.md) and [docs/future-rails-index.md](docs/future-rails-index.md).

## v0.5.x MVP Rails

```bash
soturail memory remember "Decision: keep MCP read-oriented by default" --tag architecture
soturail memory recall "MCP safety" --limit 5
soturail context select --query "prepare npm release"
soturail context budget --target claude --explain
soturail context pack --role reviewer
soturail harness contract init
soturail policy doctor
soturail fs snapshot
soturail mcp exposure
soturail run workspace new "Try v0.5.x rails"
soturail native doctor
soturail validate json package.json --strict
soturail format compare README.md
```

These rails write local JSON, JSONL and Markdown under `.soturail/`. They do not create cloud resources, background agents, global config writes or arbitrary MCP shell execution.

## v0.6.0 Agent Runtime Adapter

```bash
soturail agents capabilities
soturail agents capabilities --json
soturail agents status
soturail agents status --json
soturail agents doctor --verbose
soturail agents install --agent claude --dry-run
soturail agents install --agent cursor --dry-run
soturail agents install --agent gemini --dry-run
soturail agents export --agent deepagents
soturail agents export --agent deepagents-js
```

The adapter is host-aware but conservative. It reports real, experimental, prompt-only and planned surfaces for Claude Code, Codex, Gemini CLI, Cursor, Antigravity, Generic, OpenCode/Amp/Kiro-style hosts and Deep Agents-style targets. Dry-run installs show planned file writes, backups, context references, payload recommendations and policy warnings before anything changes.

## v0.6.1 Evaluation Suite

```bash
soturail eval list
soturail eval run
soturail eval report
```

The evaluation suite is deterministic and local. It checks memory recall, context selection, reducers, routing, role packs, agent-doc hygiene, offload/restore, payload formats, strict JSON validation, evidence packs, harness scenarios and Diagram Rail validation seeds. Reports are written to `.soturail/eval/latest.json` and `.soturail/eval/latest.md`.

Token savings alone are not treated as success. The suite checks whether important files, commands, errors, policy decisions and recovery pointers survive compression and selection. See [docs/evaluation-suite.md](docs/evaluation-suite.md).

## v0.7.0 Workflow, Harness And Diagram Rails

```bash
soturail workflow setup
soturail workflow plan "Implement feature"
soturail workflow work --note "Implemented the first slice"
soturail workflow review --all
soturail workflow verify
soturail workflow evidence <id>
soturail workflow diagram <id>

soturail diagram init
soturail diagram new "Feature flow"
soturail diagram audit docs/diagrams/feature-flow.md
soturail diagram validate
soturail diagram from-workflow <id>
```

Workflow Rail 2.0 writes local plan/work/review/verify artifacts under `.soturail/workflows/`. Harness Rail connects repeated failures and acceptance contracts to verification and evidence. Diagram Rail writes text-based Mermaid diagrams and `.spec.md` visual contracts under `docs/diagrams/` and `.soturail/diagrams/`.

Release notes now live under `docs/releases/`, and release evidence points to `docs/releases/RELEASE_NOTES_vX.Y.Z.md`.

## v0.8.x Verified Project Brain

```bash
soturail brain init
soturail brain scan
soturail brain consolidate --dry-run
soturail brain profile
soturail brain recall "release notes"
soturail brain stale --repair-plan
soturail brain doctor --repair-plan
soturail brain export --agent codex --limit 10

soturail reverse scan ./src
soturail reverse claims ./src
soturail reverse specs ./src
soturail reverse gaps
soturail reverse export --target agent

soturail rules from-brain
soturail eval run --suite brain
```

Project Brain stores source-backed knowledge under `.soturail/brain/` using JSONL records for claims, decisions, bugs, gaps, rules and stale events, JSON views for current state and Markdown briefs for agent handoff.

Reverse Specification Rail extracts deterministic claims and draft specs from local source/docs/tests. It does not call an LLM, use embeddings, require a database or send project data to a network service.

v0.8.1 improves trust in that brain: stale detection can report relocated ranges, `brain consolidate --dry-run` groups duplicate claims without deleting history, repair plans explain safe human follow-up and agent briefs separate verified, suspect and stale records.

## v0.9.0 Benchmark-Gated Native/Performance Engine

```bash
soturail bench list
soturail bench run --suite brain
soturail bench run --suite reducers
soturail bench run --suite filesystem
soturail bench compare
soturail bench report

soturail native candidates
soturail native status
soturail native doctor
soturail native compare

soturail self baseline --check
soturail self baseline --zip
soturail self baseline --bundle
soturail self baseline --pack
```

v0.9.0 adds stable local benchmark reports under `.soturail/bench/`, native candidate reports under `.soturail/native/` and baseline snapshot reports under `.soturail/baselines/`.

The rule is simple: no benchmark, no native rewrite. SotuRail does not claim native speedups unless a local benchmark report proves them. Native acceleration is optional; TypeScript remains the portable baseline and normal npm installs do not require Rust.

## v0.10.x Local Reports, Observability And Dashboard

```bash
soturail status --json
soturail status --md
soturail status --agent

soturail report build
soturail report latest
soturail report export --format html
soturail report doctor
soturail report redact
soturail report github-summary
soturail report agent --agent codex
soturail report diff

soturail dashboard build
soturail dashboard doctor

soturail obs collect
soturail obs summary
soturail obs timeline
soturail obs export

soturail mcp resources report

soturail self schemas --check
soturail self schemas --check --json
soturail self readiness --v1
soturail self readiness --v1 --json
```

v0.10.0 writes local status artifacts under `.soturail/status/`, local reports under `.soturail/reports/`, a static dashboard under `.soturail/dashboard/`, observability events under `.soturail/observability/` and read-only MCP report resources under `.soturail/mcp/report-resources.json`.

v0.10.1 hardens those artifacts: every `--json` output is parseable by `JSON.parse`, report diff and doctor output are more actionable, observability de-duplicates repeated local events, and schema/readiness reports are written under `.soturail/schemas/` and `.soturail/readiness/`.

SotuRail reports are local artifacts. They are designed for humans, CI and coding agents. They do not upload telemetry or require a dashboard server.

## v1.0.0 Stable Context OS Surface

```bash
soturail status --json
soturail report build
soturail dashboard build
soturail obs summary
soturail self schemas --check --strict
soturail self readiness --v1 --strict
soturail self code-health
soturail self architecture --check
soturail agents matrix
soturail release check --strict
```

v1.0.0 adds strict schema/readiness/release gates, lightweight code-health and architecture checks, a documented v1 contract, a host compatibility matrix and a golden smoke suite for stable commands. See [docs/quickstart.md](docs/quickstart.md), [docs/v1-contract.md](docs/v1-contract.md), [docs/schema-contracts.md](docs/schema-contracts.md), [docs/clean-code-guidelines.md](docs/clean-code-guidelines.md), [docs/architecture-boundaries.md](docs/architecture-boundaries.md) and [docs/agent-hosts.md](docs/agent-hosts.md).

## Why SotuRail Exists

AI coding agents often receive too much unstable context: full files, noisy test logs, repeated terminal output and long conversational summaries. SotuRail is designed to unify those workflows into one independent local-first tool without sending telemetry or inventing provider metrics.

The long-term product direction is simple:

```txt
SotuRail does not replace Claude, Codex, Gemini, Cursor or other agents.
SotuRail prepares the local context, memory, logs, diagrams, policies, payload formats and reports those agents need.
```

## Where It Fits

Useful mental model:

```txt
Hermes-like systems: agent brain and execution loop.
Deep Agents-style systems: batteries-included harness with sub-agents, tools, filesystem, memory and approvals.
Claude Code Harness-style systems: disciplined setup/plan/work/review/release loops with guardrails and evidence.
MDDD-style systems: Mermaid/.spec.md visual contracts before implementation.
Plano-like systems: gateway, router and production data plane.
SotuRail: local Context OS for context, memory, reducers, policy, logs, workflows, diagrams, payload formats and reports.
```

A newer mental model from the v0.5 planning cycle:

```txt
Dense-agent setup: every task gets every instruction, file and rule.
SotuRail setup: route the task to the right local context expert, memory, role pack, rule set, payload format, diagram and workflow evidence.
```

SotuRail absorbs patterns from the context-engineering ecosystem without vendoring or copying adjacent projects. It stays small, local-first, npm-friendly and safe-by-default. Research notes and product ideas live in [docs/ecosystem-influences.md](docs/ecosystem-influences.md), [docs/comparisons.md](docs/comparisons.md), [docs/deep-agents-patterns.md](docs/deep-agents-patterns.md), [docs/future-rails-index.md](docs/future-rails-index.md), [docs/external-projects-audit.md](docs/external-projects-audit.md), [docs/host-compatibility-rail.md](docs/host-compatibility-rail.md), [docs/harness-rail.md](docs/harness-rail.md), [docs/policy-rail.md](docs/policy-rail.md), [docs/diagram-rail.md](docs/diagram-rail.md), [docs/structured-payload-rail.md](docs/structured-payload-rail.md) and [docs/agent-docs-hygiene.md](docs/agent-docs-hygiene.md).

## Built With SotuRail

SotuRail dogfoods itself for release-oriented development. `soturail self all` runs repository checks, indexing, build, tests, benchmarks and a local Markdown report through SotuRail's own rails.

```bash
soturail self doctor
soturail self index
soturail self build
soturail self test
soturail self bench
soturail self report
soturail self all
```

Reports are written to `.soturail/reports/self-dogfood.md` with stable project context first and dynamic raw IDs, command status and benchmark data later.

## Key Features

- Heuristic Repo Map with cross-platform ignore handling.
- Progressive reader for large files with reversible collapsed ranges.
- Safe tee-stream runner with raw log preservation.
- Git, test, npm, TypeScript, Docker, ESLint, Java/Maven/Gradle, build, JSON and generic terminal reducers.
- Cross-call and block-level dedupe for repeated command output.
- Optional Rust native reducer and runner hot paths with TypeScript fallback.
- Reproducible local benchmark suite.
- Agent response compression modes.
- Knowledge-to-Rules ingestion and validators.
- Prompt-only and hook-style agent integrations.
- Agent exports for Claude, Codex, Gemini, Cursor, Antigravity and generic hosts.
- MCP-compatible local stdio server and config helpers.
- Workflow Rail for local task records, phase evidence and optional worktree planning.
- Memory Rail with explicit local records, recall, capture and consolidation.
- Context Intelligence with selection, pruning, budget reports, offload/restore and role packs.
- Harness, Policy, Filesystem Evidence, Diagram and Run Workspace rails.
- MCP exposure reports and skill routing seeds.
- Agent docs hygiene checks for short root instruction files.
- SDD specs, approved memory and cache block normalization.
- Honest local metrics.

## Planned Next Features

Post-v1 work is staged so the stable Context OS surface stays reliable:

- v1.1.0 Host Compatibility Rail;
- v1.2.0 Spec, Design And Diagram Rail;
- v1.3.0 Knowledge Graph Rail;
- v1.4.0 Skill Rail 2.0;
- v1.5.0 Governance And Cost Rail.

These are not v1.0.0 stable contracts until promoted.

## Future Rails Documentation

Future planning is split across focused docs so the roadmap does not become the only source of truth:

- [Future Rails Index](docs/future-rails-index.md)
- [Harness Rail](docs/harness-rail.md)
- [Policy Rail](docs/policy-rail.md)
- [Diagram Rail](docs/diagram-rail.md)
- [Structured Payload Rail](docs/structured-payload-rail.md)
- [Agent Docs Hygiene](docs/agent-docs-hygiene.md)
- [Evaluation Suite](docs/evaluation-suite.md)
- [Project Brain](docs/project-brain.md)
- [Reverse Specification Rail](docs/reverse-specification-rail.md)
- [Knowledge To Rules](docs/knowledge-to-rules.md)
- [Benchmarking](docs/benchmarking.md)
- [Native Performance Policy](docs/native-performance-policy.md)
- [Baseline Snapshots](docs/baseline-snapshots.md)
- [Status Command](docs/status-command.md)
- [Report Rail](docs/report-rail.md)
- [Dashboard Rail](docs/dashboard-rail.md)
- [Observability Rail](docs/observability-rail.md)
- [Quickstart](docs/quickstart.md)
- [v1 Contract](docs/v1-contract.md)
- [Schema Contracts](docs/schema-contracts.md)
- [Stable Command Surface](docs/stable-command-surface.md)
- [Agent Hosts](docs/agent-hosts.md)
- [Clean Code Guidelines](docs/clean-code-guidelines.md)
- [Architecture Boundaries](docs/architecture-boundaries.md)
- [Agent-Readable Reports](docs/agent-readable-reports.md)
- [MCP Report Resources](docs/mcp-report-resources.md)
- [Report Redaction](docs/report-redaction.md)
- [Code Graph Seed](docs/code-graph.md)
- [Roadmap Addendum](docs/roadmap-harness-diagram-payload-addendum.md)
- [External Projects Audit](docs/external-projects-audit.md)
- [Host Compatibility Rail](docs/host-compatibility-rail.md)
- [Design Rail](docs/design-rail.md)
- [Knowledge Graph Rail](docs/knowledge-graph-rail.md)
- [Skill Rail 2.0](docs/skill-rail-2.md)
- [Governance And Cost Rail](docs/governance-cost-rail.md)
- [Roadmap Docs Audit](docs/roadmap-docs-audit.md)

## Installation

Use directly with npx:

```bash
npx soturail --help
npx soturail@latest --help
```

Install globally:

```bash
npm install -g soturail
soturail --help
soturail --version
```

Install the stable v1 release exactly with:

```bash
npm install -g soturail@1.0.0
```

For local development from source:

```bash
npm install
npm run build
npm link
soturail --help
```

Rust is optional. TypeScript builds do not require Rust.

```bash
npm run build:native   # optional, requires cargo
npm run build:all      # TypeScript + native, requires cargo
```

npm package: https://www.npmjs.com/package/soturail

## Quick Start

```bash
soturail init
soturail index
soturail read README.md --query "quick start"
soturail context pack --target all
soturail agents doctor
soturail agents export --agent all
soturail mcp smoke
soturail workflow new "Try SotuRail"
soturail skills init demo-skill
soturail skills validate
soturail run npm test
soturail expand <raw_id>
soturail stats
```

For an installed clean-folder walkthrough, see [docs/first-real-workflow.md](docs/first-real-workflow.md).

## First Clean Project Flow

```bash
soturail init
soturail memory doctor
soturail context budget --explain
soturail context pack --role planner
soturail harness doctor
soturail policy doctor
soturail run workspace new "Try SotuRail"
soturail context pack --target all
soturail agents doctor
soturail agents export --agent all
soturail mcp smoke
soturail workflow new "Try SotuRail"
soturail workflow list
```

`soturail init` scaffolds agent, MCP, context pack, hook, skill and workflow examples without overwriting user-edited files.

## Agent Setup Tutorials

- [Claude Code](docs/tutorial-claude-code.md)
- [Codex](docs/tutorial-codex.md)
- [Gemini CLI](docs/tutorial-gemini-cli.md)
- [Cursor](docs/tutorial-cursor.md)
- [Antigravity prompt-only](docs/tutorial-antigravity.md)
- [Deep Agents-style role packs](docs/tutorial-deep-agents-role-packs.md)
- [Harness workflow](docs/tutorial-harness-workflow.md)
- [Diagram specs](docs/tutorial-diagram-spec.md)
- [Context formats](docs/tutorial-context-formats.md)

## Commands

```bash
soturail init
soturail index
soturail read <file> --query "goal"
soturail run --engine auto <command...>
soturail run --similar-dedupe conservative npm test
soturail run --engine native <command...>
soturail expand <raw_id>
soturail expand <raw_id> --allow-raw --yes
soturail dedupe stats
soturail bench prepare
soturail bench run --engine ts
soturail bench list
soturail bench run --suite brain
soturail native candidates
soturail self baseline --check
soturail hooks list
soturail agents list
soturail agents doctor
soturail agents export --agent all
soturail mcp smoke
soturail mcp config --agent generic
soturail context pack --target all
soturail context pack --role planner
soturail context select --query "release checklist"
soturail context budget --explain
soturail workflow list
soturail workflow show <id>
soturail workflow close <id>
soturail brain scan
soturail brain consolidate --dry-run
soturail brain recall "release notes"
soturail brain stale --repair-plan
soturail brain export --agent codex --limit 10
soturail reverse specs ./src
soturail rules from-brain
soturail eval run --suite brain
soturail run workspace show <run-id>
soturail format README.md --mode concise
soturail format compare README.md
soturail validate json package.json --strict
soturail ingest README.md --type docs
soturail rules check
soturail skills init demo-skill
soturail skills validate
soturail skills export --target claude
soturail spec status
soturail memory propose "decision"
soturail doctor cache
```

## Release Workflow

Release automation is local-first and conservative:

```bash
npm run release:check
npm run release:publish -- X.Y.Z
npm run release:github -- X.Y.Z
npm run release:full -- X.Y.Z --publish-npm --github-release
```

The release commands accept a positional version, `--target-version X.Y.Z`, or the backward-compatible `--version X.Y.Z` option. The release script never runs `npm audit fix --force`, never publishes when build/tests/runtime audit fail and never creates a GitHub release before npm publish succeeds. See [docs/release-workflow.md](docs/release-workflow.md).

Release verification installs the packed `.tgz` into a clean temporary project and executes `node_modules/soturail/dist/cli.js` directly to avoid npm cache or global CLI false positives.

```bash
npm run build
npm test
npm run release:check
npm pack --dry-run
```

## Agent Integrations

SotuRail provides reviewed agent integration profiles for Claude, Codex, Gemini, Cursor, Antigravity and generic agents.

```bash
soturail agents list
soturail agents doctor
soturail agents export --agent all
soturail agents install --agent claude --mode mcp --dry-run
soturail agents install --agent cursor --mode rules --dry-run
```

Exports live under `.soturail/exports/agents/`. Install commands are dry-run-first, backup-first and project-local by default. SotuRail does not auto-enable arbitrary shell execution or unknown global host configs.

## MCP And Context Packs

SotuRail exposes local context through a minimal MCP-compatible stdio server and cache-friendly context packs.

```bash
soturail mcp doctor
soturail mcp manifest
soturail mcp serve --transport stdio
soturail mcp smoke
soturail context pack --target claude
soturail context pack --target codex
soturail context pack --target gemini
soturail context pack --target cursor
soturail context pack --target antigravity
soturail context pack --target generic
soturail context pack --target all
soturail context explain
```

MCP does not expose arbitrary shell execution. Raw log expansion redacts probable secrets unless raw output is explicitly requested.

Context packs are written to `.soturail/context/<target>-context.md`. JSON-RPC examples live under [examples/mcp](examples/mcp).

Role packs, structured payload validation and offload flows are tracked in [docs/context-packs.md](docs/context-packs.md), [docs/structured-payload-rail.md](docs/structured-payload-rail.md) and [docs/deep-agents-patterns.md](docs/deep-agents-patterns.md).

## Workflow Rail

Workflow Rail stores local task state under `.soturail/workflows/` and can optionally plan Git worktree isolation. v0.7.0 adds phase artifacts for setup, plan, work, review, verify and evidence.

```bash
soturail workflow setup
soturail workflow plan "Implement feature"
soturail workflow work --note "Progress note"
soturail workflow review --all
soturail workflow verify
soturail workflow evidence <id>
soturail workflow diagram <id>
soturail workflow new "Implement feature"
soturail workflow list
soturail workflow show <id>
soturail workflow close <id>
soturail workflow start <id> --worktree --dry-run
```

SotuRail does not push, merge or delete worktrees automatically.

Harness-style phases and diagram-driven workflows are documented in [docs/workflow-rail.md](docs/workflow-rail.md), [docs/harness-rail.md](docs/harness-rail.md) and [docs/diagram-rail.md](docs/diagram-rail.md).

## Skill Rail

Skill Rail creates, validates, exports and packs safe local agent skills without depending on external skill ecosystems.

```bash
soturail skills init demo-skill
soturail skills list
soturail skills validate
soturail skills export --target claude
soturail skills pack --format markdown
```

Exports are written under `.soturail/exports/skills/` and should be reviewed before enabling in an agent host. Examples live under [examples/skills](examples/skills).

Future task/role-aware skill routing is tracked in [docs/skill-rail.md](docs/skill-rail.md).

## Reducers And Dedupe

v0.3.2 added stronger reducers for common developer commands including `npm install`, `npm test`, Vitest, `tsc`, `git diff`, `git status`, Docker logs, ESLint, Vite/Next build output and Java/Maven/Gradle failures. Reducers preserve errors, warnings, file paths, line/column references, stack traces, security warnings and the raw recovery hint.

Block-level dedupe is conservative by default. It can replace repeated safe blocks with references such as `[deduped block: ...]`, while preserving error blocks and current failure context. Similar-output dedupe is experimental and opt-in:

```bash
soturail run --similar-dedupe conservative npm test
soturail dedupe stats
```

## Benchmarks And Honest Metrics

SotuRail includes deterministic local fixtures for terminal compression, agent response compression, JSON/tool payload compression, Knowledge-to-Rules structuring, dedupe and native performance readiness.

```bash
npm run build
soturail bench prepare
soturail bench run --engine ts
soturail bench run --suite brain
soturail native candidates
soturail self baseline --check
soturail bench report
```

The latest report is written to [benchmarks/reports/latest.md](benchmarks/reports/latest.md). External comparisons are optional and user-provided only.

Local token counts are deterministic estimates. SotuRail reports raw payload tokens, reduced payload tokens, metadata overhead and net estimated tokens. For tiny outputs, compression may be ineffective once recovery metadata is included; SotuRail says that directly while preserving raw recovery paths.

Benchmark Rail 2.0 writes `.soturail/bench/latest.json`, `.soturail/bench/latest.md` and versioned reports such as `benchmarks/reports/bench-v1.0.0.json`. It covers `brain-scan`, `brain-stale`, `brain-consolidate`, `reverse-claims`, `reducer-large-log`, `jsonl-read-write`, `range-hash`, `file-scan`, `workflow-evidence`, `format-compare`, `json-validate` and `release-preflight`.

## Knowledge-to-Rules Engine

SotuRail can ingest Markdown, TXT, JSON and YAML into structured YAML/JSON rules, checklists, citations and simple validators.

```bash
soturail ingest docs/requirements.md --type requirements
soturail rules list
soturail rules check
soturail rules export --format yaml
```

This makes heavy docs smaller, reusable and auditable without inventing rules that do not appear in the source. See [docs/knowledge-to-rules.md](docs/knowledge-to-rules.md), [docs/rules.md](docs/rules.md) and [docs/policy-rail.md](docs/policy-rail.md).

## Prompt Caching Design

Stable blocks are ordered before dynamic data:

1. static_header
2. governance
3. config
4. repo_map
5. approved_specs
6. approved_memory
7. dynamic_footer

SotuRail reports estimated cache stability only. It never claims real provider cache hits unless imported metadata exists.

## Native Performance Path

TypeScript remains the public CLI, orchestration, docs and npm distribution layer. Rust handles optional hot paths where streaming, low overhead and binary execution matter:

- native terminal reducers;
- native JSON/tool payload reducer;
- native tee-stream runner with raw log and summary sidecar support.

SotuRail does not claim native speedups unless local benchmark results show them for your machine.

## Security Model

`soturail run` blocks dangerous patterns by default, including `rm -rf`, `sudo`, `format`, `dd if=`, `curl | sh`, `del /s` and `git push`.

Raw logs may contain secrets because they preserve real terminal output. Treat `.soturail/raw/` as local evidence, not public artifact material. `soturail expand <raw_id>` redacts probable secrets by default; use `--allow-raw --yes` only when you intentionally need exact raw output.

Policy queue, auth guidance and MCP exposure reports are tracked in [docs/policy-rail.md](docs/policy-rail.md) and [docs/security-model.md](docs/security-model.md).

## Migration

Moving from v0.4.x to v0.5.x keeps the agent export, MCP and Workflow Rail commands, then adds local `.soturail/` folders for Memory, Context Intelligence, Harness, Policy, Filesystem Evidence and Run Workspace seeds. See [docs/migration-v0.5.md](docs/migration-v0.5.md).

## Windows Notes

Windows users should see [docs/windows.md](docs/windows.md) for CMD vs PowerShell quoting, global install, `npx`, local tarball testing and common paste mistakes such as copying Markdown code-fence labels into CMD.

## Comparison Philosophy

SotuRail is inspired by the broader context-engineering ecosystem, including terminal reducers, agent response compression, spec-driven workflows, local memory, rules extraction, hooks, benchmarks, skill registries, agent memory, harness workflows, Mermaid diagram-driven development, structured prompt payloads and gateway/observability ideas. SotuRail does not vendor or depend on those projects. It aims to unify similar ideas into one local-first workflow while keeping benchmarks honest. See [docs/comparisons.md](docs/comparisons.md), [docs/ecosystem-influences.md](docs/ecosystem-influences.md), [docs/deep-agents-patterns.md](docs/deep-agents-patterns.md) and [docs/future-rails-index.md](docs/future-rails-index.md).

## Roadmap

See [ROADMAP.md](ROADMAP.md).

Near-term direction:

```txt
v0.5.0  Memory Rail + Context Intelligence + Role Packs + Harness/Policy seeds + reliability
v0.5.1  Memory/context polish + Structured Payload Rail + Agent Docs Hygiene + Diagram docs
v0.5.2  CI stabilization + lightweight quality fixtures + roadmap realignment
v0.6.0  Real agent runtime integration + host capability matrix + host-aware payload/policy docs
v0.6.1  Agent UX polish + full evaluation suite
v0.7.0  Workflow Rail 2.0 + Harness Rail + Diagram Rail + .spec.md visual contracts
v0.8.0  Verified Project Brain + Reverse Specification Rail
v0.8.1  Project Brain polish, stale-evidence quality and agent-brief improvements
v0.9.0  Benchmark-gated native/performance engine
v0.10.0 Local reports, observability timeline and static dashboard
v0.10.1 Stability, JSON validity, report polish and v1 readiness
v1.0.0  Stable Context OS surface and strict contracts
v1.1.0  Host Compatibility Rail
v1.2.0  Spec, Design And Diagram Rail
v1.3.0  Knowledge Graph Rail
v1.4.0  Skill Rail 2.0 And Domain Skill Packs
v1.5.0  Governance And Cost Rail
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Reducers, hooks and rules should include tests, safety notes and benchmark impact when relevant.

## License

SotuRail is licensed under the [Apache License 2.0](LICENSE).

This means you can use, copy, modify, distribute and build on the project under the Apache-2.0 terms, including commercial use, as long as the license notice is preserved.

Older releases remain governed by the license terms that applied at the time of each release.

See [docs/licensing-strategy.md](docs/licensing-strategy.md).
