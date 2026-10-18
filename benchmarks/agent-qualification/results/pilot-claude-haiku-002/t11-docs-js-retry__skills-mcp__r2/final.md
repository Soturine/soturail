I rewrote `README.md` to match the current code. The library code and tests are unchanged, and the changes are not committed.

The README had documented options that no longer exist (`attempts`, `delay`). It now covers the real API:

- **Options:** `retries` (default 3), `baseDelayMs` (200), `factor` (2), and `shouldRetry`.
- **Backoff:** the wait before retry *n* is `baseDelayMs * factor ** n`, so the defaults wait 200, 400, and 800 ms, for at most 4 calls.
- **Attempt index:** `fn` receives the zero-based attempt number. The old README didn't mention this.
- **Errors:** a `shouldRetry` refusal before the last call rethrows the raw error. Otherwise, the call throws an `AggregateError` holding every failure.
- **Requirements:** Node.js 16.6 or later, since the code uses `AggregateError` and `Array.prototype.at`.

I checked these claims by running the code in a scratch script before writing them down. The script confirmed the default call count, the delays, both error paths, and that `shouldRetry` can be called twice for one error. That last point is in the README as a note to keep `shouldRetry` free of side effects. `npm test` passes after the change.

The only other stale reference was in `package.json`, which I left alone. The `docs/` folder describes SotuRail, not this library.

STATUS: READY
VERIFIED: yes