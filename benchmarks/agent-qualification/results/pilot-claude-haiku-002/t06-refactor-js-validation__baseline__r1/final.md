The validation logic now lives in `src/validation.js`, and both handlers import it. Behavior is unchanged: the existing tests pass, and a differential run of the original and refactored handlers matched on all 10,146 cases.

**What changed**
- **`src/validation.js`** (new): `normalizeEmail`, `normalizeName`, `validateEmail`, `validateName`, `validateAge`. Each validator returns an error string or `null`.
- **`src/handlers/create-user.js`**: builds the error list from the validators and filters out the `null`s. Error order (email, name, age) is preserved.
- **`src/handlers/update-user.js`**: still checks only the fields present in the patch, and still writes the normalized value into `next` before validating, as before.

**Choices I made**
- The validators return error strings rather than throwing or pushing into an array, so each handler composes its own error list. This keeps the handlers' control flow and error ordering visibly the same.
- I did not commit. The changes are in the working tree (`M` on the two handlers, `??` on `validation.js`) for you to review.

**Verification**
- `npm test`: 2/2 pass, run after the last change.
- Differential check (temporary, removed afterward): the original handlers and the refactored ones were run over a grid of email, name, and age values, plus absent-field and missing-user update cases. Results and stored user state matched in every case.

The differential check and the test suite are the verification here. The repo has only two tests, so coverage of the validation rules themselves is thin; adding direct tests for `validation.js` would be a reasonable follow-up but was not requested.

STATUS: READY
VERIFIED: yes