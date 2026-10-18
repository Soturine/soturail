I moved the validation into `src/validation.js` and both handlers now use it. It exports `validateEmail`, `validateName` and `validateAge`. The existing tests pass (2 of 2). They cover only a small part of the validation, so I compared the old and new code by reading rather than adding tests.

The error messages and their order (email, name, age) are the same as before. Create still validates age only when it is provided. Update still validates and applies only the fields present in the patch. The 404, 422, 200 and 201 responses are unchanged.

I did not use the soturail skills or tooling for this change.

STATUS: READY
VERIFIED: yes