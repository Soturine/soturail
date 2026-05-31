# Native Runner

SotuRail v0.2.1 keeps TypeScript as the public CLI, policy orchestration, docs and npm distribution layer. Rust is used only for optional hot paths where streaming, lower overhead and binary execution are useful.

## Responsibility Split

- TypeScript: CLI commands, config validation, safety policy, workspace manifests, docs, metrics and npm package distribution.
- Rust: optional reducers and native tee-stream command execution.

## Native Commands

- `soturail-native --version`
- `soturail-native reduce-generic`
- `soturail-native reduce-git`
- `soturail-native reduce-test`
- `soturail-native reduce-json`
- `soturail-native run --raw-log <path> --summary-json <path> -- <command...>`

The native runner spawns a subprocess, tees stdout/stderr to the terminal, writes the same bytes to a raw log and records a compact JSON summary. TypeScript safety checks remain the primary gate, and the Rust binary also refuses obvious destructive command strings when called directly.

## Detection and Fallback

The TypeScript CLI checks:

1. `native/soturail-native/target/release/soturail-native`
2. `native/soturail-native/target/debug/soturail-native`
3. `dist/native/soturail-native`
4. `soturail-native` on PATH

`--engine auto` falls back to TypeScript when native is missing. `--engine native` fails clearly when native is unavailable.

## Build

```bash
npm run build          # TypeScript only
npm run build:native   # Rust release binary
npm run build:all      # TypeScript + Rust
```

## Native Benchmarks

```bash
npm run build:native
soturail bench run --engine native
soturail bench compare-engines
soturail bench run --suite brain
soturail native candidates
soturail native status
soturail native compare
```

## v0.9.0 Benchmark Gate

Native acceleration is not promoted just because a native path exists. v0.9.0 requires:

- a local benchmark case;
- a TypeScript baseline;
- optional native execution only;
- tested fallback behavior;
- a maintenance-risk decision.

Candidate reports are written to:

```txt
.soturail/native/candidates.json
.soturail/native/candidates.md
```

SotuRail does not claim native speedups unless a local benchmark report proves them. Normal npm install does not require Rust or native binaries.

## v0.10.0 Report Integration

Native status and candidate counts appear in `soturail status --json`, local reports, the static dashboard, GitHub summary output and agent-readable reports. Native unavailability remains normal and non-fatal as long as the TypeScript fallback works.

## v0.10.1 Native Polish

`soturail native candidates` and `soturail native doctor` now repeat the release policy clearly:

- TypeScript fallback is mandatory.
- Normal npm install does not require Rust or native binaries.
- Native unavailable is non-blocking.
- Candidate recommendations link to benchmark categories.

SotuRail still does not claim native speedups unless a local benchmark report proves them.

## Current Limitations

- Native binaries are not prebuilt for npm yet.
- Interactive TTY behavior is best-effort.
- TypeScript remains the source of truth for workspace manifests and safety prompts.
- Parser/graph acceleration remains deferred until benchmark evidence justifies it.
