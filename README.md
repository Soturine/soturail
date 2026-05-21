<p align="center">
  <img src="docs/assets/soturail-fox.svg" alt="SotuRail fox logo" width="180" />
</p>

# SotuRail

[![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-3c873a)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](tsconfig.json)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![CI](https://github.com/Soturine/soturail/actions/workflows/ci.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/soturail.svg)](https://www.npmjs.com/package/soturail)
[![npm downloads](https://img.shields.io/npm/dm/soturail.svg)](https://www.npmjs.com/package/soturail)
[![local-first](https://img.shields.io/badge/local--first-yes-f97316)](docs/security-model.md)
[![context-engineering](https://img.shields.io/badge/context--engineering-SotuRail-7c3aed)](docs/prompt-caching.md)

SotuRail — Local-first context rails for AI coding agents.  
SotuRail — trilhos locais de contexto para agentes de IA.

## 1. What Is SotuRail?

SotuRail is a local-first Context OS for AI coding agents such as Claude Code, Codex CLI, Gemini CLI, Cursor and similar tools.

It wraps a repository and terminal session with reversible evidence rails: heuristic repo maps, progressive file reading, safe command execution, raw log recovery, reducers, prompt-cache-friendly blocks, Spec-Driven Development artifacts, local memory, hooks, benchmarks and rules extraction.

## Project Status

v0.3.x is early but functional. TypeScript mode is stable for local usage. Native Rust mode is optional and focused on hot paths. Skill Rail, MCP and context packs are local-first and benchmarkable. External comparisons are optional and user-provided.

## Built With SotuRail

SotuRail now dogfoods itself for release-oriented development. `soturail self all` runs repository checks, indexing, build, tests, benchmarks and a local Markdown report through SotuRail's own rails.

## Self-Dogfooding

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

## Release Workflow

Release automation is local-first and conservative:

```bash
npm run release:check
npm run release:publish -- X.Y.Z
npm run release:github -- X.Y.Z
npm run release:full -- X.Y.Z --publish-npm --github-release
```

The release commands accept a positional version, `--target-version X.Y.Z`, or the backward-compatible `--version X.Y.Z` option. The release script never runs `npm audit fix --force`, never publishes when build/tests/runtime audit fail and never creates a GitHub release before npm publish succeeds. See [docs/release-workflow.md](docs/release-workflow.md).

## Release Reliability

SotuRail includes a release preflight check to prevent stale package metadata, broken npm CLI binaries, missing release notes, and changelog/version mismatches.

```bash
npm run build
npm test
npm run release:check
npm pack --dry-run
```

## 2. Why SotuRail Exists

AI coding agents often receive too much unstable context: full files, noisy test logs, repeated terminal output and long conversational summaries. SotuRail is designed to unify those workflows into one independent local-first tool without sending telemetry or inventing provider metrics.

## 3. Key Features

- Heuristic Repo Map with cross-platform ignore handling.
- Progressive reader for large files with reversible collapsed ranges.
- Safe tee-stream runner with raw log preservation.
- Git, test, JSON and generic terminal reducers.
- Optional Rust native reducer and runner hot paths with TypeScript fallback.
- Cross-call dedupe for repeated command output.
- Reproducible local benchmark suite.
- Agent response compression modes.
- Knowledge-to-Rules ingestion and validators.
- Prompt-only and hook-style agent integrations.
- SDD specs, approved memory and cache block normalization.
- Honest local metrics.

## 4. How It Differs Conceptually

SotuRail is an independent implementation. It may be conceptually adjacent to terminal reducers, host hook systems, Spec-Driven Development kits and memory tools, but it does not depend on RTK, Squeez, Spec Kit, Caveman, MemPalace or proprietary workflows.

SotuRail aims to unify these ideas into one local-first workflow: reversible raw logs, safety policy, benchmarks, prompt cache ordering, specs, memory, hooks and rules.

## 5. Installation

Use directly with npx:

```bash
npx soturail --help
npx soturail@0.3.0 --help
```

Install globally:

```bash
npm install -g soturail
soturail --help
soturail --version
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

## Native Performance Path

TypeScript remains the public CLI, orchestration, docs and npm distribution layer. Rust handles optional hot paths where streaming, low overhead and binary execution matter:

- native terminal reducers;
- native JSON/tool payload reducer;
- native tee-stream runner with raw log and summary sidecar support.

SotuRail does not claim native speedups unless local benchmark results show them for your machine.

## 6. Quick Start

```bash
soturail init
soturail index
soturail read README.md --query "quick start"
soturail context pack --target generic
soturail skills init demo-skill
soturail skills validate
soturail mcp doctor
soturail run npm test
soturail expand <raw_id>
soturail stats
```

For an installed clean-folder walkthrough, see [docs/first-real-workflow.md](docs/first-real-workflow.md).

## 7. Commands

```bash
soturail init
soturail index
soturail read <file> --query "goal"
soturail run --engine auto <command...>
soturail run --engine native <command...>
soturail expand <raw_id>
soturail bench prepare
soturail bench run --engine ts
soturail hooks list
soturail format README.md --mode concise
soturail ingest README.md --type docs
soturail rules check
soturail skills init demo-skill
soturail skills validate
soturail skills export --target claude
soturail context pack --target generic
soturail mcp doctor
soturail spec status
soturail memory propose "decision"
soturail doctor cache
```

## 8. Benchmarks

SotuRail includes deterministic local fixtures for terminal compression, agent response compression, JSON/tool payload compression, Knowledge-to-Rules structuring and native performance readiness.

```bash
npm run build
soturail bench prepare
soturail bench run --engine ts
soturail bench report
```

The latest report is written to [benchmarks/reports/latest.md](benchmarks/reports/latest.md). External comparisons are optional and user-provided only:

```bash
soturail bench compare-optional --tool rtk
soturail bench compare-optional --tool squeez
```

### Benchmark Interpretation

- Terminal compression measures how reducers shrink logs while preserving errors, paths and recovery links.
- Agent response compression measures deterministic formatting modes.
- JSON/tool payload compression preserves relevant primitive values while collapsing repetitive structure.
- Knowledge-to-Rules is reusable structuring, not pure compression; structured rules can be larger than a tiny source document because they add citations and validator metadata.
- Native performance compares Rust and TypeScript only when `soturail-native` is built locally.

## Honest Metrics

Local token counts are deterministic estimates. SotuRail reports raw payload tokens, reduced payload tokens, metadata overhead and net estimated tokens. For tiny outputs, compression may be ineffective once recovery metadata is included; SotuRail says that directly while preserving raw recovery paths.

## 9. Agent Hooks

SotuRail provides cautious hook scaffolding and prompt-only fallbacks:

```bash
soturail hooks list
soturail hooks doctor
soturail hooks install claude --dry-run
soturail hooks prompt-only codex
```

Host APIs vary, so SotuRail never writes guessed config without showing the target and creating backups for existing files.

Review generated hooks before enabling them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.

## Skill Rail

Skill Rail creates, validates, exports and packs safe local agent skills without depending on external skill ecosystems.

```bash
soturail skills init demo-skill
soturail skills list
soturail skills validate
soturail skills export --target claude
soturail skills pack --format markdown
```

Exports are written under `.soturail/exports/skills/` and should be reviewed before enabling in an agent host.

Examples live under [examples/skills](examples/skills).

## MCP And Context Packs

SotuRail exposes local context through a minimal MCP-compatible stdio server and cache-friendly context packs.

```bash
soturail mcp doctor
soturail mcp manifest
soturail mcp serve --transport stdio
soturail context pack --target claude
soturail context pack --target codex
soturail context pack --target gemini
soturail context pack --target cursor
soturail context pack --target generic
soturail context explain
```

MCP does not expose arbitrary shell execution in v0.3.0. Raw log expansion redacts probable secrets unless raw output is explicitly requested.

Context packs are written to `.soturail/context/<target>-context.md`. JSON-RPC examples live under [examples/mcp](examples/mcp).

## 10. Agent Response Compression

SotuRail includes Caveman-like output compression as inspiration, implemented independently with professional modes:

- `normal`
- `concise`
- `ultra`
- `review`
- `commit`
- `debug`
- `docs`

It preserves fenced code blocks, shell commands, file paths, line numbers, security warnings and failure details using deterministic reducers. See [docs/response-compression.md](docs/response-compression.md).

## 11. Knowledge-to-Rules Engine

SotuRail can ingest Markdown, TXT, JSON and YAML into structured YAML/JSON rules, checklists, citations and simple validators.

```bash
soturail ingest docs/requirements.md --type requirements
soturail rules list
soturail rules check
soturail rules export --format yaml
```

This makes heavy docs smaller, reusable and auditable without inventing rules that do not appear in the source. See [docs/knowledge-to-rules.md](docs/knowledge-to-rules.md).

## 12. Prompt Caching Design

Stable blocks are ordered before dynamic data:

1. static_header
2. governance
3. config
4. repo_map
5. approved_specs
6. approved_memory
7. dynamic_footer

SotuRail reports estimated cache stability only. It never claims real provider cache hits unless imported metadata exists.

## 13. Security Model

`soturail run` blocks dangerous patterns by default, including `rm -rf`, `sudo`, `format`, `dd if=`, `curl | sh`, `del /s` and `git push`.

Raw logs may contain secrets because they preserve real terminal output. Treat `.soturail/raw/` as local evidence, not public artifact material.

## Windows Notes

Windows users should see [docs/windows.md](docs/windows.md) for CMD vs PowerShell quoting, global install, `npx`, local tarball testing and common paste mistakes such as copying Markdown code-fence labels into CMD.

## Road To Workflow Rail

Skill Rail ships in v0.3.0. Workflow Rail remains planned; see [docs/workflow-rail.md](docs/workflow-rail.md) for the security-first roadmap.

## Comparison Philosophy

SotuRail is inspired by the broader context-engineering ecosystem, including terminal reducers, agent response compression, spec-driven workflows, local memory, rules extraction, hooks, benchmarks and skill registries. SotuRail does not vendor or depend on those projects. It aims to unify similar ideas into one local-first workflow while keeping benchmarks honest. See [docs/comparisons.md](docs/comparisons.md).

## 14. Roadmap

See [ROADMAP.md](ROADMAP.md). v0.4.0 focuses on Workflow Rail and Git worktrees; later releases target hardened PDF ingestion, semantic memory, deeper native integration and a stable API.

## 15. Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Reducers, hooks and rules should include tests, safety notes and benchmark impact when relevant.

## 16. License

MIT © Rafael Ryan Ramos de Souza
