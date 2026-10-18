`createLimiter` now takes an optional `overrides` map, and the limiter has a `remaining(key)` method. I ran `npm test` after the last change and all 5 tests pass, including 3 new ones.

- **Overrides:** `overrides` can be a plain object or a `Map` of key to limit. An overridden key uses its own limit instead of `limit`. Every override must be a positive integer, or `createLimiter` throws a `RangeError`.
- **`remaining(key)`:** it returns the key's limit (override or default) minus the requests used in the current window, never below 0. It only reads the count, so calling it doesn't use up any of the key's budget.
- **README:** it documents the `overrides` option and both methods, and the example now shows an override and `remaining`.

The changes are in `src/limiter.js`, `test/limiter.test.js` and `README.md`. I haven't committed anything.

STATUS: READY
VERIFIED: yes