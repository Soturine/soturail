# Evidence And Provenance Rail

Evidence And Provenance Rail is a planned expansion that makes SotuRail reports more auditable.

The core idea:

```txt
Every important output should say what it used, what it changed, what was verified and what is still uncertain.
```

## Provenance Sidecars

Reports can have sidecar files:

```txt
.soturail/reports/<slug>.md
.soturail/reports/<slug>.provenance.md
```

Per-run evidence can be grouped as:

```txt
.soturail/evidence/<run-id>/
  report.md
  provenance.md
  tests.log
  files-read.json
  files-changed.json
  verification.json
```

## Verification Status Values

Use explicit status labels:

| Status | Meaning |
| --- | --- |
| `verified` | backed by local file, command, test, schema or report evidence |
| `unverified` | plausible but not proven by available evidence |
| `blocked` | cannot be verified due to missing file, command failure or unavailable dependency |
| `inferred` | derived from available evidence but not directly stated |

## Proposed Commands

```bash
soturail evidence collect
soturail evidence verify
soturail evidence report
soturail sources compare
soturail review report
```

## Report Requirements

Agent-readable reports should include:

- source paths;
- command/eval/report ids;
- changed files;
- verification status;
- missing evidence;
- safe next commands;
- redaction status.

## Non-Goals

- no fake citations;
- no unsupported certainty;
- no cloud evidence store by default;
- no raw secret exposure in provenance files.
