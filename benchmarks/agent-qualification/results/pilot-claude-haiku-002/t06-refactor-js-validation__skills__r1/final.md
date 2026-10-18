The shared validation module is in place and both handlers use it. Behavior is unchanged as far as I can verify.

**What changed**
- **`src/validation.js`** (new): `normalizeEmail`, `normalizeName`, and the checks `emailErrors`, `nameErrors`, `ageErrors`. Each check returns an array of error strings, so the handlers can spread them into their error lists. Error order is still email, name, age.
- **`src/handlers/create-user.js`** and **`src/handlers/update-user.js`** now call those helpers.
- **`test/validation.test.js`** (new): unit tests for the module. This is an addition beyond the pure refactor; drop it if you want the change strictly minimal.

The one difference between the handlers is kept on purpose. `create` always validates email and name, while `update` only validates fields present in the patch. Age is checked only when provided in both.

**Verification**
- `npm test`: 4/4 pass (the 2 original tests plus 2 new ones).
- Differential check: I ran the original handlers from git HEAD and the new ones side by side on 20,000 randomized create and update inputs, including edge values like `null`, `NaN`, non-strings, and boundary ages and lengths. Results, status codes, and stored state matched in every case. That check lived in a scratch directory outside the repo, so it isn't part of the change.

Nothing is committed; the changes are in the working tree.

STATUS: READY
VERIFIED: yes