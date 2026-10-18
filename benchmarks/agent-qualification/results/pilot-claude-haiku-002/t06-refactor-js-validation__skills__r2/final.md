The shared validation module is in place and both handlers use it. Behavior is unchanged: the test suite passes and a differential check of the old and new handlers found no differences.

**What changed**
- **`src/validation.js`** (new) holds the email, name, and age logic:
  - `normalizeEmail` and `normalizeName` do the trim/lowercase and the non-string fallback.
  - `validateEmail`, `validateName`, and `validateAge` each return an array of error strings, empty when valid.
- **`src/handlers/create-user.js`** collects errors from the three validators in the original order (email, name, age). The age check still runs only when `age` is provided.
- **`src/handlers/update-user.js`** keeps its per-field structure, so the `next` object is built exactly as before, including the case where an invalid value is copied onto it before the 422 return.

**Verification**
- `npm test`: 2 of 2 pass, both before and after the change.
- Differential check: I saved the original handlers outside the repo and ran old and new side by side over 2,201 input combinations (email, name, and age variants, including undefined, null, non-strings, boundaries, and NaN) for create, update, and the 404 path. Status and body matched in every case.

**Choices I made**
- The validators return arrays rather than throwing, so the handlers can keep their existing error-accumulation and 422 behavior.
- I did not add unit tests for `validation.js` itself. The existing suite has only two tests, so a reviewer may want direct coverage of the validators before merging.
- Nothing is committed; the changes are in the working tree.

The CLAUDE.md in the repo refers to SotuRail context handling, but this task did not need any of its skills, so I did not use them.

STATUS: READY
VERIFIED: yes