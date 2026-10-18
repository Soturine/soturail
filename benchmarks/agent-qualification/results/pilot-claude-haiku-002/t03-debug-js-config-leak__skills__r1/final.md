Later tenants were getting `acme`'s timeout and retry settings because `mergeConfig` was writing into the shared defaults object. The fix is in place and the test suite passes (5/5). I haven't committed anything.

**Root cause**

`mergeConfig` starts with a shallow copy (`{ ...base }`), so nested objects like `DEFAULTS.http` and `DEFAULTS.http.retry` are still shared with the module-level defaults. When a tenant override has nested keys, the recursive branch ran `Object.assign(result[key], ...)`, which wrote the tenant's values straight into those shared objects. The first tenant to be configured (`acme`: `timeoutMs: 30000`, `attempts: 5`) therefore changed the defaults for the whole process. Every later `configFor()` call read the mutated defaults, which is why the problem depends on request order and is hard to reproduce.

**Fix**

- `src/merge.js`: the nested branch now assigns `mergeConfig(result[key], value)`, which returns a new object. Inputs are never mutated.
- `src/tenants.js`: `configFor` returns `structuredClone(...)` of the merged result. Non-overridden branches are still shared references to `DEFAULTS` after a shallow merge, and this stops callers from changing shared state through the returned config.

**Verification**

- Before the fix, running `acme` and then `initech` gave `initech` a `timeoutMs` of 30000 and `attempts` of 5, and `DEFAULTS` was mutated too. After the fix, `initech` gets 5000 and 2, and `DEFAULTS` is unchanged.
- New tests in `test/tenants.test.js` cover cross-tenant leakage and the independence of returned copies. They fail against the old code and pass with the fix.
- New test in `test/merge.test.js` checks that `mergeConfig` leaves its inputs unmodified. I checked it only against the fixed code, not the old code.
- `npm test`: 5 pass, 0 fail.

**Not done**

- I did not commit or push. The changes are in the working tree.
- The `.soturail` project data and the `soturail` skill files weren't used for this debug, because the failing code path was readable directly.

STATUS: READY
VERIFIED: yes