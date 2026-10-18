# patient-retry

Retry an async function with exponential backoff.

```js
import { retry } from "./src/retry.js";

let n = 0;
const value = await retry(async () => { n += 1; if (n < 3) throw new Error("flaky"); return "ok"; }, { retries: 3, baseDelayMs: 1, factor: 2 });
console.log(value);
```

Options:

| option | default | meaning |
|---|---|---|
| `retries` | `3` | retries after the first call (at most `retries + 1` calls) |
| `baseDelayMs` | `200` | delay before the first retry |
| `factor` | `2` | backoff multiplier: retry n waits `baseDelayMs * factor ** n` |
| `shouldRetry` | `() => true` | return `false` to rethrow an error immediately |

Errors: when `shouldRetry` returns `false` the original error is rethrown. When every call fails, an `AggregateError` is thrown whose `errors` lists every failure in order.

`fn` receives the zero-based attempt number.
