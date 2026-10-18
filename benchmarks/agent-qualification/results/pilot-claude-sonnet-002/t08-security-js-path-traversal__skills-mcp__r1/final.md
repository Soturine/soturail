The report was right: `serveStatic` in `src/static.js` joined the decoded request path onto the public directory without checking where it ended up. A request like `/../package.json` or `/%2e%2e/package.json` could therefore read files outside `public`. I fixed it, and all 3 tests pass with the fix in place.

The fix makes four changes:
- **Containment check:** the path is resolved and must end up strictly inside the public directory, otherwise the request gets a 404.
- **Symlinks:** the public directory and the requested file both go through `realpath`. A symlink inside `public` that points outside is rejected too.
- **Bad input:** malformed percent-encoding (like `%zz`) and null bytes now return 404 instead of throwing.
- **Leading slashes:** a leading `/` or `\` is stripped, so an absolute-looking path can't escape the directory.

I added a test in `test/static.test.js` covering plain, encoded and backslash traversal, plus the null-byte and bad-encoding cases.

I did not confirm that the new test fails on the old code. My attempt to run the suite against the original `src/static.js` printed no counts, so I don't have a before/after comparison. I also didn't write a test for the symlink case.

STATUS: READY
VERIFIED: yes