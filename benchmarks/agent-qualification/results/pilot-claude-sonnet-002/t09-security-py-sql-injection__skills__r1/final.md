I found two SQL injection holes in `directory/users.py` and fixed both. All 4 tests pass, including two new injection tests. I did not run the SotuRail skills, only a direct read and fix.

- **`search_users`:** it built the query with an f-string, so the search text went straight into the SQL. It now uses a bound parameter. I also escape `%`, `_` and `\` in the text, so a search for `%` can't match every user.
- **`get_user_by_email`:** it concatenated the email into the query string. It now uses a bound parameter.
- **`set_role`:** this was already safe. It checks the role against an allowlist and uses bound parameters.
- **Not covered:** `db.py` was already parameterized. I only reviewed the injection risk. `set_role` has no check on who is calling it, so authorization would need to be enforced by whatever code calls it.

The new tests, in `tests/test_users.py`, cover a quote-based payload in both functions and the `%` wildcard search. I ran them with `python -m unittest tests.test_users -v`. Plain `unittest discover -s tests` fails because `tests/` isn't a package.

STATUS: READY
VERIFIED: yes