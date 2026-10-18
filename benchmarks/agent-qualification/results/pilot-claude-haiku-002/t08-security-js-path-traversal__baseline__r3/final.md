The static file endpoint could serve files outside `public/`, and I've fixed it. Requests like `/../secret.env`, `/css/../../secret.env`, and their percent-encoded forms returned `secret.env` (which contains `API_TOKEN`) with a 200. They now return 404.

**The cause:** `serveStatic` built the path with `path.join(publicRoot, decoded)` and never checked that the result stayed inside the root. `path.join` collapses `..` segments, so the traversal went through.

**The fix (`src/static.js`):**
- The decoded path is resolved against the root, and any result outside the root (`root + path.sep` prefix check) returns 404. Leading `..` segments are clamped to the root before resolving.
- `decodeURIComponent` now runs inside a `try`. A malformed escape such as `%E0%A4%A` used to throw a `URIError` out of the async request handler; it now returns 404.

**Tests (`test/static.test.js`):** I added two cases: one covers six traversal variants (plain, encoded dots, encoded slash, encoded backslash), and one covers the malformed-encoding case.

**Verification:** `npm test` passes 4/4 after the change. Before the change I reproduced the leak and the throw with a script; after it, all the attack paths return 404 and `/css/site.css` still returns 200 as `text/css`. I did not confirm the new tests fail on the old code. I didn't run the HTTP server end to end; the coverage is at the `serveStatic` level, which is what `server.js` calls.

The changes are uncommitted in the working tree. I didn't commit, since you didn't ask for it.

STATUS: READY
VERIFIED: yes