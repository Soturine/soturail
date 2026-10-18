Fixed `src/merge.js`: its shallow copy and nested `Object.assign` mutated shared defaults, making later tenants inherit earlier settings. Nested objects and arrays are now copied independently.

Three regression tests failed before the fix; all five tests pass afterward. The change contract reports ready. Evidence collection retains the intentional pre-fix failure as a historical blocker.

STATUS: READY
VERIFIED: yes