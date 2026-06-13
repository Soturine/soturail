# SotuRail

[![npm](https://img.shields.io/npm/v/soturail)](https://www.npmjs.com/package/soturail)
[![CI](https://github.com/Soturine/soturail/actions/workflows/ci.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

SotuRail is a local-first Context OS for AI coding agents. It prepares compact project knowledge, evidence, workflows, reports and agent-safe exports without becoming an autonomous agent, cloud gateway or required server.

## Install

```bash
npm install -g soturail
soturail --version
npx soturail --help
```

SotuRail requires Node.js 20 or newer. TypeScript is the portable default; native acceleration remains optional.

## Quick Start

```bash
soturail status --agent
soturail knowledge compile project-guide README.md docs
soturail evidence collect
soturail report build
soturail dashboard build
soturail self readiness --v1 --strict
```

All generated artifacts stay local under `.soturail/`.

## Stable Rails

| Rail | Purpose |
| --- | --- |
| Context and Project Brain | Progressive repo reading, memory, verified claims and agent briefs |
| Knowledge and Evidence | Source-backed knowledge packs, provenance and honest verification status |
| Workflow and Harness | Local workflow evidence, lifecycle state, handoffs and safe task coordination |
| Evaluation and Skills | Deterministic datasets, golden checks and source-mapped Skill Rail 2.0 packs |
| Reports and Dashboard | Local status, static dashboard, observability and redacted agent reports |
| Release and Contracts | Schema checks, readiness gates, baselines and release evidence |

## Main Commands

```bash
soturail knowledge estimate README.md docs
soturail knowledge compile project-guide README.md docs
soturail knowledge verify project-guide
soturail evidence collect
soturail evidence verify
soturail eval dataset init
soturail eval golden
soturail eval regression
soturail skills build project-guide README.md docs
soturail skills lint
soturail tasklet create review-docs
soturail tasklet run review-docs --dry-run
soturail report build
soturail release check --strict
```

See the [documentation index](docs/README.md) and [usage guide](docs/getting-started/usage.md) for the full surface.

## Safety Model

- Local artifacts by default; no telemetry upload.
- No external LLM calls, paid embeddings or mandatory database.
- No arbitrary shell execution through MCP.
- No autonomous code rewriting.
- Evidence distinguishes verified, unverified, inferred and blocked states.
- Tasklets simulate and export work; they are not an agent runtime.

Read [Security Boundaries](docs/security/security-boundaries.md), [Security Model](docs/security/security-model.md) and [Evidence Provenance Rail](docs/rails/evidence/evidence-provenance-rail.md).

## Agent Hosts

SotuRail exports provider-agnostic context for Codex, Claude, Cursor, OpenCode-compatible hosts, Gemini-compatible hosts, Antigravity-style hosts, DeepAgents-style targets and generic consumers.

```bash
soturail agents matrix
soturail agents export --host codex
soturail report agent --agent codex
```

Compatibility is described conservatively in [Agent Hosts](docs/rails/hosts/agent-hosts.md).

## Documentation

- [Quickstart](docs/getting-started/quickstart.md)
- [Documentation index](docs/README.md)
- [v1 contract](docs/reference/contracts/v1-contract.md)
- [Stable command surface](docs/reference/commands/stable-command-surface.md)
- [Knowledge Rail](docs/rails/knowledge/knowledge-rail.md)
- [Evidence Provenance Rail](docs/rails/evidence/evidence-provenance-rail.md)
- [Agent QA Rail](docs/rails/evaluation/agent-qa-rail.md)
- [Skill Rail 2.0](docs/rails/skills/skill-rail-2.md)
- [Tasklet Rail](docs/rails/tasklets/tasklet-rail.md)
- [Roadmap](ROADMAP.md)

## Roadmap

v1.4.0 combines Knowledge, Evidence, Evaluation, Skills and Tasklets into one coherent local pipeline. The former v1.3.0 scope is absorbed into v1.4.0 so source-backed knowledge and provenance ship with their evaluation and reusable-work contracts.

Next directions:

- v1.5.0: Governance and Cost Rail
- v1.6.0: Optional Conductor experiments behind explicit approval gates

See [Future Rails](docs/roadmap/future-rails-index.md).

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
npm run docs:check
npm audit --omit=dev
npm run release:check
```

Tests are local and deterministic. No network is required for normal commands or test suites.

## License

Apache-2.0. See [LICENSE](LICENSE).
