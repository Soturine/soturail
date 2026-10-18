Prepared 1.3.0 in `package.json` and `src/version.js`, and moved Unreleased entries into `1.3.0 - 2026-10-18`.

Not ready to publish:

- Tests: 3 passed, 1 failed—`formatBytes(1024)` returns `1024 B`, contradicting the changelog.
- Package dry run includes internal logs and agent files.
- Release preflight is blocked by the dirty worktree; SotuRail evidence is stale.

Version consistency and diff whitespace checks passed after the edits. Nothing was published, tagged, or pushed.

STATUS: NOT_READY
VERIFIED: yes