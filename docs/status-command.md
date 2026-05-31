# Status Command

`soturail status` builds a unified local status model for humans, CI and agents.

```bash
soturail status --json
soturail status --md
soturail status --agent
```

Artifacts:

```txt
.soturail/status/latest.json
.soturail/status/latest.md
.soturail/status/agent.md
```

The status model aggregates package and CLI version, release notes path, git state, latest eval and benchmark reports, native candidate status, baseline snapshots, Project Brain health, workflow evidence, harness failures, diagram validation and agent readiness.

`--agent` is intentionally concise. It separates warnings from verified facts, lists safe next commands and avoids raw logs or secrets.

SotuRail status is local-only. It does not call GitHub, upload telemetry or require a dashboard server.
