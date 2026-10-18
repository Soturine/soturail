The README now matches the code. I changed only `README.md`; `src/retry.js` is untouched.

The old README described an API that doesn't exist: `attempts` and `delay` options, a fixed delay, and a rethrow of the last error. The current code uses `retries`, `baseDelayMs`, `factor`, and `shouldRetry`, with exponential backoff and an `AggregateError` when attempts run out. The new README covers:

- **Call signature:** `fn` receives the zero-based attempt number.
- **Options table:** names and defaults (`retries: 3`, `baseDelayMs: 200`, `factor: 2`, `shouldRetry: () => true`).
- **Delay:** `baseDelayMs * factor ** n` before retry `n`, so 200, 400, and 800 ms by default; `factor: 1` gives a fixed delay.
- **Errors:** a non-retryable error before the last attempt is rethrown as-is, while exhausted attempts throw an `AggregateError`.
- **Edge case:** a non-retryable error on the final attempt still produces an `AggregateError`, which the README calls out.
- **Development:** how to run `npm test`, and the runtime requirements.

I checked each claim by running the module against the edge cases (default retries, `retries: 0`, success on a later attempt, `shouldRetry` returning false early and on the last attempt, and a custom `factor`). The existing test passes on Node 24.11.1.

I did not update `docs/pt-BR/visao-geral.md`, which may also describe the old API. I didn't check it since the request was about the README.

STATUS: READY
VERIFIED: yes