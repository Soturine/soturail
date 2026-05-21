# Reducers

Reducers compress terminal output while preserving the recovery path to raw logs.

## Generic

Keeps first and last lines, error-looking lines, warnings, permission failures, timeouts, file paths and repeated-line summaries.

## Developer Command Reducers

v0.3.2 adds focused reducers for common developer commands:

- `npm install`, package manager install noise and audit warnings;
- `npm test`, Vitest/Jest/Mocha style failures;
- `tsc` TypeScript diagnostics with file, line and column;
- Docker logs with repeated heartbeat lines;
- ESLint failures and rule names;
- Vite and Next build output;
- Java stack traces, Maven Surefire and Gradle failures.

These reducers preserve error lines, warnings, security warnings, file paths, stack frames, failing test names, final summaries and recovery hints such as `Raw log: soturail expand <raw_id>`.

## Git

Handles status, diff, log, show and branch output heuristically. It preserves changed files, rename/delete markers, conflict markers and hunk headers.

## Test

Handles Vitest, Jest, Mocha, Pytest, Maven Surefire and Gradle test output at a heuristic level. It preserves failing test names, assertions, expected/received summaries, stack traces and file paths.

## JSON TOON Lite

Emits a compressed representation with relevant `path: value` lines. It preserves error messages, statuses, ids, file paths, booleans and nulls that affect debugging, while collapsing repetitive arrays and object structure. The reduced representation is clearly labeled when it is not valid JSON.

## Block-Level Dedupe

SotuRail tracks recent safe output blocks in `.soturail/dedupe/index.jsonl`. Repeated safe blocks can be replaced with a visible reference:

```txt
[deduped block: block_abc123, seen in raw_id cf42b9, 38 lines]
```

Error blocks, stack traces, security warnings and file paths tied to current failures are preserved in conservative mode.

```bash
soturail dedupe stats
soturail run --similar-dedupe conservative npm test
```

Similar-output dedupe is deterministic and experimental. It normalizes whitespace, timestamps and temporary paths; it does not use AI or semantic matching.
