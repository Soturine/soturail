Fixed `src/merge.js:9`: `Object.assign` mutated nested objects shared with `DEFAULTS`, so tenant overrides contaminated later requests. The merge now uses the new recursive result.

Regression tests failed before the fix; all five pass afterward. `git diff --check` passes.

SotuRail’s readiness gate remains blocked by stale evidence and the recorded pre-fix failure.

STATUS: NOT_READY
VERIFIED: yes