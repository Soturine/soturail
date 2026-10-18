The static file endpoint could serve files outside `public/`, and I've fixed it. The fix is in `src/static.js` and is covered by new tests.

**The bug:** `serveStatic` built the file path with `path.join(publicRoot, decoded)` and never checked the result stayed inside the root. A request such as `/../secret.env` (or the encoded `/%2e%2e/secret.env`) therefore read `secret.env` from the repo root, which sits next to `public/`. A second issue: `decodeURIComponent` ran outside any `try`, so a malformed escape such as `%E0%A4%A` threw inside the request handler.

**The fix:**
- Malformed percent-encoding now returns 404 instead of throwing.
- The path is resolved against the resolved public root, and anything that doesn't stay under `root + path.sep` returns 404.

**Tests:** I added two cases to `test/static.test.js`. One covers plain, nested, encoded, and backslash traversal. The other covers malformed encoding. Against the original code, both new tests fail. With the fix, all 4 tests pass (`node --test test/static.test.js`).

**Not done:**
- I didn't run the server end to end over HTTP; the checks call `serveStatic` directly.
- I didn't commit. The changes are in the working tree.
- `server.js` still resolves `public` against the process's current working directory, not the file's location. That's unchanged and not part of this report.

STATUS: READY
VERIFIED: yes