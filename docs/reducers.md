# Reducers

Reducers compress terminal output while preserving the recovery path to raw logs.

## Generic

Keeps first and last lines, error-looking lines, warnings, permission failures, timeouts, file paths and repeated-line summaries.

## Git

Handles status, diff, log, show and branch output heuristically. It preserves changed files, rename/delete markers, conflict markers and hunk headers.

## Test

Handles Vitest, Jest, Mocha, Pytest, Maven Surefire and Gradle test output at a heuristic level. It preserves failing test names, assertions, expected/received summaries, stack traces and file paths.

## JSON TOON Lite

Minifies valid JSON and labels compacted arrays. Primitive value paths are included so important values remain traceable.
