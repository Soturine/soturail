# v1 Contract

SotuRail v1.0.0 froze the first stable local surface. Later v1 releases added host compatibility, harness lifecycle, knowledge/evidence/evaluation, governance and the verified control plane. v1.6 adds the agent-native semantic surface: portable Skills, Capability Descriptor v2, candidate artifacts, host adapters, language-neutral semantics and the hardened Change Contract lifecycle while keeping Conductor and a general autonomous runtime outside the stable contract.

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

The stable command surface is listed in [stable-command-surface.md](../commands/stable-command-surface.md). v1.6 also documents capability discovery, portable Skill discovery/export, candidate recording, Change Contract lifecycle and typed MCP discovery.

## Non-Goals

SotuRail does not require a cloud dashboard, hosted analytics, telemetry upload, login system, vector DB, graph DB, autonomous editing agent, destructive MCP tool provider, native-only package or host-specific runtime engine.

## Compatibility

Compatible changes may add fields to JSON artifacts. Removing fields, changing schema meanings or promoting experimental commands requires release notes and migration guidance. See [deprecation policy](deprecation-policy.md) and [migration to v1](../../getting-started/migration-v1.md).
