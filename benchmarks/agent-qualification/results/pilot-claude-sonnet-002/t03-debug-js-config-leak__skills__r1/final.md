**Root cause:** `mergeConfig` in `src/merge.js` used `Object.assign(result[key], ...)` for nested objects. `result` is only a shallow copy of `base`, so `result.http` is the same object as `DEFAULTS.http`. Serving `acme` wrote its 30000 ms timeout and 5 retry attempts into the shared `DEFAULTS`. Every tenant served after that inherited acme's values. This also explains why you couldn't reproduce it reliably: it only shows up after an acme request has been served.

**Fix:** nested objects are now merged with `result[key] = mergeConfig(result[key], value)`. That returns a new object and leaves the base untouched.

**Verification:** I added a regression test to `test/merge.test.js`. It calls `configFor("acme")`, then checks that `DEFAULTS` is unchanged and that `initech` still gets 5000 ms. All 3 tests pass, but I only ran them after the fix, so I didn't watch the new test fail on the old code.

STATUS: READY
VERIFIED: yes