`createLimiter` now takes an optional `overrides` map, and the limiter has a `remaining(key)` method. All 4 tests pass with `npm test`, including two new ones for these features.

- **`overrides`:** it can be a plain object or a `Map`, mapping key to limit. A key in the map uses its own limit instead of the default `limit`. Each override must be a positive integer, or `createLimiter` throws a `RangeError`.
- **`remaining(key)`:** it returns the limit for that key minus what it has used in the current window, and never goes below 0.
- **README:** it documents the new option and method, with an example.

I haven't committed anything.

STATUS: READY
VERIFIED: yes