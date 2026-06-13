# v1 Contract

SotuRail v1.0.0 froze the first stable local Context OS surface. SotuRail v1.1.0 extends that surface with host-compatible exports and read-only host manifests. SotuRail v1.2.0 adds compatible local harness lifecycle state. SotuRail v1.4.0 adds deterministic Knowledge, Evidence, Agent QA, Skill Rail 2.0 and dry-run Tasklet contracts while keeping experimental host runtimes and Conductor outside the stable contract.

## Stable Promise

- Stable commands stay local-first and do not require network access for normal operation.
- JSON outputs are emitted with `JSON.stringify` and must be parseable by `JSON.parse`.
- Stable generated JSON artifacts include `schemaVersion`.
- Generated report/check artifacts include `createdAt`.
- Reports, dashboards and MCP report resources are local artifacts.
- Read-only MCP report resources do not mutate files and do not expose shell execution.
- Host manifests and agent exports are local artifacts. They do not grant mutation access by default.
- Harness lifecycle initialization preserves existing files by default, and lifecycle audits do not execute verification commands.
- TypeScript fallback remains mandatory. Native acceleration remains optional and benchmark-gated.

## Stable Commands

The stable command surface is listed in [stable-command-surface.md](../commands/stable-command-surface.md). It includes status, reports, dashboard, observability, Project Brain, evaluation, benchmarks, native candidate reporting, baseline snapshots, release checks, workflow, harness lifecycle, diagrams, agent exports, host doctors and read-only MCP report/host resources.

## Non-Goals

SotuRail does not add a cloud dashboard, hosted analytics, telemetry upload, login system, database, vector DB, autonomous editing agent, destructive MCP tool provider, native-only package or host-specific runtime engine.

## Compatibility

Compatible changes may add fields to JSON artifacts. Removing fields, changing schema meanings or promoting experimental commands requires release notes and migration guidance. See [deprecation policy](deprecation-policy.md) and [migration to v1](../../getting-started/migration-v1.md).
