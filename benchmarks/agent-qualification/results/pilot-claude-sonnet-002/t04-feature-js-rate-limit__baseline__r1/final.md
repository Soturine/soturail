`createLimiter` now takes an optional `overrides` map, and the limiter has a `remaining(key)` method. The full test suite passes (5 tests, including 3 new ones), and the README documents both.

- **`overrides`:** it accepts a plain object or a `Map`, keyed by the same key you pass to `tryAcquire`. A key with an override uses that limit instead of `limit`. Each override value must be a positive integer, otherwise it throws a `RangeError`, the same as `limit`.
- **`remaining(key)`:** it returns the key's limit (or its override) minus what it has used in the current window, never below 0. It doesn't consume any budget. A key that hasn't been seen yet, or whose window has rolled over, gets its full limit back.
- **Key names:** override lookups don't touch the object prototype, so a key like `"constructor"` still gets the default limit.
- **Tests:** the new tests are in `test/limiter.test.js` and cover overrides (object and `Map`), `remaining` across a window reset, and override validation.

STATUS: READY
VERIFIED: yes