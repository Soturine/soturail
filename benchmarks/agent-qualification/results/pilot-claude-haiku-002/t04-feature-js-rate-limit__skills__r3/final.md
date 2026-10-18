Per-key overrides and `remaining(key)` are in place, and the test suite passes (5/5).

**Changes**

- **`src/limiter.js`**: `createLimiter` takes an optional `overrides` option. It can be a plain object or a `Map`, and each value is validated as a positive integer, the same rule as `limit`. `tryAcquire` uses the override for listed keys and the default `limit` for everything else.
- **`src/limiter.js`**: `remaining(key)` returns the requests left in the current window, never below 0. It does not consume budget or create counter entries.
- **`test/limiter.test.js`**: added tests for override behavior, `Map` input, invalid override values, and `remaining` across a window reset.
- **`README.md`**: documented `overrides`, the new `remaining` method, and a usage example.

**Choices I made**

- Overrides accept a plain object or a `Map`, since the request said "map" and objects are the more common JS shape.
- Override values must be positive integers, so a key cannot be fully blocked by setting its limit to 0. Use a different mechanism if you need that.

Nothing is committed; the changes are in the working tree.

STATUS: READY
VERIFIED: yes