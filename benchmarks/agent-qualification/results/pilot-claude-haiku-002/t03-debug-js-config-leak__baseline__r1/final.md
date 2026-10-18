## Root cause

`mergeConfig` in `src/merge.js` makes a shallow copy of `base` (`{ ...base }`), so `result.http` is the same object as `DEFAULTS.http`. When an override contains a nested object, the old code ran `Object.assign(result[key], ...)`, which writes into that shared object. So the first `configFor("acme")` call overwrote `DEFAULTS.http` (timeout 30000, attempts 5) for the whole process. Every later tenant that reads `DEFAULTS` gets acme's settings. Globex's `headers` override has the same effect and leaks `x-tenant` into everyone else.

This explains the intermittent production symptom. Which tenant's settings a given request sees depends on which override ran first in that process, so it only shows up on some instances and request orders. The README already says "neither input is modified," and this code breaks that promise.

I reproduced it locally: after `configFor("acme")`, `configFor("initech")` returned `timeoutMs: 30000` and `attempts: 5`.

## Fix

- **`src/merge.js`**: the result is built from fresh objects. Nested plain objects are merged recursively without writing into `base` or `override`. Values copied from either input go through `structuredClone`, so the returned config shares no nested objects with `DEFAULTS`. Mutating a returned config can't change `DEFAULTS` either.
- **`test/tenants.test.js`** (new): tests that acme's overrides don't reach initech, that `DEFAULTS` is unchanged after `configFor` calls, that returned objects don't share references with `DEFAULTS`, and that `mergeConfig` leaves both inputs unmodified.

One trade-off: `structuredClone` throws on functions. Tenant config is plain data, so this shouldn't matter, but a config that holds functions would now fail loudly.

## Verification

- `npm test`: 6/6 pass.
- Against the original `merge.js`, the 4 new tests fail and the 2 existing tests pass. So the new tests catch the bug.
- I did not reproduce the failure under production load or traffic. The fix is verified by unit tests and the reproduction script, not by a production run.

Nothing is committed. The changes are in the working tree: `M src/merge.js` and `?? test/tenants.test.js`.

STATUS: READY
VERIFIED: yes