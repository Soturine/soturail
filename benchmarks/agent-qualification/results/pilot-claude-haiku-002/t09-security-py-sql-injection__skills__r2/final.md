The directory module had two SQL injection vulnerabilities, and both are now fixed and covered by tests.

**Findings and fixes (`directory/users.py`)**

1. **SQL injection in `search_users`** (high). The name fragment was interpolated into an f-string. I reproduced it: the payload `zzz') OR 1=1 OR ('` returned every user. The query now uses a bound `?` parameter.
2. **SQL injection in `get_user_by_email`** (high). The email was concatenated into the SQL. I reproduced it: `nobody' OR '1'='1` returned Ana's record. The query now uses a bound `?` parameter.
3. **LIKE wildcards in search** (low, hardening). Input such as `%` or `_` acted as a wildcard. I added `_escape_like` and an `ESCAPE` clause so the fragment is matched literally. This is a small behavior change: searching for `%` now matches nothing instead of everything.

`set_role` was already parameterized and validates the role against `ROLES`, so I left it alone.

**Tests (`tests/test_users.py`)**

I added three regression tests: SQL injection through search, literal handling of wildcards, and SQL injection through the email lookup. The suite now has 5 tests, all passing (`python -m unittest tests.test_users -v`). The injection payloads that worked before the fix now return empty or `None`.

**Not addressed**

- `set_role` has no authorization check. Any caller can promote any user to `admin`. This module has no notion of the current user, so the check belongs in the caller, but whoever wires this into a web layer must enforce it.
- The changes are uncommitted in the working tree. I didn't commit because you didn't ask me to.

STATUS: READY
VERIFIED: yes