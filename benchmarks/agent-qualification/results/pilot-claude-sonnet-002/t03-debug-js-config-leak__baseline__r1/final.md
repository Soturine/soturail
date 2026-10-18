**Root cause:** `mergeConfig` in `src/merge.js` mutated the shared `DEFAULTS` object. For nested objects it called `Object.assign(result[key], …)`, and `result[key]` was still the same object as `DEFAULTS.http`, because the spread `{ ...base }` only copies one level. The first request for `acme` therefore overwrote `DEFAULTS.http.timeoutMs` and `retry.attempts` with 30000 and 5. Every tenant served afterwards inherited those values. That is why it only showed up after a particular tenant had been served, and why it depended on request order.

**Fix:** `mergeConfig` now deep-clones the base and the override values. Nested objects are merged recursively without writing into the inputs, so arrays like `allowedRegions` are no longer shared between configs either.

**Test:** I added a regression test in `test/merge.test.js`. It checks that `DEFAULTS` is unchanged after `acme` is served and that `initech` and `globex` still get the default timeout and retry settings. All 3 tests pass. I did not run the test against the old code to confirm it fails there.

STATUS: READY
VERIFIED: yes