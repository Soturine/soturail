# Observability Rail

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
