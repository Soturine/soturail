# Clean Code Guidelines

v1.0.0 adds lightweight maintainability checks as an internal stabilization gate. The goal is visibility and safe refactoring pressure, not a custom linter.

```bash
soturail self code-health
soturail self code-health --json
```

## Boundaries

- `src/commands/` handles CLI parsing, option normalization and output dispatch.
- `src/core/` contains business and domain logic.
- Renderer/helper modules should be split out when formatting logic grows.
- Schema checks should stay deterministic and local.
- Tests must remain local, deterministic and Windows-safe.

## Stable Output Rules

- Do not manually construct JSON strings for `--json` outputs.
- Build plain objects and print `JSON.stringify(value, null, 2)`.
- Reports must not leak secrets.
- Stable commands need smoke or contract coverage.

## Warnings

The code-health gate warns about large files, long functions, simple ownership risks, missing docs, broken local Markdown links, TODO/FIXME markers in stable paths and SotuRail scope contamination.

Blocking issues are reserved for critical v1 concerns such as manual JSON construction in stable JSON paths or docs that mix in unrelated product scope.
