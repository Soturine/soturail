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

## v0.10.1 JSON Contract

`status --json` prints a plain JavaScript object through `JSON.stringify(object, null, 2)`. It must be parseable by `JSON.parse(stdout)`.

The status artifact at `.soturail/status/latest.json` uses the same object. v0.10.1 adds contract tests for stdout and disk JSON so manual string assembly cannot introduce trailing commas.

## Brain Freshness

Status includes `brain.brainStatus`:

```txt
healthy
needs_refresh
warning
unknown
```

High suspect/stale counts mean the Project Brain evidence may be old. They do not necessarily mean the code is broken. Suggested refresh commands:

```bash
soturail brain stale --repair-plan
soturail reverse claims ./src
soturail brain consolidate --dry-run
soturail brain doctor --repair-plan
```

SotuRail status is local-only. It does not call GitHub, upload telemetry or require a dashboard server.
