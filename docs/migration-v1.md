# Migration To v1

This guide prepares SotuRail users and agents for the v1.0 stable local Context OS surface.

## What Changed From v0.7 To v0.10

- v0.7 added Workflow Rail 2.0, Harness Rail expansion and Diagram Rail expansion.
- v0.8 added the Verified Project Brain and Reverse Specification Rail.
- v0.8.1 polished claim consolidation, stale repair guidance, agent briefs and safer rules from brain.
- v0.9 added benchmark-gated performance evidence, native candidate reports and baseline snapshots.
- v0.10 added local reports, unified status, static dashboard, observability timeline, agent reports and read-only MCP report resources.
- v0.10.1 hardens JSON validity, report polish, schema compatibility checks and v1 readiness reporting.
- v1.0 freezes the stable command surface, adds strict schema/readiness/release gates, adds code-health and architecture checks, and documents the v1 contracts.

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
- v1 gates: `soturail self schemas --check --strict`, `soturail self readiness --v1 --strict`, `soturail release check --strict`
- Maintainability: `soturail self code-health`, `soturail self architecture --check`
- Agent hosts: `soturail agents matrix`

## Stable Surface

See [stable-command-surface.md](stable-command-surface.md). v1.0 freezes the documented stable surface, not every experimental seed.

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
soturail self schemas --check --strict
soturail self readiness --v1
soturail self readiness --v1 --strict
soturail self code-health
npm test
npm run release:check
```

Fix invalid JSON artifacts before publish. Treat high Project Brain suspect/stale counts as evidence freshness warnings and refresh them with `brain stale --repair-plan`.

## Known Non-goals

SotuRail v1.0 is not a SaaS dashboard, hosted analytics product, vector database, cloud gateway, autonomous editing agent or native-only package. TypeScript fallback stays mandatory.

## After v1.0

The intended post-v1 sequence is staged so the stable Context OS surface remains reliable:

```txt
v1.1.0  Host Compatibility Rail
v1.2.0  Spec, Design And Diagram Rail
v1.3.0  Knowledge Graph Rail
v1.4.0  Skill Rail 2.0 And Domain Skill Packs
v1.5.0  Governance And Cost Rail
```

These rails should not be treated as v1.0 requirements unless they are explicitly promoted into the stable surface before release.
