**Root cause:** `mergeConfig` in `src/merge.js` used `Object.assign(result[key], …)` for nested objects. `result` is only a shallow copy of `base`, so `result.http` was the same object as `DEFAULTS.http`, and `Object.assign` wrote into it. The first request from a tenant with an `http` override (`acme`) permanently changed the shared defaults to `timeoutMs: 30000` and `retry.attempts: 5`. Every tenant served after that inherited those values. This also explains why it was hard to reproduce: it depends on which tenant is served first.

**Fix:** `mergeConfig` now builds a fresh object at every level and deep-clones values taken from either `base` or `override`, including arrays such as `allowedRegions`. The shared defaults are never mutated or aliased.

**Verification:** I added `test/isolation.test.js` with two tests: tenant overrides don't leak into defaults or other tenants, and a returned config isn't aliased to `DEFAULTS`. With the fix, all 4 tests pass. With the old `merge.js` restored, 2 tests fail. The two original tests in `test/merge.test.js` also pass with the fix.

STATUS: READY
VERIFIED: yes