Fixed the root cause: the shallow copy in `mergeConfig` left nested defaults shared, and `Object.assign` mutated them. Tenant overrides therefore leaked into later requests.

The merge now copies nested objects and arrays from both inputs. Regression tests cover request ordering, frozen inputs, and caller mutations.

All 5 tests pass after the final change; `git diff --check` passes.

STATUS: READY
VERIFIED: yes