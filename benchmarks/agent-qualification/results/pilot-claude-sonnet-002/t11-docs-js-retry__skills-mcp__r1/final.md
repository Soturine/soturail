I rewrote `README.md` to match `src/retry.js`. I didn't run the tests or the code. I checked the new text only by reading the source, and I didn't touch the library code.

What changed in the README:
- **Options:** the old `attempts` and `delay` options are gone. The options are now `retries` (default 3, so at most `retries + 1` calls), `baseDelayMs` (default 200), `factor` (default 2) and `shouldRetry` (default `() => true`).
- **Backoff:** the wait before retry `n` is `baseDelayMs * factor ** n`, so 200, 400 and 800 ms with the defaults. It was described as a fixed delay.
- **Callback argument:** `fn` now receives the zero-based attempt number.
- **Errors:** when every call fails, the code throws an `AggregateError` holding all the failures in order, not just the last error. If `shouldRetry` returns false while retries remain, that error is rethrown as-is straight away.
- **Edge case:** if the last allowed call fails with an error that `shouldRetry` rejects, you still get the `AggregateError`. With `retries: 0`, any failure is wrapped the same way. I documented this because it follows from the code, though it may not be what the author intended.

STATUS: READY
VERIFIED: no