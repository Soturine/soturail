`createLimiter` now takes an optional `overrides` map, and the limiter has a `remaining(key)` method. All 5 tests pass, including 3 new ones.

- **`overrides`:** you can pass a plain object or a `Map` of key to limit. Each value must be a positive integer, otherwise `createLimiter` throws a `RangeError`. Keys not in the map keep the default `limit`.
- **`remaining(key)`:** it returns the key's limit minus what it has used in the current window, never below 0. It only reads the count, so calling it doesn't use up any of the key's budget. When the window rolls over it goes back to the key's full limit.
- **README:** I added `overrides` to the options list, plus a short example of `overrides` and `remaining`.

The changes are in `src/limiter.js`, `README.md` and `test/limiter.test.js`. I didn't commit anything.

STATUS: READY
VERIFIED: yes