I moved the duplicated validation and normalization into `src/validation.js` and both handlers now import from it. The existing tests pass, and a differential check found no behavior change.

**What changed**
- `src/validation.js` (new) exports `normalizeEmail`, `normalizeName`, `emailErrors`, `nameErrors` and `ageErrors`. The email regex and the error messages are unchanged.
- `src/handlers/create-user.js` and `src/handlers/update-user.js` call those helpers. The `age !== undefined` guards and the store writes stay in each handler, because they differ between create and update.
- Nothing is committed. The working tree has two modified handlers and one new file.

**Verification**
- `npm test`: 2/2 pass, both before and after the change.
- Differential check: I copied the original `src/` and ran old and new handlers side by side over every combination of email, name and age values (including `undefined`, `null`, non-strings, boundary ages, `NaN` and `Infinity`), plus empty patches and a missing user. That was 4,323 cases with 0 mismatches, comparing return values and the stored records. The script lives in `$TEMP` and is not in the repo.

The existing suite only covers two cases, so the differential check is the main evidence for "no observable change."

STATUS: READY
VERIFIED: yes