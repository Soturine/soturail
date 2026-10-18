I rewrote `README.md` so it matches `src/retry.js`. The library code is unchanged, and `git status` shows only `README.md` modified.

The old README described options that don't exist (`attempts`, `delay`) and said the last error is rethrown. The code actually takes `retries`, `baseDelayMs`, `factor` and `shouldRetry`, and throws an `AggregateError` when all attempts fail.

The new README covers:
- The `fn(attempt)` signature, with a 0-based attempt number.
- All four options and their defaults.
- The backoff formula, `baseDelayMs * factor ** n`, which gives 200, 400, 800 ms with the defaults.
- Results and errors: success, a non-retryable error rethrown as-is, and the `AggregateError` with the `errors` array.
- `npm test`, and the Node 16.6+ requirement that follows from `AggregateError` and `Array.prototype.at`.

I also probed the edge cases from a scratch script outside the repo. That confirmed the behaviour above, plus one quirk the README now documents: if `shouldRetry` returns `false` on the final attempt, the error is still wrapped in an `AggregateError`, and `shouldRetry` is called once more with the last error. The code's doc comment says a `false` result rethrows immediately, which is only true before the last attempt.

I didn't change the code to fix that quirk, since you asked for documentation only. If you want the raw error rethrown on the final attempt too, that's a small change in `src/retry.js`.

The example imports from `"patient-retry"`, the package name, which resolves through `main`. The old README used a relative `./src/retry.js` path.

Tests: `npm test` passes (1/1), both before and after the edit.

STATUS: READY
VERIFIED: yes