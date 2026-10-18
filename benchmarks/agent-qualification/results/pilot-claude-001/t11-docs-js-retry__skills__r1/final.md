I rewrote `README.md` to match `src/retry.js`. I didn't change any library code.

The old README described options `attempts` and `delay` and a fixed delay between calls, and said the last error is rethrown. The code does something different, so the README now says:
- **Options:** `retries` (default 3, counted after the first call), `baseDelayMs` (200), `factor` (2) and `shouldRetry` (always true by default).
- **Backoff:** the wait before retry `n` is `baseDelayMs * factor ** n`, so 200, 400, 800 ms by default, and there is no wait after the last attempt.
- **Callback argument:** `fn` receives the zero-based attempt number.
- **Errors:**
  - If `shouldRetry` returns false while retries remain, that error is rethrown as-is.
  - If every call fails, an `AggregateError` is thrown with all the errors in order.
  - That includes the case where `shouldRetry` rejects the final failure.
  - With `retries: 0`, the failure comes back as a one-entry `AggregateError`.

I ran a short script that confirmed the error behaviour: `retries: 0`, an immediate `shouldRetry` rejection, and a rejection on the final attempt. I didn't run the repo's test suite or check the backoff timings.

STATUS: READY
VERIFIED: yes