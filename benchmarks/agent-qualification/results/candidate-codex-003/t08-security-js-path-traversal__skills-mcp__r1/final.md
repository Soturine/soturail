Fixed traversal and symlink escapes in `src/static.js`; malformed paths now return 404. All five tests pass after the fix, and `git diff --check` passes.

SotuRail’s readiness gate remains blocked pending independent review and acceptance attestation.

STATUS: NOT_READY
VERIFIED: yes