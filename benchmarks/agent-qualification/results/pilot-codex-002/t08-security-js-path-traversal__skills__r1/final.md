Confirmed and fixed path traversal in `src/static.js`. Added containment checks for decoded paths and symlink targets; malformed URLs now return 404.

All three tests pass after the fix, including regression coverage. SotuRail’s readiness gate still reports stale evidence and requires independent review. Protection assumes untrusted users cannot modify the served filesystem concurrently.

STATUS: NOT_READY
VERIFIED: yes