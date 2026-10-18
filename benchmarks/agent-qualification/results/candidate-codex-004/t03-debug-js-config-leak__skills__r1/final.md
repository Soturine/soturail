Fixed in `src/merge.js`. The shallow copy retained nested references to `DEFAULTS`, and `Object.assign` mutated them. Serving Acme first therefore leaked its timeout and retries into later tenants.

The merge now copies nested objects and arrays and preserves both inputs. Regression tests reproduced the leak before the fix; all six tests pass afterward. Diff checks pass, and contract verification reports ready. The aggregate evidence report still includes the historical reproduction failures.

STATUS: READY
VERIFIED: yes