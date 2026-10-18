I added per-key overrides and `remaining(key)` to the limiter, updated the README, and added tests. All 5 tests pass (`npm test`).

Changes:

- **`src/limiter.js`**: `createLimiter` takes an optional `overrides` option. Each override value is validated as a positive integer when the limiter is created, and it replaces `limit` for that key in `tryAcquire`. `remaining(key)` returns `limit(key)` minus the requests made in the current window, floored at 0. It doesn't consume budget or create state for the key.
- **`README.md`**: documents `overrides` and the `tryAcquire` and `remaining` methods.
- **`test/limiter.test.js`**: three new tests covering override behavior, override validation, and `remaining` across window resets.

Choices I made that you may want to change:

- `overrides` is a `Map`, not a plain object, since keys can be arbitrary strings. Passing a plain object would fail, because the code calls `.has` and `.get` on it.
- Changes are uncommitted in the working tree. I didn't commit, since you didn't ask for one.

STATUS: READY
VERIFIED: yes