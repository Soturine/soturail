I moved the duplicated validation into a new `src/validation.js`, and both handlers now use it. The existing test suite passes (2 of 2).

- **Shared module:** `src/validation.js` exports `validateEmail`, `validateName` and `validateAge`. The regex, the trim and lowercase rules, the length and age limits, and the error strings are copied unchanged from the old code.
- **Handlers:** `create-user.js` and `update-user.js` call these functions instead of repeating the checks. Errors are still collected in the order email, name, age. Each handler's own rules are untouched: create only checks age when it's present, and update only checks the fields in the patch.
- **Test coverage:** The suite is small (create normalizes and stores, update rejects an invalid age). I kept behavior the same by reading the code, not because tests cover every path.

STATUS: READY
VERIFIED: yes