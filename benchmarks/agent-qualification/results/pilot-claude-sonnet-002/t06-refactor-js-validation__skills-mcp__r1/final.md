I moved the duplicated validation into a new `src/validation.js`, and both handlers now use it. The existing tests pass (2 of 2). That suite is small and only covers create normalization and update rejecting an invalid age, so I checked the rest of the behavior by comparing the code against the original.

The module exports `validateEmail`, `validateName` and `validateAge`. Each returns the normalized value plus an error message or `null`. The email regex, length limits, age range and error strings are the same as before. Errors still come out in email, name, age order.

- **Create:** it still validates email and name always, and age only when it's present.
- **Update:** it still validates only the fields present in the patch. It also still writes the normalized value into the updated user even when validation fails, though that value is discarded when it returns 422.

STATUS: READY
VERIFIED: yes