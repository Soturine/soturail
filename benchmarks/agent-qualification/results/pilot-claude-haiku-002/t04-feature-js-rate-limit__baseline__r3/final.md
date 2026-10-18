Both changes are in: `createLimiter` accepts an `overrides` map, and the limiter exposes `remaining(key)`. The README is updated to match. All 4 tests pass (`npm test`), including new tests for overrides and `remaining`.

- **`overrides`**: a plain object of key → limit. Each value is checked as a positive integer, and a bad value throws a `RangeError` at creation time, the same way `limit` and `windowMs` do. Keys not in the map use `limit`.
- **`remaining(key)`**: returns the budget left in the current window, floored at 0. It only reads state, so calling it never consumes a request and never creates a counter entry.

Choices I made that you may want to change:
- `remaining` for a key with no requests in the current window returns its full limit (the override if one exists).
- I did not commit the changes.

STATUS: READY
VERIFIED: yes