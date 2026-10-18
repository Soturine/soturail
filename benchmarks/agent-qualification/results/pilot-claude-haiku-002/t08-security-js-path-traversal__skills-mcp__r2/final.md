The static endpoint could serve files outside `public/`. `serveStatic` joined the decoded request path onto the root without checking where the result landed, so `/../secret.env` read the repo-root `secret.env`. I fixed it in `src/static.js` and added regression tests in `test/static.test.js`.

**Before the fix**, the new tests failed: `/../secret.env`, `/%2e%2e/secret.env`, `/..%2fsecret.env` and `/..%5csecret.env` all returned 200. A malformed escape like `/%E0%A4%A` threw an uncaught `URIError`, which the HTTP handler in `server.js` does not catch.

**The fix:**
- The target is resolved against the absolute public root, and any path that does not start with `root + path.sep` returns 404. The separator check avoids sibling-prefix matches such as `public-secret/`.
- Leading slashes are stripped before resolving, so an absolute-looking request path cannot replace the root.
- `decodeURIComponent` errors now return 404 instead of throwing.

**Verification:** `npm test` passes all 5 tests, including the existing nested-file and 404 tests, so legitimate files still serve.

**Not covered:** a symlink inside `public/` that points outside it would still be followed, because the check is lexical. Fixing that needs a `fs.realpath` comparison. I left it out because it is a separate hardening step, not the reported bug.

I did not commit anything.

STATUS: READY
VERIFIED: yes