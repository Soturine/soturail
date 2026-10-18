Per-key `overrides` and `remaining(key)` are in `src/limiter.js`, with new tests and README updates. `npm test` passes all 4 tests.

Choices I made that you may want to change:

- **`overrides` is a `Map`**, not a plain object, so any key type works. Passing anything else throws a `TypeError`. Each value must be a positive integer, or a `RangeError` is thrown.
- **`remaining(key)` does not consume budget** and never returns a negative number. It reads the current window without creating a counter entry.
- **`remaining` for a key with no requests** returns its full limit (its override if set, otherwise `limit`).

Nothing is committed.

STATUS: READY
VERIFIED: yes