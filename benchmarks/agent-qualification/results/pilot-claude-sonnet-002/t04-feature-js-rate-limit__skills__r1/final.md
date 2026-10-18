`createLimiter` now takes an optional `overrides` map, and the limiter has a `remaining(key)` method. `npm test` passes: the two existing tests plus two new ones.

- **`overrides`:** it can be a plain object or a `Map` of key to limit. Each value must be a positive integer, otherwise `createLimiter` throws a `RangeError`, the same as for `limit`. Keys without an override use the default `limit`.
- **`remaining(key)`:** it returns the key's limit (its override if it has one) minus what it has used in the current window, never below 0. It only reads the counters, so asking about a key doesn't create state for it. After a window rolls over, it reports the full limit again.
- **README:** it now documents `overrides` and both methods, with a short example.
- **Tests:** the new tests are in `test/limiter.test.js`. They cover overrides, `remaining()`, window reset, `Map` input and override validation.

I didn't commit anything.

STATUS: READY
VERIFIED: yes