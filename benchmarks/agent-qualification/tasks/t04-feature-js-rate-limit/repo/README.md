# tiny-limiter

Fixed-window rate limiter.

```js
import { createLimiter } from "./src/limiter.js";
const limiter = createLimiter({ limit: 100, windowMs: 60_000 });
limiter.tryAcquire("client-a"); // true while the key has budget in the current window
```

Options:

- `limit` (positive integer, required) — requests allowed per key per window.
- `windowMs` (positive integer, required) — window length.
- `now` (function, optional) — clock, defaults to `Date.now`. Windows start at multiples of `windowMs`.
