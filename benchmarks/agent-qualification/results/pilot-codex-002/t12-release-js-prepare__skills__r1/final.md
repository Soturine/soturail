Updated both version declarations to `1.3.0` and moved Unreleased entries into `1.3.0 — 2026-10-18`.

Not ready to publish:

- Tests: 3 passed, 1 failed. `formatBytes(1024)` returns `1024 B`, contradicting the changelog.
- Package dry run includes `.soturail` state and logs.
- Release preflight requires a clean worktree; evidence and governance gates did not pass.

Version consistency and diff checks passed. Nothing was published, tagged, or pushed.

STATUS: NOT_READY
VERIFIED: no