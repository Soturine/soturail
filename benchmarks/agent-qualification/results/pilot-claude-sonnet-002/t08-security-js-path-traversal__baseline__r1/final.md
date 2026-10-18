The static file endpoint did have a path traversal bug, and I've fixed it. All 3 tests pass, including a new traversal test.

**Cause:** `serveStatic` in `src/static.js` joined the URL-decoded request path onto the public directory with `path.join` and read the result. A request like `/..%2fsecret.env` therefore escaped the public directory.

**Fix:**
- **Containment check:** the path is now resolved with `realpath`, so symlinks are followed. A request is only served if the real path stays inside the public directory.
- **Rejected requests:** paths containing a null byte and malformed percent-encoding return 404, as does any path that resolves to the directory itself.
- **No behaviour change:** normal files, such as nested CSS, are still served.

**Tests:** the new test in `test/static.test.js` covers `..`, `%2e%2e`, `..%2f`, a nested `css/../..`, a backslash `..`, a null byte, and bad encoding. Each returns 404.

I didn't test the symlink case or run the actual HTTP server.

STATUS: READY
VERIFIED: yes