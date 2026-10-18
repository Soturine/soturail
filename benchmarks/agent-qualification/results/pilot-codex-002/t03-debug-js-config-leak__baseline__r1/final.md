Fixed the root cause: the shallow copy in `mergeConfig` left nested objects shared with `DEFAULTS`, so merging one tenant’s overrides changed settings inherited by later tenants.

The merge now creates independent nested objects and arrays. Regression tests cover tenant request ordering, result mutations, frozen inputs, and replacement behavior.

Verification: all 5 tests passed; `git diff --check` passed.

STATUS: READY
VERIFIED: yes