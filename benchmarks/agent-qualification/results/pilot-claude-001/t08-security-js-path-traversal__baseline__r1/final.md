The static file endpoint did let requests escape the public directory, and I've fixed it. The new traversal test and the existing two tests pass.

**The bug:** `serveStatic` in `src/static.js` joined the decoded request path onto the public root without checking where it ended up. Requests like `/../secret.env` or `/%2e%2e/secret.env` could read files outside `public/`. The URL decoding also sat outside the `try`, so a malformed escape such as `%E0%A4%A` threw an unhandled error.

**The fix:**
- **Containment check:** The path is now resolved to its real location, symlinks included, and rejected with a 404 unless it stays inside the public root. This also stops a symlink inside `public/` from leading outside it.
- **Bad input:** Paths containing a null byte or a malformed percent-escape now return 404 instead of throwing.

**Test:** I added `rejects path traversal` to `test/static.test.js`. It covers plain `../`, encoded `..`, encoded slashes and backslashes, a null byte, and a malformed escape. I didn't write a test for the symlink case, so that part is unverified.

STATUS: READY
VERIFIED: yes