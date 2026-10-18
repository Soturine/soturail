I rewrote `README.md` to match `src/retry.js`, and I didn't touch the library code. I haven't run the tests or the code. I checked the new text only by reading it against `src/retry.js`.

The old README described a different API. These are the changes:
- **Options:** `attempts` and `delay` are replaced by `retries` (default 3), `baseDelayMs` (default 200), `factor` (default 2) and `shouldRetry`.
- **Delay:** the wait is now exponential, `baseDelayMs * factor ** n` before retry `n` (200, 400, 800 ms by default), not a fixed delay.
- **`fn` argument:** `fn` receives the zero-based attempt number.
- **Errors:** the old "last error is rethrown" is replaced by the actual behaviour:
  - If `shouldRetry` returns `false` while retries remain, that error is rethrown as-is.
  - Otherwise `retry` throws an `AggregateError` holding every failure in order. This includes the case where `shouldRetry` rejects the error on the final call.

STATUS: READY
VERIFIED: no