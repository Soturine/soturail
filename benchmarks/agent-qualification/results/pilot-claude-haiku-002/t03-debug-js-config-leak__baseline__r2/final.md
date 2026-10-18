The root cause was in `src/merge.js`, and it's fixed. Requests for different tenants shared mutable state inside one process, so a tenant that ran first could change the timeout and retry settings that later tenants got.

**Root cause:** `mergeConfig` copies only the top level (`{ ...base }`). For a nested key like `http`, `result.http` is the same object as `DEFAULTS.http`. The line `Object.assign(result[key], mergeConfig(...))` then wrote the tenant's overrides into that shared object. In the repro, after `configFor("acme")` ran, `configFor("initech")` returned acme's 30s timeout and 5 attempts, and `DEFAULTS` itself had changed. It only shows up when a tenant with nested overrides is resolved before others, which is why it's hard to reproduce on demand.

**Fix:**
- `src/merge.js:9` now assigns the fresh object that `mergeConfig` returns (`result[key] = mergeConfig(result[key], value)`), so nothing from `base` or `override` is written to. This also matches the README's promise that neither input is modified.
- `test/merge.test.js` has a new test that checks both inputs are unchanged after a nested merge. It fails on the original `merge.js` and passes with the fix.

**Verification:** After the fix, `configFor("initech")` and `DEFAULTS` keep their defaults (5000ms, 2 attempts) after `acme` is resolved. `npm test` passes 3/3, and the new test fails against the original code (2 pass, 1 fail).

**Not covered:**
- I didn't reproduce the production incident itself. The repro is deterministic and shows the same symptom, but I haven't confirmed it's the only path involved.
- Arrays are still shared by reference between the returned config and `DEFAULTS` (e.g. `allowedRegions`). The merge doesn't mutate them, but code that mutates a returned array would leak the same way.
- The changes are uncommitted. I didn't commit because you didn't ask me to.

STATUS: READY
VERIFIED: yes