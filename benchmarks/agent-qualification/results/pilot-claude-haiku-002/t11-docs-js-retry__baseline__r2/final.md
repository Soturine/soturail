I rewrote `README.md` to match the current code. The README was the only file changed; `src/retry.js` is untouched and I did not commit.

The old README documented options that don't exist (`attempts`, `delay`) and said the last error is rethrown, which is wrong. The new README covers:

- **Signature:** `fn` receives the zero-based attempt number.
- **Options:** `retries` (default 3), `baseDelayMs` (200), `factor` (2, exponential backoff), and `shouldRetry`.
- **Errors:** exhaustion throws an `AggregateError` holding every failure, including when `retries` is 0. A non-retryable error before the final attempt is rethrown as-is.

I checked the error and timing behavior with scratch scripts outside the repo. The delays were 0, 56, 163, 379 ms with `baseDelayMs: 50`, and `shouldRetry` is called twice only when it stops retrying early.

**Code quirk I documented rather than fixed:** if `shouldRetry` returns `false` on the final attempt, the result is still an `AggregateError`, not the bare error. Only an earlier non-retryable failure is rethrown unwrapped. This is inconsistent, and you may want to decide which behavior is intended.

`npm test` passes (1/1). That run came after the last README edit, and the change touched only the README.

STATUS: READY
VERIFIED: yes