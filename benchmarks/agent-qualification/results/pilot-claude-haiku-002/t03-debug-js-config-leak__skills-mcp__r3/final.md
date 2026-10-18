## Root cause

`src/merge.js:9` mutated the base config. `mergeConfig` does a shallow copy (`{ ...base }`), so nested objects such as `DEFAULTS.http` and `DEFAULTS.http.retry` are still shared with the module-level `DEFAULTS`. The line `Object.assign(result[key], mergeConfig(result[key], value))` then wrote tenant overrides straight into those shared objects.

The result is process-wide state. The first tenant with nested overrides, such as `acme`, overwrote `DEFAULTS.http.timeoutMs` and `DEFAULTS.http.retry.attempts`, and every later call to `configFor` picked up those values. The same applies to `globex`'s `x-tenant` header, which leaks into `DEFAULTS.headers`. This explains the intermittent production symptom: a tenant only gets the wrong settings if a tenant with nested overrides was served earlier in the same process. The request order and worker reuse change which tenant that is, which is why it doesn't reproduce reliably.

I reproduced it before the fix. After `configFor("acme")`, `configFor("initech")` returned `timeoutMs: 30000` and `attempts: 5`.

## Fix

- `src/merge.js:9`: assign the freshly merged object instead of writing into `result[key]`. `mergeConfig` no longer mutates its inputs.
- `test/merge.test.js`: added a test that checks the base config is not mutated by a merge.
- `test/tenants.test.js` (new): checks that a tenant override does not leak into a later tenant, and that `DEFAULTS` is unchanged after a lookup.

## Verification

- Reproduction after the fix: `acme` gets 30000 / 5 as intended, and `initech` gets the defaults 5000 / 2.
- `npm test`: 5 pass, 0 fail.

I haven't committed anything. The working tree has three modified or new files.

STATUS: READY
VERIFIED: yes