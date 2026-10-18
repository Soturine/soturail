Per-key overrides and `remaining(key)` are in place in `src/limiter.js`, and the README is updated. All 5 tests pass (`npm test`), including new ones for overrides, validation, and `remaining`.

- **`overrides`**: accepts a plain object or a `Map` of key → limit. Each value must be a positive integer, or `createLimiter` throws a `RangeError`. An override replaces `limit` for that key only. The map is copied at creation, so later changes to the caller's object are not seen. I chose that to keep lookups simple; say if you want live reads instead.
- **`remaining(key)`**: returns the requests left for that key in the current window, never negative. It does not consume budget and does not create counter entries for unseen keys.

I did not commit; the changes are in the working tree on `main`.

STATUS: READY
VERIFIED: yes