The static file endpoint could serve files outside `public/`, and I've fixed it. The test suite passes (4/4), including new regression tests for the traversal cases.

**The bug:** `serveStatic` in `src/static.js` joined the decoded request path onto the public root with `path.join` and never checked the result. `path.join` collapses `..` but doesn't confine the result, so requests reached `secret.env` in the project root. I reproduced this before changing anything. `/../secret.env`, `/%2e%2e/secret.env` and `/..%2fsecret.env` all returned 200 with the file contents. A malformed escape such as `/%E0%A4%A` also threw a `URIError` out of the handler.

**The fix (`src/static.js`):**
- The resolved target must equal the public root or sit inside it, otherwise the response is 404.
- `decodeURIComponent` is inside a `try`, so malformed input returns 404.

**Tests (`test/static.test.js`):** added cases for the escaping variants (including a backslash form) and the malformed escape. After the change, all the exploit payloads return 404 and `/css/site.css` still returns 200.

**Not covered:** the check is lexical. A symlink inside `public/` that points outside it would still be followed. That's a separate concern and I haven't addressed it.

I left the changes uncommitted on `main`.

STATUS: READY
VERIFIED: yes