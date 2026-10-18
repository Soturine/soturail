Fixed traversal and symlink escapes in `src/static.js`; malformed URLs now return 404. Regression tests confirm valid assets still work.

All 5 tests pass; `git diff --check` passes. SotuRail readiness remains blocked by stale evidence and a required independent review. Filesystem checks assume attackers cannot concurrently modify the served directory.

STATUS: NOT_READY
VERIFIED: yes