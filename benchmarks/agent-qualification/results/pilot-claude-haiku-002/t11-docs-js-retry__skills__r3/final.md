I rewrote `README.md` to match the code. I didn't touch `src/` or the tests.

The old README documented options that don't exist (`attempts`, `delay`) and a fixed delay. The code uses `retries`, `baseDelayMs`, `factor` (exponential backoff), and `shouldRetry`, and it passes the attempt index to `fn`. The new README covers the signature, defaults, delay schedule (200, 400, 800 ms with defaults), return value, and error behavior. I checked the error behavior by running the function directly.

One behavior is probably unintended, and I documented it rather than changing it. If `shouldRetry` returns `false` on the final allowed call, `retry` throws an `AggregateError` instead of the original error. Every other non-retryable error is rethrown as-is. The cause is the post-loop check in `src/retry.js`, which uses `errors.length <= retries`. Fixing it is a code change, so I left it for you to decide.

The existing test passes (`npm test`, run after the final edit on Node 24.11.1). The new README's examples are illustrative and weren't executed.

STATUS: READY
VERIFIED: yes