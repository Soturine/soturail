I added per-key `overrides` and a `remaining(key)` method to the limiter, and updated the README. All 5 tests pass (the 3 new ones plus the 2 existing ones).

**Changes**
- `src/limiter.js`: `createLimiter` accepts an optional `overrides` object mapping key to limit. Each override value is validated as a positive integer, and keys without an entry use `limit`. `remaining(key)` returns the budget left in the current window, never negative, and does not consume a request or create state for the key.
- `test/limiter.test.js`: added tests for override behavior, override validation, and `remaining` across a window reset.
- `README.md`: documents `overrides`, the `remaining` method, and an example.

**Choices I made**
- `overrides` is a plain object, not a `Map`, to match the rest of the options. Only own enumerable properties are read, so inherited keys like `constructor` are ignored.
- I did not commit, since you didn't ask for one.

STATUS: READY
VERIFIED: yes