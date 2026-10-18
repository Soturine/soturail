The bug was a shared-state mutation in `mergeConfig`. It is fixed and covered by regression tests.

**Root cause:** `src/merge.js:9` did `Object.assign(result[key], mergeConfig(...))`. `result` is a shallow copy (`{ ...base }`), so `result.http` is the same object as `DEFAULTS.http`. Resolving the `acme` tenant (`timeoutMs: 30000`, `attempts: 5`) wrote those values into the shared defaults. Every later call to `configFor` then picked them up, including `globex`, `initech`, and any tenant with no overrides. Whether a tenant sees the leak depends on which tenants were resolved earlier in the same process, which explains why it was hard to reproduce.

**Reproduction (before the fix):** after `configFor("acme")`, `configFor("globex")` returned `timeoutMs: 30000` and `attempts: 5`, and `DEFAULTS.http` was changed too.

**Changes:**
- `src/merge.js`: the nested merge now builds a new object (`result[key] = mergeConfig(result[key], value)`) and no longer writes into the base. This also matches the README's claim that neither input is modified, which was false before.
- `src/tenants.js`: `configFor` returns a `structuredClone` of the merged config. Without this, callers that mutate a result could still change shared `DEFAULTS` through untouched sections such as `headers` and `allowedRegions`.
- `test/merge.test.js`: three regression tests. Merge doesn't mutate its inputs; tenant overrides don't leak into later tenant configs; mutating a returned config doesn't change defaults.

**Verification:** `node --test "test/**/*.test.js"` passes 5/5 with the fix. Against the original `src/`, the same tests give 2 pass and 3 fail, so the new tests catch the bug.

**Not done:** I didn't reproduce the production traffic pattern, and I didn't commit. The fix is deterministic for the code path, so I'm fairly confident in it, but a staging run with mixed tenant traffic would be a reasonable last check.

STATUS: READY
VERIFIED: yes