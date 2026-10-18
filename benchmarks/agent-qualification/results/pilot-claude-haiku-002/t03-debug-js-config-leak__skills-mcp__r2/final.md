The root cause is in `src/merge.js`. `mergeConfig` mutated the shared `DEFAULTS` object, so one tenant's overrides leaked into every later tenant served by the same process.

**Root cause:** `mergeConfig` starts with `{ ...base }`, which is a shallow copy. When an override touched a nested object, `Object.assign(result[key], …)` wrote into the nested object that `result[key]` still pointed to, which was `DEFAULTS.http` or `DEFAULTS.headers`. `configFor('acme')` therefore changed the global defaults to `timeoutMs: 30000` and `attempts: 5`. `globex` then added `x-tenant` to the same object. Every later tenant inherited these values. The failure depends on which tenant ran first in each process, which is why it was hard to reproduce.

**Reproduction (before the fix):** after calling `configFor('acme')` and `configFor('globex')`, `configFor('initech')` returned acme's timeout and retry settings plus globex's `x-tenant` header. `DEFAULTS` itself was corrupted.

**Fix:**
- `src/merge.js:9`: nested merges now assign the result of `mergeConfig(...)` instead of mutating the base object.
- `src/tenants.js:12`: `configFor` merges into `structuredClone(DEFAULTS)`, so each returned config gets its own copy of the defaults.

**Tests:**
- `test/merge.test.js`: added a test that `mergeConfig` does not mutate its inputs.
- `test/tenants.test.js` (new): tests that tenant overrides do not leak into later tenants, and that returned configs are independent.

`npm test` passes 5/5 with the fix. With the original `src/` stashed, the new tests fail 3 of 5, so they catch the bug.

**Not covered:** `mergeConfig` still shares arrays and non-plain values from the override by reference. No current code path mutates those, so I left it alone.

STATUS: READY
VERIFIED: yes