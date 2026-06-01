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
