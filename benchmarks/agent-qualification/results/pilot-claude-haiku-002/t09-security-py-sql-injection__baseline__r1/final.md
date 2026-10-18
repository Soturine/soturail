The security pass found SQL injection in the user directory module, and I've fixed it. Both affected functions now pass user input as bound parameters, and the test suite passes (5/5).

**Vulnerabilities found and fixed (`directory/users.py`)**

1. **SQL injection in `search_users`** (critical). The name fragment was interpolated into the SQL string. A payload such as `x') OR 1=1 --` returned every user. It now uses `lower(?) ESCAPE` with a bound pattern.
2. **SQL injection in `get_user_by_email`** (critical). The email was concatenated into the query. A payload such as `nobody' OR '1'='1` returned the admin account. It now uses `email = ?` with a bound parameter.
3. **LIKE wildcards in `search_users`** (low, a behavior fix rather than a classic vulnerability). `%` and `_` in the input acted as wildcards, so searching `%` returned everyone. The fragment is now escaped so it matches literally.

`set_role` already used placeholders and role validation, so I left it alone.

**Tests (`tests/test_users.py`)**

I added three regression tests: one for each injection payload, and one checking that `%` and `_` match literally. Before the fix, both payloads reproduced the injection. After the fix, both return empty or `None`, and case-insensitive search still works.

**Not changed, for you to decide**

- `set_role` has no authorization check. Any caller that can reach the module can change any user's role, so the enforcement has to live in the calling layer.
- The module has no input length limits. This is a hardening option, not a vulnerability I could confirm.
- I did not commit anything.

Note: `tests/` has no `__init__.py`, so `python -m unittest discover` fails. I ran the tests with `python -m unittest tests.test_users -v` instead. Adding `__init__.py` would make discovery work.

STATUS: READY
VERIFIED: yes