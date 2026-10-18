The validation rules now live in `src/validation.js`, and both `createUser` and `updateUser` use it. Observable behavior is unchanged, and the test suite passes (5 tests, including 3 new ones for the module).

**Changes**
- `src/validation.js` (new): `parseEmail`, `parseName`, and `checkAge`. Each returns the normalized value and/or an error message, using the same regex, trimming, lowercasing, and bounds as before.
- `src/handlers/create-user.js`: calls the parsers and collects errors in the original order (email, name, age). Age is still only checked and stored when present.
- `src/handlers/update-user.js`: same shared parsers, still only touching fields present in the patch.
- `test/validation.test.js` (new): unit tests for the three parsers.

**Judgment calls**
- I didn't build a single "validate whole user" function. Create requires email and name, while update only validates the fields in the patch, so the presence logic stays in each handler and only the rules are shared.
- Error message text and order are unchanged.

**Verification**
- `npm test` passes after the last change (5/5).
- I ran a differential check that loads the original handlers from `git show HEAD` and the refactored ones, then compares results and stored users across 69,121 combinations of email, name, and age values (including `undefined`, `null`, non-strings, boundary ages, and 404 on a missing id). There were 0 differences. That script lives in `/tmp/diff` and is not part of the repo.

Nothing is committed; the changes are in the working tree for you to review.

STATUS: READY
VERIFIED: yes