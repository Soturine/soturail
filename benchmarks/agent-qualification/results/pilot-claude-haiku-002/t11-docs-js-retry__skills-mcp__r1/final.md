I rewrote `README.md` to match the current `src/retry.js`. The library code is unchanged and nothing is committed.

The old README documented `attempts` and a fixed `delay`. The code now takes `retries`, `baseDelayMs`, `factor` (exponential backoff), and `shouldRetry`. The new README covers:

- The `fn(attempt)` signature, with a 0-based attempt index.
- All four options with their defaults. Defaults are 3 retries (4 calls total), 200 ms base delay, factor 2.
- The delay formula, with the default sequence 200, 400, 800 ms and no delay after the last attempt.
- The three outcomes: a value on success, the original error when `shouldRetry` returns `false` early, and an `AggregateError` carrying every failure when all attempts fail.

I checked each claim by running the code, not just reading it. Calls at `baseDelayMs: 50` landed at about 0, 50, 160, and 360 ms, which matches the formula. The early-stop and final-attempt cases behaved as described.

One behavior is not obvious from the source. If `shouldRetry` returns `false` on the final attempt, you get an `AggregateError`, not the raw error. The README states this directly. You may want to fix it in the code, since the JSDoc says "rethrown immediately." I didn't change it because you asked for docs only.

The test suite has a single test and passes (`npm test`). It does not cover the `shouldRetry` paths, so the documentation is verified by my probes rather than by tests.

STATUS: READY
VERIFIED: yes