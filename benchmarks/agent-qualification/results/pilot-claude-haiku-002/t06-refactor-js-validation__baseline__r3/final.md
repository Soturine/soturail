The validation logic now lives in `src/validation.js`, and both `create-user.js` and `update-user.js` import from it. Observable behavior is unchanged.

**What changed**
- **`src/validation.js` (new):** `normalizeEmail`, `normalizeName`, and `validateEmail`, `validateName`, `validateAge`. Each validator returns an error message or `null`.
- **`create-user.js`:** always validates email and name, and validates age only when it is present. The error order (email, name, age) is unchanged.
- **`update-user.js`:** validates and assigns only the fields present in the patch, as before. The 404 path and the `next` object construction are unchanged.

**Choices I made**
- The shared module exports the rules, not the branching. `create` and `update` treat missing fields differently, so each handler keeps its own conditionals.
- Validators return `null` rather than pushing into an array, so each handler collects its own errors in its original order.

**Verification**
- `npm test`: 2 of 2 pass, both before and after the change.
- I ran a throwaway differential script that loaded the original handlers from `HEAD` and the new ones side by side. It compared outputs over 28,228 input combinations covering create, update, partial patches, and a missing id. There were 0 mismatches. I deleted the script afterward and did not add it to the repo.

**Not done**
- I did not commit. The working tree has the two modified handlers and the new file.
- The repo's only tests are two smoke tests. I did not add unit tests for `validation.js`; that is a reasonable follow-up if you want the rules pinned directly.

STATUS: READY
VERIFIED: yes