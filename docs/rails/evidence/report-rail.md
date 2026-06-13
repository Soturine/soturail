# Report Rail

Report Rail turns local SotuRail evidence into stable JSON, Markdown, HTML and agent-readable artifacts.

```bash
soturail report build
soturail report latest
soturail report export --format html
soturail report export --format md
soturail report export --format json
soturail report doctor
soturail report redact
soturail report github-summary
soturail report agent --agent codex
soturail report diff
```

Primary artifacts:

```txt
.soturail/reports/latest.json
.soturail/reports/latest.md
.soturail/reports/latest.html
.soturail/reports/agent-codex.md
.soturail/reports/github-step-summary.md
.soturail/reports/diff.json
.soturail/reports/diff.md
```

Reports aggregate unified status, eval results, benchmarks, native candidates, baseline snapshots, Project Brain health, workflow evidence, harness and diagram status, release readiness and agent readiness. Missing inputs produce warnings and next commands instead of crashes.

SotuRail reports are local artifacts. They are designed for humans, CI and coding agents. They do not upload telemetry or require a dashboard server.

`report github-summary` writes Markdown that is safe to append to `$GITHUB_STEP_SUMMARY` in GitHub Actions.

`report diff` compares the latest report against the previous report preserved in `.soturail/reports/history/`. It tracks warning count, brain suspect/stale count, benchmark cases, native candidates, baseline failures and release check changes.

## v0.10.1 Polish

- `report latest` shows `brain_status` and safe next commands.

## v1 Stable Contract

`report build`, `report export --format json`, `report doctor`, `report redact`, `report diff`, `report github-summary` and `report agent --agent codex` are part of the v1 stable surface. Report JSON uses `soturail.report.v1`, stays local and is checked by `soturail self schemas --check --strict`.
- `report doctor` verifies that report JSON is parseable and suggests `soturail self schemas --check`.
- `report diff` writes a status such as `no_previous_report`, `missing_latest_report` or `compared`.
- `report redact` prints redaction kinds and counts without leaking secret values.
- Agent reports keep stale/suspect Project Brain warnings separate from verified facts.

If Project Brain has high suspect/stale counts, reports explain that evidence may be old rather than code being broken. Use:

```bash
soturail brain stale --repair-plan
soturail reverse claims ./src
soturail brain consolidate --dry-run
```

## Related Evidence, Eval And Governance Docs

Report Rail is the parent surface where several future rails should become visible:

- [`evidence-provenance-rail.md`](evidence-provenance-rail.md): report sidecars, source paths and `verified` / `unverified` / `blocked` / `inferred` statuses.
- [`agent-qa-rail.md`](../evaluation/agent-qa-rail.md): dataset runs, golden export checks and regression summaries.
- [`golden-agent-tests.md`](../evaluation/golden-agent-tests.md): deterministic host-export checks that can be summarized in reports.
- [`agent-governance-rail.md`](../governance/agent-governance-rail.md): trace, ledger, approval and experiment status.
- [`host-router-rail.md`](../hosts/host-router-rail.md): context-format fallback decisions per host.

A future report should not simply say an agent task is complete. It should say what evidence exists, what was checked, what is still inferred or blocked and which safe next command can improve confidence.
