# SotuRail

[![npm](https://img.shields.io/npm/v/soturail)](https://www.npmjs.com/package/soturail)
[![CI](https://github.com/Soturine/soturail/actions/workflows/ci.yml/badge.svg)](https://github.com/Soturine/soturail/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

SotuRail is a local-first engineering control plane for AI-assisted software work. It supplies workspace-bound context, contracts, readiness decisions, evidence, provenance, and reproducible release artifacts without becoming an autonomous agent or mandatory server.

> SotuRail governs engineering readiness and verified context; it does not replace the coding model/runtime.

## Install

```bash
npm install -g soturail
soturail --version
```

SotuRail v1.5 requires Node.js 22 or newer. TypeScript is the portable default; Rust acceleration remains optional.

## Five-minute workflow

```bash
soturail index
soturail read README.md --query "product boundary"
soturail contract create docs-refresh --title "Refresh docs" --intent "Keep contracts current" --criterion "docs check passes" --check "npm run docs:check"
soturail evidence collect
soturail self readiness --v1 --strict
```

Generated state stays local under `.soturail/`. Use `soturail run -- <command...>` for recoverable logs and `soturail expand <raw_id>` for redacted recovery.

## Core architecture

| Layer | Responsibility |
|---|---|
| Integrity | WorkspaceGuard, Artifact Registry/Store/Envelope, fingerprints, atomic recovery |
| Context | progressive reads, source-backed knowledge, hard-budget context artifacts |
| Contracts | Change Contract, evidence policy, readiness and fidelity inputs |
| Governance | capability registry/epochs, NativeMinimal provider, Authority + Readiness Dual Gate |
| Execution evidence | exact-digest Execution Envelope, Run Manifest, freshness and provenance |
| Adapters | typed MCP and replaceable governance/structural/docs/runtime provider boundaries |

The official MCP SDK serves a typed, small, capability-mapped surface. It exposes neither arbitrary shell execution nor caller-controlled raw-log authorization.

## Maturity and safety

The v1.5 deterministic foundation is implemented and tested. AGT/ACS integration, general schema migrations, structural graph providers, Evidence Receipts, SQLite/FTS, vectors, and Conductor remain explicitly deferred.

SotuRail is a guardrail—not a sandbox. It cannot replace OS permissions, credential controls, provider security, physical/runtime QA, or human approval. Evidence distinguishes verified, unverified, blocked, inferred, and stale states.

## Documentation

- [Quickstart](docs/getting-started/quickstart.md)
- [v1.5 commands](docs/reference/commands/v1.5-commands.md)
- [Verified control plane](docs/architecture/verified-control-plane.md)
- [Threat model](docs/security/threat-model.md)
- [Migration to v1.5](docs/getting-started/migration-v1.5.md)
- [Implementation tracker](docs/roadmap/verified-control-plane-implementation-tracker.md)
- [Roadmap](ROADMAP.md)

## Development and release gates

```bash
npm ci
npm run build
npm run typecheck
npm test
npm run docs:check
npm audit
node dist/cli.js mcp smoke
node dist/cli.js self architecture --check
cargo test --manifest-path native/soturail-native/Cargo.toml
npm run release:check
```

## License

Apache-2.0. See [LICENSE](LICENSE).
