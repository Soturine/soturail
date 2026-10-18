I rewrote `README.md` to match the current behavior of `src/retry.js`. The library code is unchanged, and the change is not committed.

The old README documented options that don't exist (`attempts`, `delay`) and described the wrong behavior. The new version covers:

- **Options:** `retries` (default 3, so up to 4 calls), `baseDelayMs` (200), `factor` (2), and `shouldRetry`, which the old README didn't mention.
- **Backoff:** exponential, not fixed. Waits are 200, 400, and 800 ms with the defaults, and there is no wait after the last attempt.
- **Callback argument:** `fn` receives the zero-based attempt index.
- **Errors:** exhaustion throws an `AggregateError` with every failure in `errors`, not the last error.

I checked these claims by running the code, including the default timings and the `AggregateError` on exhaustion.

One behavior is not what the code's JSDoc says. The JSDoc says a `shouldRetry` of `false` rethrows the error immediately. That holds before retries run out, but if the final attempt's error gets `false`, the function still throws an `AggregateError`. The README documents this as-is. The fix would be a one-line change in `src/retry.js`, which you asked me not to make, so I left it alone.

`npm test` passes (1/1) after the change.

STATUS: READY
VERIFIED: yes