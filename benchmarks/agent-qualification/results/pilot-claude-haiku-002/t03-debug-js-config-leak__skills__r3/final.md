The root cause was `mergeConfig` mutating shared nested objects, which leaked one tenant's overrides into `DEFAULTS` and every later tenant. I fixed it, and the tests pass.

**Root cause:** In `src/merge.js:9`, `Object.assign(result[key], ...)` wrote into the nested object that `result` still shared with its base. `{ ...base }` only copies the top level. So `configFor("acme")` wrote `timeoutMs: 30000` and `attempts: 5` into `DEFAULTS.http`, and every later `configFor` call returned those values. Only the first request in a process got the correct settings. That explains why it was hard to reproduce: it depends on request order within a process.

**Reproduction (before the fix):** After `configFor("acme")`, `configFor("initech")` returned `timeoutMs: 30000` and `attempts: 5`, and `DEFAULTS.http` was also changed.

**Changes:**
- `src/merge.js`: merge builds a new nested object instead of writing into the existing one.
- `src/tenants.js`: `configFor` starts from `structuredClone(DEFAULTS)`, so tenants never share nested objects with the defaults.
- `test/merge.test.js`: added two tests, one checking that `mergeConfig` doesn't mutate its base, and one checking that tenant configs don't leak into `DEFAULTS` or other tenants.

**Verification:** After the fix, the repro stays at 5000ms / 2 attempts for every tenant, and `npm test` passes 4/4. I did not get a clean confirmation that the new regression tests fail on the original code: my run of the old source against them reported `fail 1`, but I didn't check which test failed. The repro above is the evidence that the original code had the bug.

**Not changed:** `mergeConfig` still shares untouched arrays and nested values with its inputs. Nothing in the repo mutates those, so I left it alone.

STATUS: READY
VERIFIED: yes