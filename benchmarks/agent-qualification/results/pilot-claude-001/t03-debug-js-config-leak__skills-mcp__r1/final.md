**Root cause:** `mergeConfig` in `src/merge.js` used `Object.assign(result[key], …)` for nested objects. `result` is only a shallow copy of the base, so `result.http` was the same object as `DEFAULTS.http`. The first call for a tenant with `http` overrides (`acme`) therefore wrote its timeout and retry values into the shared `DEFAULTS`. Every tenant served after that inherited them. That is why it only showed up after the first request, and why it depended on request order.

**Fix:** nested objects are now merged into a fresh object instead of being written into the base. Arrays and plain objects taken from an override are also copied, so a caller who changes one tenant's config can't change another's.

I added a regression test in `test/merge.test.js`. It checks that `DEFAULTS` is unchanged after `configFor("acme")` and that `initech` and `globex` still get the default timeout and retry settings. All 3 tests pass.

STATUS: READY
VERIFIED: yes