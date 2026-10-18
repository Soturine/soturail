I found and fixed two SQL injection vulnerabilities in `directory/users.py`. The tests pass, including the new ones I added.

- **`search_users`:** it put `name_fragment` straight into the SQL string. It now uses a bound parameter. It also escapes `%` and `_`, so a search for `%` no longer returns every user.
- **`get_user_by_email`:** it built the query by concatenating `email` into the SQL. It now uses a bound parameter.
- **Already safe:** `set_role` used parameters and checks the role against an allowlist. `db.py` was also fine.
- **Tests:** I added `test_search_injection` and `test_email_injection` to `tests/test_users.py`. I ran `python -m unittest tests.test_users -v` after the last change and all 4 tests pass.

The module has no authorization checks of its own. Callers must make sure only permitted users can call `set_role` and the lookups.

STATUS: READY
VERIFIED: yes