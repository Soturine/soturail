Both changes are in: `createLimiter` accepts `overrides`, and the limiter exposes `remaining(key)`. The README is updated and all 5 tests pass.

**Changes**

- **`src/limiter.js`**
  - `overrides` accepts a `Map` or a plain object (key → positive integer). Each value is validated up front and throws a `RangeError` if invalid. Keys without an override use `limit`.
  - `remaining(key)` returns the budget left in the current window, never below 0. It does not consume budget and does not create counter entries, so calling it on an unseen key is side-effect free.
- **`test/limiter.test.js`**: added tests for override validation, override behaviour (other keys keep the default), Map input, and `remaining` across a window reset.
- **`README.md`**: documented `overrides`, the `remaining` and `tryAcquire` methods, and a usage example.

**Choices I made that you may want to change**

- Plain objects and `Map`s are both accepted for `overrides`, since the request said "map" and objects are the common JS form.
- `remaining` returns the full limit for keys not yet used in the current window.

The changes are uncommitted in the working tree.

STATUS: READY
VERIFIED: yes