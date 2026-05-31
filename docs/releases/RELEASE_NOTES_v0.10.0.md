# SotuRail v0.10.0

v0.10.0 adds local reports, unified status, observability timeline, static dashboard artifacts, agent-readable reports, GitHub summary export, redaction checks and read-only MCP report resources.

## Added

- `soturail status --json|--md|--agent` for a unified local status model.
- `soturail report build`, `report latest`, `report export`, `report doctor`, `report redact`, `report github-summary`, `report agent` and `report diff`.
- `soturail dashboard build|open|doctor` for static local dashboard artifacts.
- `soturail obs collect|summary|timeline|export` for local observability events.
- Read-only report resource manifest through `soturail mcp resources report`.
- Agent-readable report exports for Codex, Claude, Gemini and generic hosts.
- Local report redaction and safety checks for obvious credential patterns.
- `llms.txt` with factual documentation entry points.

## Changed

- Release preflight now includes report safety and optional status/report/dashboard/observability/MCP evidence gates.
- Workflow evidence now references unified status, local reports, static dashboard, observability and MCP report resource artifacts when present.
- README and docs now describe local reports, dashboard, observability, report redaction and MCP report resources.

## Security

- Reports and dashboards are local artifacts. SotuRail does not upload telemetry and does not require a dashboard server.
- Dashboard output uses plain local HTML/CSS and rejects external script/CDN references in `dashboard doctor`.
- MCP report resources are read-only and do not expose shell execution or report mutation.
