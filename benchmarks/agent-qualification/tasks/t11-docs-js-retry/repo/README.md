# patient-retry

Retry an async function.

```js
import { retry } from "./src/retry.js";

const value = await retry(() => fetchThing(), { attempts: 5, delay: 100 });
```

Options:

| option | default | meaning |
|---|---|---|
| `attempts` | `5` | total number of calls |
| `delay` | `100` | fixed milliseconds between calls |

Errors: after the last attempt the last error is rethrown.
