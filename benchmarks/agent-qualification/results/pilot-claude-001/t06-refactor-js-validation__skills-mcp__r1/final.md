I moved the duplicated validation into `src/validation.js`, and both handlers now use it. The two existing tests pass.

The module exports `validateEmail`, `validateName` and `validateAge`. Each one returns `{ value, error }`, with the same error strings and the same normalization as before (trim, and lowercase for email).

`create-user.js` and `update-user.js` keep their own control flow, so errors still come out in the same order (email, name, age). The update handler still sets a field on the patched user even when that field is invalid. It only returns the 422 afterwards, as before.

The existing tests only cover two cases, so I didn't add new ones. I checked behavior preservation by reading the old and new code side by side, not by running extra tests.

STATUS: READY
VERIFIED: yes