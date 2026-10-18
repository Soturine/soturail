The shared validation now lives in `src/validation.js`, and both handlers use it. Existing tests pass, and a differential check found no behavior change.

**What changed**
- **`src/validation.js`** (new): `normalizeEmail`, `normalizeName`, and the error checks `emailErrors`, `nameErrors`, `ageErrors`. Each check returns an array of error messages.
- **`src/handlers/create-user.js`**: uses the helpers. The age check still runs only when `age` is provided.
- **`src/handlers/update-user.js`**: uses the helpers. Each field is still checked only when present in the patch, and the normalized value is still written to `next` even when invalid.

Error order is still email, then name, then age, and the messages are unchanged.

**Verification**
- `npm test`: 2 of 2 pass, before and after the change.
- Differential check: I ran the original and refactored handlers side by side over about 88,000 input combinations (missing, null, empty, boundary lengths and ages, non-strings, whitespace/case in emails), comparing status, errors, stored user, and the not-found path. Zero mismatches. The scratch script and backup copies were deleted afterward and are not in the repo.

**Choices I made**
- I did not add unit tests for `validation.js` directly, since the request was behavior-preserving. Say if you want them.
- I did not commit. The working tree has the two modified handlers and the new file.

STATUS: READY
VERIFIED: yes