I rewrote `README.md` to match the current behavior of `src/retry.js`. No library code was changed, and I did not commit.

The old README documented `attempts` and `delay` options and said the last error is rethrown. Neither matches the code, which takes `retries`, `baseDelayMs`, `factor`, and `shouldRetry`, and throws an `AggregateError` when attempts are exhausted. The new README covers:

- **Signature:** `fn` receives the zero-based attempt index, and sync or async functions both work.
- **Options:** a table with the real names and defaults (`retries: 3`, `baseDelayMs: 200`, `factor: 2`, `shouldRetry: () => true`).
- **Delay schedule:** `baseDelayMs * factor ** n` before retry `n`, so 200/400/800 ms by default. No jitter, no delay cap, and no wait after the final failure.
- **Errors:** a non-retryable error is rethrown as-is. Exhausted retries throw an `AggregateError` whose `errors` array holds every failure.

I checked these claims by running the code from a scratch script outside the repo. That also surfaced one quirk, which the README now notes: when `shouldRetry` stops the loop early, it is called once more on the final error, so it should be side-effect free.

Verification: `npm test` passes (1/1) after the final edit. The scratch script output matched every documented claim.

STATUS: READY
VERIFIED: yes