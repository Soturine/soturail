The shared validation module is in place and both handlers use it. Observable behavior is unchanged: the existing tests pass, and a comparison of the original and refactored handlers found no differences.

**What changed**
- **`src/validation.js` (new):** `normalizeEmail`, `normalizeName`, `validateEmail`, `validateName`, `validateAge`. Each validator returns an array of error strings, empty when valid, so handlers can spread them into `errors`.
- **`src/handlers/create-user.js`** and **`src/handlers/update-user.js`:** the inline rules are replaced with calls to the module. Error order is still email, name, age, and the update handler still only validates fields present in the patch.

**Verification**
- `npm test`: 2/2 pass before and after the change.
- Equivalence check: I ran the original handlers (from `git show HEAD`) and the new ones over 1,981 input combinations for create and update, including missing, null, non-string, boundary, non-integer, NaN, and Infinity values. Zero mismatches. The script lived in a temp directory outside the repo and was deleted afterward. Its comparison uses `JSON.stringify`, so it would not tell apart NaN and null in outputs; the new code path for those values is the same logic as before, but I did not check that distinction directly.

**Choices I made**
- I did not commit. The changes are uncommitted in the working tree (`M` on the two handlers, `??` on `validation.js`).
- I added no new tests. The existing suite only covers two cases, so the equivalence check above is the main evidence for the refactor.

STATUS: READY
VERIFIED: yes