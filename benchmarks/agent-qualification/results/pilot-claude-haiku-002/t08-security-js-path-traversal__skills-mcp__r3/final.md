The traversal is fixed. `/../secret.env`, `/%2e%2e/secret.env` and `/..%2fsecret.env` previously returned the contents of `secret.env` from outside `public/` with a 200. They now return 404.

**Root cause:** `src/static.js` built the path with `path.join(publicRoot, decoded)` and never checked that the result stayed inside `publicRoot`. The URL is percent-decoded first, so encoded `..` sequences also got through.

**Changes:**
- `src/static.js`: after decoding, the target is joined to the root and checked with `path.relative`. Anything that escapes the root, or is the root itself, returns 404. A check on `..` prefixes rather than a substring match keeps legitimate names like `notes..v2.txt` working.
- `src/static.js`: a malformed percent-encoding such as `/%E0%A4%A` used to make `decodeURIComponent` throw. In the async request handler that becomes an unhandled rejection and the client gets no response. It now returns 404.
- `test/static.test.js`: added regression tests for the traversal variants, the malformed-encoding case, and the dotted-filename case.

**Verification:** `npm test` passes all 5 tests on Windows, and a direct re-run of the exploit paths returns 404 for each. I did not commit anything.

STATUS: READY
VERIFIED: yes