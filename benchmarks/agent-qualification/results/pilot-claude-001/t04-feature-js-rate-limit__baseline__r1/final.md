`createLimiter` now takes an optional `overrides` map, and the limiter has a `remaining(key)` method. The tests pass (3 of 3), including a new one for this. The diff is back to a clean 37 added lines and 2 removed after I fixed line endings I had briefly messed up.

- **`overrides`:** it can be a plain object or a `Map`, mapping key to limit. Each override replaces the default `limit` for that key. Every value must be a positive integer, otherwise `createLimiter` throws a `RangeError`, like the other options. Keys with no override use `limit`, and inherited names such as `"toString"` don't pick up an override by accident.
- **`remaining(key)`:** it returns the key's limit (its override or the default) minus what it has used in the current window, and never goes below 0. It doesn't consume budget or add the key to the limiter's internal counters.
- **README:** it now documents `overrides` and both methods, and the usage example shows `remaining`.

The changes are in `src/limiter.js`, `README.md` and `test/limiter.test.js`.

STATUS: READY
VERIFIED: yes