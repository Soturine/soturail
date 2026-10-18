**Root cause:** `mergeConfig` in `src/merge.js` copied the top level with a shallow spread, so nested objects such as `http` and `headers` were still shared with `DEFAULTS`. The line `Object.assign(result[key], ...)` then wrote each tenant's overrides straight into those shared objects.

Tenant configs are therefore order-dependent. Once `acme` is requested, `DEFAULTS.http` holds `timeoutMs: 30000` and `retry.attempts: 5`, and every later tenant inherits them. The same happens to `globex`'s `x-tenant` header. Whether a tenant sees the leak depends on which tenants were served earlier in the same process, which is why it can't be reproduced reliably.

**Fix:**
- `src/merge.js`: clone `base` with `structuredClone`, and replace the `Object.assign` mutation with a plain recursive assignment. Neither input is modified now, and the returned config shares no objects with `DEFAULTS`.
- `test/merge.test.js`: added a regression test asserting that `mergeConfig` leaves both `base` and `override` unchanged.

**Verification (after the change):**
- Repro script: after `configFor("acme")` and `configFor("globex")`, `configFor("initech")` returns the defaults (`timeoutMs: 5000`, `attempts: 2`, no `x-tenant`). Before the fix it returned acme's values.
- `npm test`: 3/3 pass.

I did not run the new regression test against the old code to confirm it fails there. The repro script did show the bug on the old code.

STATUS: READY
VERIFIED: yes