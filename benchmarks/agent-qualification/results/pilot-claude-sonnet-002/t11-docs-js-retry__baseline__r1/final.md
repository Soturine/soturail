I rewrote `README.md` to match `src/retry.js`, which I left unchanged. The README is not something tests can check, so I compared it against the code by reading. The one existing test still passes.

The old README described `attempts` and `delay` options that no longer exist. The new one covers:
- **Options:** `retries` (default 3, so at most `retries + 1` calls), `baseDelayMs` (200), `factor` (2) and `shouldRetry`.
- **Backoff:** the wait before retry `n` is `baseDelayMs * factor ** n`, so 200, 400 and 800 ms with the defaults.
- **Attempt number:** `fn` receives the zero-based attempt number.
- **Errors:**
  - If `shouldRetry` rejects an error while retries remain, that error is rethrown as is.
  - If every call fails, an `AggregateError` holds all the failures in order.
  - If `shouldRetry` rejects the error from the final allowed call, you also get the `AggregateError`, not the bare error.
- **`shouldRetry` calls:** it can be called more than once for the same error.

STATUS: READY
VERIFIED: yes