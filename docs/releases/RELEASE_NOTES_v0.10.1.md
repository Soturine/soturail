# SotuRail v0.10.1

v0.10.1 is a stability release for the local reports milestone. It fixes JSON validity concerns, improves report/dashboard/observability ergonomics, polishes benchmark/native/baseline evidence and adds v1.0 readiness scaffolding without breaking existing public commands.

## Highlights

- `soturail status --json` is hardened as valid JSON output parseable by `JSON.parse`.
- Local JSON artifacts are covered by stricter status/report/MCP/bench/native/baseline contract tests.
- `soturail self schemas --check` writes schema compatibility reports under `.soturail/schemas/`.
- `soturail self readiness --v1` writes candidate v1 readiness reports under `.soturail/readiness/`.
- Report doctor, diff, redaction output and agent reports now provide clearer next commands.
- Dashboard doctor validates local JSON data and still requires no server or external assets.
- Observability collection skips duplicate local artifact events and writes clearer summaries.
- Benchmark/native/baseline output now repeats the TypeScript fallback and benchmark-gated policy.
- Project Brain suspect/stale counts are framed as evidence freshness warnings, not automatic code failures.

## Commands Added

```bash
soturail self schemas --check
soturail self schemas --check --json
soturail self readiness --v1
soturail self readiness --v1 --json
```

## Commands Improved

```bash
soturail status --json
soturail status --agent
soturail report latest
soturail report doctor
soturail report redact
soturail report diff
soturail report agent --agent codex
soturail dashboard doctor
soturail obs collect
soturail obs summary
soturail bench report
soturail bench compare
soturail native candidates
soturail native doctor
soturail self baseline --check
soturail release check
```

## Artifacts Added

```txt
.soturail/schemas/check.json
.soturail/schemas/check.md
.soturail/readiness/v1.json
.soturail/readiness/v1.md
docs/stable-command-surface.md
docs/deprecation-policy.md
docs/migration-v1.md
```

## Stability And Safety

- Every main JSON artifact is expected to be parseable.
- Release preflight now checks local JSON artifacts when present.
- Report redaction prints finding kinds and counts without leaking secret values.
- Normal package hashes and integrity hashes are not redacted unless they look credential-like.
- No cloud, telemetry upload, server requirement, destructive MCP tools or breaking command removals were added.

## Known Limitations

- v1.0 readiness is a draft check, not a final stability guarantee.
- `self schemas --check` validates top-level schema compatibility; it is not a full JSON Schema validator.
- High Project Brain suspect/stale counts still need human review through `brain stale --repair-plan`.
- Native acceleration remains optional and benchmark-gated; TypeScript remains the default fallback.

## Upgrade Notes

```bash
npm install -g soturail@0.10.1
soturail status --json
soturail report build
soturail self schemas --check
soturail self readiness --v1
```
