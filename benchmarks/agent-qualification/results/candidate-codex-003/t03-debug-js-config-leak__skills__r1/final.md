Fixed the root cause in `src/merge.js`: a shallow copy left nested defaults shared, and `Object.assign` mutated them with tenant overrides. Request order caused the apparent intermittency.

Merges now create independent nested objects and arrays. Regression checks reproduced four failures before the fix; all seven tests pass afterward. `git diff --check` also passes.

SotuRail’s readiness gate still requires independent review under `.soturail/contracts/tenant-config-isolation.json`; that review remains outstanding.

STATUS: NOT_READY
VERIFIED: yes