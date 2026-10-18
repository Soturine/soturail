I found two SQL injection vulnerabilities in `directory/users.py` and fixed both. All 4 tests pass.

- **`search_users`:** the name fragment was interpolated straight into the SQL string. It now uses a bound parameter. I also escape `%`, `_` and `\` in the input, so a search for `%` no longer matches every user.
- **`get_user_by_email`:** the email was concatenated into the query. It now uses a bound parameter.

`set_role` and the code in `db.py` were already parameterized, so I left them alone. `set_role` also checks the role against an allow-list.

I added two tests to `tests/test_users.py`. One covers injection payloads and a `%` wildcard in `search_users`. The other covers an injection payload in `get_user_by_email`.

I only reviewed the SQL query handling. This module has no authentication or authorization checks, so I did not look at access control.

STATUS: READY
VERIFIED: yes