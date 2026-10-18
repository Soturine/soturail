`serveStatic` in `src/static.js` let requests read files outside `public/`. It joined the decoded request path onto the root without checking where the result landed. So `/..%2fpackage.json` or `/%2e%2e/...` read files outside the public directory.

**Fix:**
- The request path is now resolved against the real path of the root. The request is served only if the resolved file is still inside that root.
- Symlinks are resolved too, so a link inside `public/` can't point outside it.
- Paths with a null byte, or with malformed percent-encoding, now return 404. Malformed encoding used to make `decodeURIComponent` throw, which went uncaught.
- Directory requests, including `/`, still return 404, as they did before.

**Tests:** I added a regression test in `test/static.test.js` for several traversal forms. All three tests pass with `node --test`, including the existing nested-file and missing-file ones. I didn't test the symlink case, and I didn't exercise the HTTP layer in `src/server.js`.

Files whose names start with `..` are also blocked, which is a harmless edge case. `public/notes..v2.txt` is not affected.

STATUS: READY
VERIFIED: yes