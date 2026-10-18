I rewrote `README.md` to match what `src/retry.js` does now. I didn't touch the library code.

- **Options:** the old `attempts` and `delay` options are gone. The README now documents:
  - `retries` (default 3, so at most 4 calls)
  - `baseDelayMs` (default 200)
  - `factor` (default 2)
  - `shouldRetry` (default `() => true`)
- **Backoff:** the delay is exponential, `baseDelayMs * factor ** n`, not a fixed wait. That is 200, 400 and 800 ms with the defaults.
- **Attempt number:** `fn` is called with the zero-based attempt number.
- **Errors:** when every call fails, the library throws an `AggregateError` holding all the failures in order, not the last error. If `shouldRetry` returns `false` before the final attempt, that error is rethrown as-is straight away. If it returns `false` on the final attempt, you still get an `AggregateError`. That last case is easy to miss, so the README states it.

I ran the two error cases against the code and both behaved as documented. `npm test` passes, but it has only one test, so it doesn't cover these cases.

STATUS: READY
VERIFIED: yes