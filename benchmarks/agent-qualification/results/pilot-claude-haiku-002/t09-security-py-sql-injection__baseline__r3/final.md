I found and fixed two SQL injection vulnerabilities in `directory/users.py`. All 5 tests pass after the change.

**Vulnerabilities fixed**
- **`search_users`**: the name fragment was pasted into the SQL string. Input like `' OR '1'='1` would dump every user. It now uses a bound `?` parameter. User-supplied `%` and `_` are also escaped and matched literally, so searching for `%` no longer matches everything.
- **`get_user_by_email`**: the email was concatenated into the query, so `x' OR '1'='1` would return a user. It now uses a bound `?` parameter.

`set_role` already used bound parameters and an allowlist of roles, so I left it unchanged.

**Tests**
- Baseline before changes: 2 passing.
- After changes: 5 passing. I added regression tests for both injection payloads and for literal wildcard matching.
- Run with `python -m unittest tests.test_users -v`. `python -m unittest discover -s tests` fails because `tests/` has no `__init__.py`. I didn't change that.

**Not covered by this pass**
- The module has no authorization checks. `set_role` and the lookups will work for any caller that has a connection, so access control has to live in the layer above.
- No tests exist for `set_role`.

STATUS: READY
VERIFIED: yes