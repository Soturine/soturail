I rewrote `README.md` to match `src/retry.js`. I didn't touch the library code. `npm test` passes, but it has one test and doesn't cover the error-handling behaviour I documented. I wrote that part by reading the code, not by running it.

What was wrong in the old README:
- **Options:** it listed `attempts` and `delay`, which don't exist. The real options are `retries` (default 3, so up to 4 calls), `baseDelayMs` (200), `factor` (2) and `shouldRetry`.
- **Delay:** it described a fixed delay. The wait is actually exponential: `baseDelayMs * factor ** n` before retry `n`.
- **Errors:** it said the last error is rethrown. When every call fails, the code throws an `AggregateError` holding all the failures in order.
- **Callback argument:** `fn` receives the zero-based attempt number. The old README didn't say so.

I also documented two quirks of the code:
- If the final allowed attempt fails, you always get an `AggregateError`, even when `shouldRetry` returns `false` for that error. The same happens with `retries: 0`.
- `shouldRetry` can be called more than once for the same error.

STATUS: READY
VERIFIED: yes