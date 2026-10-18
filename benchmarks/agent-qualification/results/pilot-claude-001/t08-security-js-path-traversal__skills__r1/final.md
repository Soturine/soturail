The report was correct: `serveStatic` joined the decoded request path onto the public directory without checking where the result ended up. A request like `/%2e%2e/secret.env` or `/..%2fsecret.env` would have returned `secret.env` from the project root. All 5 tests pass after the fix, including the 3 new ones I added. I did not start the server and send real requests.

**The fix** is in `src/static.js`:
- It resolves the target path and refuses anything that isn't strictly inside the public directory. The check uses `path.relative`, so a sibling folder like `public-evil` can't get through on a shared name prefix.
- It strips leading slashes, so an absolute path in the URL can't replace the root.
- It resolves symlinks with `realpath` and checks again, so a link inside `public` can't point outside it.
- It returns 404 for a malformed percent-encoding (which used to throw) and for null bytes.

I didn't reject paths just because they contain `..`, so the legitimate file `public/notes..v2.txt` still works.

**New tests** in `test/static.test.js` cover these cases:
- Encoded and plain traversal, including backslash forms.
- Absolute paths.
- A sibling-directory escape.
- Null bytes and malformed encoding.
- The dotted filename still being served.

I did not test the symlink case.

STATUS: READY
VERIFIED: yes