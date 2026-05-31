# Migration To v1 Draft

This is a draft for preparing SotuRail users and agents for v1.0. It is not the final v1.0 migration guide.

## What Changed From v0.7 To v0.10

- v0.7 added Workflow Rail 2.0, Harness Rail expansion and Diagram Rail expansion.
- v0.8 added the Verified Project Brain and Reverse Specification Rail.
- v0.8.1 polished claim consolidation, stale repair guidance, agent briefs and safer rules from brain.
- v0.9 added benchmark-gated performance evidence, native candidate reports and baseline snapshots.
- v0.10 added local reports, unified status, static dashboard, observability timeline, agent reports and read-only MCP report resources.
- v0.10.1 hardens JSON validity, report polish, schema compatibility checks and v1 readiness reporting.

## Core Command Map

- Health: `soturail status --json|--md|--agent`
- Reports: `soturail report build`, `report latest`, `report doctor`, `report diff`
- Dashboard: `soturail dashboard build`, `dashboard doctor`
- Observability: `soturail obs collect`, `obs summary`, `obs timeline`
- Brain: `soturail brain scan`, `brain stale --repair-plan`, `brain consolidate --dry-run`
- Benchmarks: `soturail bench list`, `bench run --suite brain`, `bench report`
- Native policy: `soturail native candidates`, `native doctor`, `native compare`
- Baselines: `soturail self baseline --check|--zip|--bundle|--pack`
- Readiness: `soturail self schemas --check`, `soturail self readiness --v1`

## Stable Candidates

See [stable-command-surface.md](stable-command-surface.md). v1.0 should freeze the documented candidate stable surface, not every experimental seed.

## Experimental Commands

Graph/parse seeds, native acceleration beyond candidate reporting and extended MCP tool surfaces remain experimental until promoted in docs and release notes.

## Use Status, Reports And Dashboard

```bash
soturail status --json
soturail report build
soturail dashboard build
soturail report agent --agent codex
```

These commands write local artifacts only. They do not upload telemetry or require a server.

## Generate A Clean Baseline

```bash
soturail self baseline --check
soturail self baseline --zip
soturail self baseline --bundle
soturail self baseline --pack
```

Do not manually zip the full working directory with `node_modules`, `.git` and generated logs. Use `git archive`, `git bundle` and `npm pack`.

## Prepare For v1.0

```bash
soturail self schemas --check
soturail self readiness --v1
npm test
npm run release:check
```

Fix invalid JSON artifacts before publish. Treat high Project Brain suspect/stale counts as evidence freshness warnings and refresh them with `brain stale --repair-plan`.

## Known Non-goals

SotuRail v1.0 is not a SaaS dashboard, hosted analytics product, vector database, cloud gateway, autonomous editing agent or native-only package. TypeScript fallback stays mandatory.
