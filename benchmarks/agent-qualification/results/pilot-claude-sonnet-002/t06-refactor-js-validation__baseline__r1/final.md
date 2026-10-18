I moved the duplicated validation into `src/validation.js`, and both handlers now call it. The existing tests pass (2 of 2). They only cover two cases, so they don't exercise every validation path.

- **New module:** `validateEmail`, `validateName` and `validateAge` each return `{ value, error }`. The regex, trimming, lowercasing, length limits and error strings are copied unchanged from the old code.
- **`create-user.js`:** Validates in the same order as before (email, name, then age only if it's present). It inserts the same fields as before.
- **`update-user.js`:** Still returns 404 first when the user isn't found, and only validates fields that are present in the patch. Normalized email and name values are still assigned to `next`, as before.

STATUS: READY
VERIFIED: yes