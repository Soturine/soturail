The static file endpoint could serve files outside `public/`. `GET /../secret.env` returned the contents of `secret.env` (containing `API_TOKEN`), and the fix is in place with tests passing.

**Cause:** `serveStatic` in `src/static.js` built the path with `path.join(publicRoot, decoded)` and never checked that the result stayed inside the root. Encoded forms such as `/..%2fsecret.env` and `/%2e%2e/secret.env` got through the same way. Malformed percent-encoding (e.g. `/%E0%A4%A`) also threw an unhandled error.

**Fix (`src/static.js`):**
- The request path is normalized as an absolute path, so `..` segments cannot climb above the root.
- The resolved target must equal the root or sit under `root + path.sep`; anything else returns 404. This second check matters on Windows, where `\` is a separator and a backslash-encoded `..` would otherwise escape.
- Undecodable paths return 400 instead of throwing.

**Tests (`test/static.test.js`):** added cases for the traversal variants (raw, percent-encoded, backslash-encoded, mixed) asserting 404 and no leaked `API_TOKEN`; a case confirming `notes..v2.txt` is still served; and the malformed-encoding 400.

**Verification:** I reproduced the leak against the original code before changing it. After the fix, `node --test "test/**/*.test.js"` reports 5 pass, 0 fail, and the traversal probes return 404 while `/css/site.css` and `/notes..v2.txt` still return 200. This was run on Windows only.

The changes are uncommitted in the working tree. I did not commit or push.

STATUS: READY
VERIFIED: yes