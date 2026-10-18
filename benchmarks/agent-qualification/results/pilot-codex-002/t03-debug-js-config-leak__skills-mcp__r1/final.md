Fixed the root cause in `src/merge.js`: a shallow copy followed by `Object.assign` mutated shared defaults, making later tenants inherit earlier tenants’ settings. Results now own their nested objects and arrays.

Regression tests reproduced the leak before the fix; all six tests pass afterward. `git diff --check` also passes.

SotuRail still reports stale evidence and requires independent review, so merge readiness remains blocked.

STATUS: NOT_READY
VERIFIED: yes