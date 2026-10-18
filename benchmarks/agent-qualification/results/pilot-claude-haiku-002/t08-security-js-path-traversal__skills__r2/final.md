The static endpoint could serve files outside `public/`, and I've fixed it.

**The bug:** `src/static.js` built the file path with `path.join(publicRoot, decoded)` and never checked the result stayed under the root. A request for `/../secret.env` returned 200 with the contents of `secret.env`, which sits next to `public/`. Malformed percent-encoding (e.g. `/%E0%A4%A`) made `decodeURIComponent` throw outside the `try`.

**The fix** (`src/static.js`):
- The request path is decoded inside a `try`. If it's malformed, the request gets a 404.
- Leading slashes are stripped, then the path is resolved against the root.
- The resolved path must stay inside the root, checked with `path.relative`. This is not a substring check for `..`, so `notes..v2.txt` is still served.
- Anything that fails the check returns the same 404 as a missing file.

**Tests** (`test/static.test.js`): I added cases for plain and encoded `..`, backslash variants, a drive-letter path, a dotted filename that should still be served, and malformed encoding. I ran them before the fix: two failed, showing the leak and the throw. After the fix all 5 tests pass.

**End-to-end:** I started `createServer()` and requested the URLs over HTTP. Traversal and malformed URLs return 404, while `/css/site.css` and `/notes..v2.txt` still return 200.

I did not commit anything. Symlinks inside `public/` are still followed, which is outside this report's scope.

STATUS: READY
VERIFIED: yes