I found two SQL injection vulnerabilities in the user directory module and fixed both. All 4 tests pass.

- **`search_users`:** it put the search text straight into the SQL string. It now passes the text as a bound parameter. I also escape `%`, `_` and `\` in the text, so a search for `%` no longer matches every user.
- **`get_user_by_email`:** it built the query by concatenating the email into the SQL. It now uses a `?` parameter.
- **Tests:** I added two to `tests/test_users.py`. One checks that injection strings and a bare `%` return no users from `search_users`. The other checks that an injection string returns nothing from `get_user_by_email`.

`set_role` and `db.py` were already using parameters, so I left them alone. I only reviewed the three source files in the module, and the module has no authentication or authorization checks. If callers can reach these functions without their own access control, that is a separate gap this pass didn't cover.

To run the tests, use `python -m unittest tests.test_users`. `unittest discover -s tests` fails with an import error because `tests` isn't a package.

STATUS: READY
VERIFIED: yes