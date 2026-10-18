The report was right. `serveStatic` in `src/static.js` joined the decoded request path onto the public root without checking where it ended up. A request like `/..%2fpackage.json` or `/%2e%2e/package.json` could read files outside `public/`.

The fix in `src/static.js`:
- **Containment check:** it resolves the real path of both the root and the target, then returns 404 unless the target is inside the root. Resolving real paths also stops a symlink inside `public/` from pointing outside it.
- **Bad input:** malformed percent-encoding (which used to throw) and null bytes now return 404.
- **Backslashes:** a leading `/` or `\` is stripped before resolving, so `/..\package.json` can't escape either.

I added a test in `test/static.test.js` that tries seven traversal and bad-input paths and expects 404 for each. All 3 tests pass with `node --test`. I didn't test the symlink case directly.

STATUS: READY
VERIFIED: yes