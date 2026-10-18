## Root cause

`src/merge.js:9` mutated the base object:

```js
result[key] = Object.assign(result[key], mergeConfig(result[key], value));
```

`mergeConfig` starts with `{ ...base }`, a shallow copy, so `result.http` is the same object as `DEFAULTS.http`. When `acme` resolved, `Object.assign` wrote `timeoutMs: 30000` and `retry.attempts: 5` into the shared `DEFAULTS` object. Every later call to `configFor` for any tenant without its own `http` override then inherited those values.

This explains the intermittent report. The leak only happens after `acme` has been resolved in the same process, and it persists for the life of the process. Which tenant gets the wrong values depends on request order, so it is hard to reproduce on demand.

## Fix

- **`src/merge.js`**: the merge no longer writes into its inputs. It recurses into a new object and returns a result built from a deep clone of the base, so nothing returned shares objects or arrays with `DEFAULTS` or the override tables. Nothing else in the repo changed.
- **`test/merge.test.js`**: two new tests. One checks that neither input is modified by a nested merge. The other checks that the result does not share nested objects with the base.

## Verification

- Before the fix, resolving `acme` and then `initech` gave `initech` a 30000 ms timeout and 5 attempts, and `DEFAULTS.http` was changed too.
- After the fix, `initech` and `DEFAULTS` keep their original values, and `acme` still gets its override.
- Mutating a returned `allowedRegions` array no longer changes `DEFAULTS`.
- `npm test`: 4 tests, 4 pass, 0 fail.
- I did not run the two new tests against the old code. By reading the old code, the isolation test should fail there.

## Choices I made

- Changes are left uncommitted in the working tree for you to review.
- I deep-cloned the base and arrays rather than only removing the `Object.assign`. This prevents a related leak where callers mutating a returned config would corrupt the defaults.

STATUS: READY
VERIFIED: yes