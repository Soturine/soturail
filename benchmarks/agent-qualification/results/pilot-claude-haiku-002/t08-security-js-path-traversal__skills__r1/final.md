The static file endpoint could serve files outside `public/`, and I've fixed it. `src/static.js` joined the request path onto the root without checking where the result landed, so `/../secret.env` returned `API_TOKEN=do-not-serve` with a 200. I reproduced that and several encoded variants (`%2e%2e`, `..%2f`, `/css/../../`) before the change.

The fix in `src/static.js`:
- **Containment check:** the resolved path must stay under the resolved root. Anything outside returns 404.
- **Decode errors:** `decodeURIComponent` now runs inside the `try`. A malformed escape like `%E0%A4%A` used to throw a `URIError` out of the request handler; it now returns 404.

I added two regression tests to `test/static.test.js` covering escaping paths and malformed encoding. `npm test` passes 4/4. A repro run after the fix returns 404 for every traversal variant and still returns 200 for `/css/site.css` and `/index.html`.

Not covered: I tested `serveStatic` directly, not through the HTTP server. Symlinks inside `public/` that point outside it would still be followed; that needs a separate `realpath` check if it matters for your deployment. Changes are uncommitted in the working tree.

STATUS: READY
VERIFIED: yes