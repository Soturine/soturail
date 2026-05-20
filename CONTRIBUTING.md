# Contributing

Thank you for helping SotuRail become a reliable local-first developer tool.

## Setup

```bash
npm ci
npm run build
npm test
```

Optional native path:

```bash
npm run build:native
npm run test:native
```

## Benchmarks

```bash
npm run build
npm run bench:prepare
npm run bench
npm run bench:report
```

Do not claim external comparisons unless the tool was installed and run locally by the contributor.

## Proposing Reducers

Reducers must preserve:

- errors and warnings;
- file paths and line numbers;
- assertion summaries and stack traces;
- recovery instructions pointing to raw logs when applicable.

Include tests and benchmark impact when reducer behavior changes.

## Proposing Hooks

Hooks must support `--dry-run`, print exact file targets and create backups before changing existing host files. If a host config location is uncertain, prefer prompt-only rules.

## Compression Omissions

If a summary drops essential information, open an issue with:

- command executed;
- reducer used;
- raw_id if available;
- missing signal;
- expected preserved output.

## Pull Requests

Please update tests, docs and CHANGELOG for user-visible changes. Core logic should not include TODO placeholders.
