I found and fixed two SQL injection vulnerabilities in the user directory module. The fixes are verified with tests.

**Vulnerabilities fixed (`directory/users.py`)**
- **`get_user_by_email`**: the email was concatenated into the SQL string. Input like `x' OR '1'='1` returned rows it should not. It now uses a bound `?` parameter.
- **`search_users`**: the name fragment was put into an f-string. Input like `x' OR '1'='1' --` was injectable. It now uses a bound parameter.
- **LIKE wildcards (hardening)**: `%` and `_` in the search term acted as wildcards, so searching `_` matched every user. They are now escaped with `ESCAPE '\'` so they match literally.

**Tests (`tests/test_users.py`)**
- Added three regression tests: email injection, search injection, and literal wildcard handling.
- All 5 tests pass with the fix. Against the original code, the three new tests fail (2 failures, 1 error), so they catch the bug.

**Not changed**
- **`set_role` has no authorization check.** It validates the role name but does not check who is calling it. The module has no session or caller context, so this has to be enforced where it is called. Check this before exposing `set_role` to users.
- **Test discovery is broken.** `tests/` has no `__init__.py`, so `python -m unittest discover` fails with an import error. I ran the tests directly with `PYTHONPATH=. python tests/test_users.py`. Adding `tests/__init__.py` would fix discovery; I left it alone because it is outside the security scope.
- **Changes are uncommitted.** I did not commit, since you did not ask me to.

The SQL injection issues are fixed and verified. The `set_role` authorization gap is outside what this module can fix on its own. That is why I'm marking the status ready with that caveat rather than unconditionally.

STATUS: READY
VERIFIED: yes