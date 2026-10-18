Root cause: the shallow merge retained references to nested defaults, and `Object.assign` mutated them. Acme’s timeout and retry settings then leaked into later requests.

Fixed merging to create independent nested objects and arrays. Added regression coverage for request ordering, frozen inputs, and caller mutations.

Verification: all 6 tests pass; `git diff --check` passes.

STATUS: READY
VERIFIED: yes