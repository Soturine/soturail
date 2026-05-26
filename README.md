<p align="center">
  <img src="docs/assets/soturail-fox.svg" alt="SotuRail fox logo" width="180" />
</p>

# SotuRail

[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-3c873a)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](tsconfig.json)
[![License: Reserved Rights](https://img.shields.io/badge/license-reserved--rights-red)](LICENSE)
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

v0.6.1 is the Agent UX Polish and Full Local Evaluation Suite milestone. TypeScript mode is stable for local usage. Native Rust mode remains optional and focused on hot paths. Skill Rail, MCP, context packs, agent exports, Workflow Rail, Memory Rail, Context Intelligence, Policy Rail, evidence seeds, the host-aware Agent Runtime Adapter and the local evaluation suite are local-first and benchmarkable. External comparisons are optional and user-provided.

The next product direction is staged: v0.7.0 deepens Workflow Rail, Harness Rail and Diagram Rail without turning SotuRail into an autonomous agent runtime. See [ROADMAP.md](ROADMAP.md) and [docs/future-rails-index.md](docs/future-rails-index.md).

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

SotuRail absorbs patterns from the context-engineering ecosystem without vendoring or copying adjacent projects. It stays small, local-first, npm-friendly and safe-by-default. Research notes and product ideas live in [docs/ecosystem-influences.md](docs/ecosystem-influences.md), [docs/comparisons.md](docs/comparisons.md), [docs/deep-agents-patterns.md](docs/deep-agents-patterns.md), [docs/future-rails-index.md](docs/future-rails-index.md), [docs/harness-rail.md](docs/harness-rail.md), [docs/policy-rail.md](docs/policy-rail.md), [docs/diagram-rail.md](docs/diagram-rail.md), [docs/structured-payload-rail.md](docs/structured-payload-rail.md) and [docs/agent-docs-hygiene.md](docs/agent-docs-hygiene.md).

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
- Workflow Rail for local task records and optional worktree planning.
- Memory Rail with explicit local records, recall, capture and consolidation.
- Context Intelligence with selection, pruning, budget reports, offload/restore and role packs.
- Harness, Policy, Filesystem Evidence and Run Workspace seeds.
- MCP exposure reports and skill routing seeds.
- Agent docs hygiene checks for short root instruction files.
- SDD specs, approved memory and cache block normalization.
- Honest local metrics.

## Planned Next Features

The next roadmap stage strengthens Workflow Rail, Harness Rail and Diagram Rail:

- Workflow templates for idea, PRD, tasks, TDD, review and release.
- Deeper Harness Rail guidance for repeated agent failures.
- Diagram Rail commands for `.spec.md` visual contracts and workflow diagrams.
- Release/workflow evidence reports that connect tests, build, audit, pack, raw IDs and policy decisions.
- Trace and Report Rails: local records of commands, raw IDs, context packs, memory recall, diagrams, policy decisions and workflow state.
- Future local UI/report mode: HTML reports first, Mermaid rendering and MCP Apps/AG-UI-style event surfaces later.

## Future Rails Documentation

Future planning is split across focused docs so the roadmap does not become the only source of truth:

- [Future Rails Index](docs/future-rails-index.md)
- [Harness Rail](docs/harness-rail.md)
- [Policy Rail](docs/policy-rail.md)
- [Diagram Rail](docs/diagram-rail.md)
- [Structured Payload Rail](docs/structured-payload-rail.md)
- [Agent Docs Hygiene](docs/agent-docs-hygiene.md)
- [Evaluation Suite](docs/evaluation-suite.md)
- [Roadmap Addendum](docs/roadmap-harness-diagram-payload-addendum.md)

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

When v0.6.1 is published, install that exact version with:

```bash
npm install -g soturail@0.6.1
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

Workflow Rail stores local task state under `.soturail/workflows/` and can optionally plan Git worktree isolation.

```bash
soturail workflow new "Implement feature"
soturail workflow list
soturail workflow show <id>
soturail workflow close <id>
soturail workflow start <id> --worktree --dry-run
soturail workflow verify <id>
```

SotuRail does not push, merge or delete worktrees automatically.

Future role-phase workflows, harness-style phases and diagram-driven workflows are tracked in [docs/workflow-rail.md](docs/workflow-rail.md), [docs/harness-rail.md](docs/harness-rail.md) and [docs/diagram-rail.md](docs/diagram-rail.md).

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
soturail bench report
```

The latest report is written to [benchmarks/reports/latest.md](benchmarks/reports/latest.md). External comparisons are optional and user-provided only.

Local token counts are deterministic estimates. SotuRail reports raw payload tokens, reduced payload tokens, metadata overhead and net estimated tokens. For tiny outputs, compression may be ineffective once recovery metadata is included; SotuRail says that directly while preserving raw recovery paths.

Future benchmarks will also cover context quality, role-pack quality, diagram validation, evidence-pack completeness and format quality for Markdown vs tagged vs JSON vs compact payloads.

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
v0.8.0  Knowledge Rail and Project Brain with specs, diagrams and recurring failures
v0.9.0  Native Engine Real
v0.10.0 Local reports, traces, Mermaid rendering and dashboard
v1.0.0  Stable Context OS
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Reducers, hooks and rules should include tests, safety notes and benchmark impact when relevant.

## License Status

SotuRail is not currently licensed as open source for the current repository state or future versions.

All rights are reserved unless a later LICENSE file or written agreement explicitly grants permissions. This repository may be public for portfolio, planning, research, documentation and evaluation visibility, but broad copying, redistribution, sublicensing, commercial use or derivative works are not granted by default.

Important: older SotuRail versions or copies that were explicitly released under MIT remain governed by the MIT terms that applied to those specific versions at the time of release.

See [docs/licensing-strategy.md](docs/licensing-strategy.md).
