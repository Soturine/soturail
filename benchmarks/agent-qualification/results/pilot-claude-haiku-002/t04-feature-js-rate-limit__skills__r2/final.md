Added per-key overrides and `remaining(key)` to the limiter, with tests and README updates. All 4 tests pass (`npm test`).

Changes:

- **`src/limiter.js`**: `createLimiter` accepts an optional `overrides` argument. Each key's limit comes from `overrides` if present, otherwise from `limit`. Override values are validated as positive integers when the limiter is created. `remaining(key)` returns the requests left in the current window, never negative. It reads state without consuming budget or creating a bucket.
- **`test/limiter.test.js`**: added tests for override validation, override behaviour, and `remaining` across a window reset.
- **`README.md`**: documents `overrides`, `remaining`, and `tryAcquire`, with an example.

Choices I made:
- `overrides` is a `Map`, not a plain object, because the request said "map" and a `Map` avoids prototype-key issues. Say if you want a plain object instead.
- `remaining` is read-only, so calling it doesn't change the count.

I didn't commit anything, since you didn't ask for a commit.

STATUS: READY
VERIFIED: yes