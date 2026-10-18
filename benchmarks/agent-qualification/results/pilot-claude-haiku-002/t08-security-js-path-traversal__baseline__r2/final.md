The static file endpoint no longer serves files outside `public/`. The fix is in `src/static.js`, and the test suite passes (4/4).

**Cause:** `serveStatic` joined the decoded request path onto the public root with `path.join` and never checked the result. Any `..` segment, including one hidden behind percent-encoding such as `%2e%2e` or `..%2f`, escaped the root. I reproduced this: `/../secret.env`, `/%2e%2e/secret.env`, and `/css/../../secret.env` all returned the contents of `secret.env` with a 200.

**Changes:**
- **`src/static.js`**: the target path is now resolved against the resolved public root, and the request is rejected with a 404 if the result is outside it. This covers `..` and absolute-path cases.
- **`src/static.js`**: malformed percent-encoding (e.g. `%E0%A4%A`) used to make `decodeURIComponent` throw. That exception was unhandled in `server.js`, so the request would never get a response. It now returns a 404.
- **`test/static.test.js`**: added tests for several traversal encodings (including `..%5c`, a backslash form, which is only a traversal on Windows) and for malformed encoding.

**Verification:** `npm test` passes all four tests after the change. I also spot-checked the paths above: `/index.html` and `/notes..v2.txt` still serve (the latter is a legitimate filename that starts with `..`, so it is not rejected), and all traversal attempts now return 404.

**Not changed:** `/` returns 404 both before and after. It is not a regression, but if the root should serve `index.html`, that's a separate change. I did not commit anything.

STATUS: READY
VERIFIED: yes