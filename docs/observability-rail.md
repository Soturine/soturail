# Observability Rail

v1.0.0 keeps observability local. Events are derived from SotuRail artifacts, not shell history, and are not uploaded.

Observability Rail collects a local timeline from existing SotuRail artifacts. It does not read shell history and does not upload telemetry.

```bash
soturail obs collect
soturail obs summary
soturail obs timeline
soturail obs export
```

Artifacts:

```txt
.soturail/observability/events.jsonl
.soturail/observability/timeline.json
.soturail/observability/summary.md
```

Collected events are derived from local evidence such as eval reports, benchmark reports, native candidate reports, baseline snapshots, Project Brain doctor output, local reports and unified status.

Each event has a schema version, id, timestamp, type, severity, summary, evidence path and tags. This makes the timeline useful for humans and coding agents without becoming a telemetry system.

## v0.10.1 Polish

`obs collect` uses stable local artifact event IDs and skips duplicates when the same evidence is collected repeatedly.

The timeline is sorted deterministically, and the summary includes:

- counts by event type;
- latest warnings;
- latest errors;
- evidence paths;
- safe next commands.

Observability still does not collect private shell history and does not upload telemetry.

## Pipeline Recorder Expansion

Future observability work can add a pipeline recorder inspired by validate/fix/verify/report agent flows:

```txt
agent_started
agent_finished
agent_failed
file_read
schema_validated
repair_applied
report_generated
```

The first implementation can remain local artifacts and dashboard cards. A live SSE/server mode is optional and should not become required.

## Related 2026 Harness Rails

Observability Rail is the local timeline layer that feeds several planned rails:

- [`agent-qa-rail.md`](agent-qa-rail.md) defines eval runs, scores and regression artifacts that can become observability events.
- [`evidence-provenance-rail.md`](evidence-provenance-rail.md) defines verification status and provenance sidecars that reports and timelines should surface.
- [`agent-governance-rail.md`](agent-governance-rail.md) extends observability into trace, ledger, experiment and approval records.
- [`resilience-rail.md`](resilience-rail.md) adds rate-limit/fallback/provider-risk warnings as local events, not cloud telemetry.

This keeps the boundary clear: SotuRail observes local artifacts and user-approved records; it does not upload traces or become a hosted LangFuse/OpenTelemetry replacement by default.

## Ecosystem Direction

Hermes-style trajectory compression and Odysseus-style visual workspaces reinforce two SotuRail rules:

- keep observability as local, recoverable evidence rather than uploaded telemetry;
- present Context Packs, Memory, Reports, Evidence, Workflows, Host Compatibility, Skills, lifecycle state and Handoffs as bounded dashboard/report sections.

SotuRail does not add a required server, chat workspace or central shell interface. See [Security Boundaries](security-boundaries.md).
