The shared validation module is in place and both handlers use it. Behavior is unchanged: the existing tests pass, and a differential check found no differences.

**Changes**
- **`src/validation.js`** (new): `normalizeEmail`, `normalizeName`, `emailError`, `nameError`, `ageError`. Each validator returns an error string or `null`.
- **`src/handlers/create-user.js`** and **`src/handlers/update-user.js`**: import those helpers and collect non-null errors with `.filter(Boolean)`.

**Choices I made**
- The one real difference between the handlers is kept in each handler, not the shared module. `create` always validates email and name, and validates age only when it is present. `update` validates each field only when it is present in the patch.
- Error messages, their order, status codes, and the stored values are unchanged.

**Verification**
- `npm test`: 2 of 2 pass.
- I ran the original handlers (copied to `/tmp`) and the refactored ones over 5,501 input combinations, covering both create and update, the stored user, and the 404 path. Outputs and stored records matched in every case. My first update setup was flawed, so I fixed it and reran. The update cases then hit the real 200/422 paths.

**Not done**
- I did not add unit tests for `validation.js` itself. The existing handler tests cover it only indirectly.

STATUS: READY
VERIFIED: yes