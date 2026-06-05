# Quickstart

SotuRail is a local-first Context OS for AI coding agents. v1.0.0 froze the first stable command surface for local status, reports, dashboard artifacts, Project Brain checks, benchmarks, release readiness and agent handoff. v1.1.0 adds host-compatible exports, host doctors and read-only MCP host manifests.

## Install

```bash
npm install -g soturail
soturail --version
```

Run without a global install:

```bash
npx soturail@latest --help
```

## First Local Checks

```bash
soturail status --json
soturail report build
soturail dashboard build
soturail self readiness --v1
soturail release check
```

Artifacts are written under `.soturail/`. They are local files, not uploaded telemetry.

## Use With Agents

```bash
soturail agents matrix
soturail report agent --agent codex
soturail brain export --agent codex --limit 20
soturail mcp resources report
```

Review generated files before giving them to an agent. SotuRail does not expose destructive MCP tools or arbitrary shell execution by default.

## Before Release

```bash
npm run typecheck
npm run build
npm test
soturail self schemas --check --strict
soturail self readiness --v1 --strict
soturail self code-health
soturail release check --strict
```

Native acceleration is optional. TypeScript remains the portable fallback for normal npm installs.
