I moved the duplicated validation into `src/validation.js`, and both handlers now use it. The existing tests pass (2 of 2). They only cover a create with normalization and an update with an invalid age, so they don't exercise every validation path.

The new module exports `validateEmail`, `validateName` and `validateAge`. Each returns the normalized value and an error message, or `null` if the input is valid. The regex, length limits, age bounds and error strings are unchanged. Errors are still reported in email, name, age order.

The two handlers still differ the way they did before:
- **Create:** always validates email and name, and validates age only when it's provided.
- **Update:** validates only the fields present in the patch, and still writes the normalized value into the updated user even when it failed validation.

I didn't use `soturail-change` or any other SotuRail skill for this.

STATUS: READY
VERIFIED: yes