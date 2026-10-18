I fixed the SQL injection flaws in the user directory module. Both fixed functions now pass caller input as bound parameters, and the new regression tests fail on the original code and pass on the fix.

**Vulnerabilities found and fixed** (`directory/users.py`)
- **`search_users`**: the name fragment was interpolated into the SQL string, so input like `' OR '1'='1` changed the query. It now uses a `?` placeholder.
- **`get_user_by_email`**: the email was concatenated into the SQL string. It now uses a `?` placeholder.
- **LIKE wildcards in `search_users`**: `%` and `_` in the input acted as wildcards, so a search for `_` matched every name. I added `_escape_like` and an `ESCAPE` clause so the search is a literal "contains" match, as the README describes. This is a correctness fix more than an injection fix.

**Tests** (`tests/test_users.py`)
- Added three tests: injection payloads and wildcards are treated as literal text, and an empty fragment still returns all rows.
- On the original `users.py`, the two injection tests fail. On the fixed code, all 5 tests pass.

**Not changed: `set_role` has no access control.** Any caller can set any user to `admin`. The function is safe from injection, and I found no code in this repo that calls it, so I can't tell whether the calling layer enforces permissions. Deciding who may change roles is a design choice for you, so I didn't make one. Until that check exists, this function is a privilege-escalation path if it's reachable by untrusted users.

Nothing is committed. Running the tests needs `python -m unittest tests.test_users`. Discovery with `-s tests` fails because `tests/` has no `__init__.py`; I didn't change that.

STATUS: NOT_READY
VERIFIED: yes