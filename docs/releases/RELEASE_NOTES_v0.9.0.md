# SotuRail v0.9.0 - Release Notes

## Install

```bash
npm install -g soturail@0.9.0
soturail --version
```

## Highlights

- Added Benchmark Rail 2.0 reports with `soturail bench list`, `bench run --suite <suite>`, `bench compare` and stable `.soturail/bench/latest.*` output.
- Added benchmark categories for Project Brain, reducers, JSONL, range hashing, file scanning, workflow evidence and release preflight.
- Added `soturail native candidates`, `native status`, improved `native doctor` and `native compare` so native work is classified before any acceleration claim.
- Added `soturail self baseline --check|--zip|--bundle|--pack` for clean source, history and package snapshots.
- Release and workflow evidence now reference benchmark, native candidate and baseline reports when present.
- Added docs for benchmark-gated native policy, baseline snapshots and the deferred parser/graph seed.

## Safety

- TypeScript fallback remains mandatory and default.
- Rust/native remains optional.
- Normal npm install does not require Rust, Cargo or native build tools.
- SotuRail does not claim native speedups unless a local benchmark report proves them.
- Parser/graph work is documented as a future seed, not promoted as a mandatory runtime.

## Validation

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run release:check`
- `node dist/cli.js bench run --suite brain`
- `node dist/cli.js native candidates`
- `node dist/cli.js self baseline --check`
