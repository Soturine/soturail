**Root cause:** `mergeConfig` in `src/merge.js` mutated the shared base object. For nested objects it ran `Object.assign(result[key], ...)`. `result` is only a shallow copy of `base`, so `result[key]` is the same object as `DEFAULTS.http`. The first request for a tenant with overrides, such as `acme`, wrote its timeout of 30000 and 5 retry attempts into the global `DEFAULTS`. Every tenant served afterwards inherited those values. That's also why you couldn't reproduce it reliably: it only shows up after an overriding tenant has been served first.

**Fix:** nested objects are now merged into a new object (`result[key] = mergeConfig(result[key], value)`), so `DEFAULTS` is never modified.

I added a regression test in `test/merge.test.js` that checks the base config is unchanged after a merge. All 3 tests pass with `node --test`.

One limit remains: values that aren't overridden, such as the `allowedRegions` array, are still shared by reference between tenant configs. Nothing in the repo mutates them, so I left them alone.

STATUS: READY
VERIFIED: yes