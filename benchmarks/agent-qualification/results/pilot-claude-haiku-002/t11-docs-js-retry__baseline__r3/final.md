I rewrote `README.md` to match what `src/retry.js` does now. The library code is unchanged.

The old README was wrong in several places:
- Its example used `attempts` and `delay`, which the code doesn't accept. The options are `retries`, `baseDelayMs`, `factor` and `shouldRetry`.
- It described a fixed delay. The wait is exponential: `baseDelayMs * factor ** n`, so 200, 400, 800 ms with the defaults.
- It didn't mention that `fn` receives the attempt number, the `shouldRetry` option, or the `AggregateError` thrown when retries run out.

I checked the behaviour by running the code, not just reading it. The defaults give at most 4 calls. The non-retryable early-stop case rethrows the original error.

Two quirks in the code are documented as they are, since I was told not to change it:
- A non-retryable error on the final attempt, or any failure with `retries: 0`, comes back wrapped in an `AggregateError`, not as the raw error.
- `shouldRetry` can be called twice for the same error when it stops retries early.

You may want to fix one or both in the code, but that's your call.

Both checks pass: the existing test suite (1 test) passes, and I ran the edge-case probes above.

STATUS: READY
VERIFIED: yes