**Root cause:** `mergeConfig` in `src/merge.js` mutated the shared `DEFAULTS` object. For nested objects it ran `Object.assign(result[key], …)`, and `result[key]` was the same `http` object that `DEFAULTS` holds, because `{ ...base }` only copies one level. The first request for a tenant with overrides (`acme`) wrote `timeoutMs: 30000` and `retry.attempts: 5` into `DEFAULTS` itself. Every tenant served after that inherited those values. This is why it was hard to reproduce: it depends on which tenant happens to be served first.

**Fix:** `mergeConfig` now deep-clones the base and the override values, and recurses without mutating anything. The result shares no nested objects or arrays with `DEFAULTS`. That also stops one tenant from changing `allowedRegions` or `headers` for the others.

I added a regression test in `test/merge.test.js`. It checks that `DEFAULTS` is unchanged after `configFor("acme")`, that mutating the returned `allowedRegions` doesn't leak, and that `initech` still gets 5000 ms and 2 attempts. All 3 tests pass.

STATUS: READY
VERIFIED: yes