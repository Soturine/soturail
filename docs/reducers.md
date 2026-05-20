# Reducers

Reducers compress terminal output while preserving the recovery path to raw logs.

## Generic

Keeps first and last lines, error-looking lines, warnings, permission failures, timeouts, file paths and repeated-line summaries.

## Git

Handles status, diff, log, show and branch output heuristically. It preserves changed files, rename/delete markers, conflict markers and hunk headers.

## Test

Handles Vitest, Jest, Mocha, Pytest, Maven Surefire and Gradle test output at a heuristic level. It preserves failing test names, assertions, expected/received summaries, stack traces and file paths.

## JSON TOON Lite

Emits a compressed representation with relevant `path: value` lines. It preserves error messages, statuses, ids, file paths, booleans and nulls that affect debugging, while collapsing repetitive arrays and object structure. The reduced representation is clearly labeled when it is not valid JSON.
