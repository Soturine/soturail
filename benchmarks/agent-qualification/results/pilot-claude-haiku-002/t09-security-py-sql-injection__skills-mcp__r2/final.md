I found and fixed two SQL injection vulnerabilities in `directory/users.py`. The module is not ready to ship, though, because `set_role` has no authorization check.

**Fixed**
- **`search_users`** built the query by f-string interpolation. A name fragment like `x') OR 1=1 --` returned every row. It now uses a bound parameter. I also escape `%`, `_` and `\` in the fragment so they match literally instead of acting as LIKE wildcards.
- **`get_user_by_email`** concatenated the email into the query. A value like `nobody' OR '1'='1` returned a user. It now uses a bound parameter.

**Checked**
- `set_role` and `seed` already used placeholders and I left them alone. `set_role` also validates the role against `ROLES`.
- I added three regression tests to `tests/test_users.py`: injection against search, wildcard literals against search, and injection against the email lookup.
- Before the fix, the three new tests fail on the original `users.py`. After the fix, all 5 tests pass with `python -m unittest tests/test_users.py`.
- Running `unittest discover` fails because `tests/` has no `__init__.py`. That is a pre-existing setup issue, not a security problem, and I did not change it.

**Not fixed: `set_role` has no authorization check**
Anyone who can call `set_role(conn, user_id, "admin")` can promote any user. The module has no notion of the caller, so the right fix depends on how your application authenticates users and who may change roles. I left it unchanged rather than invent an access model. Before release, the caller must check that the requester is an admin.

STATUS: NOT_READY
VERIFIED: yes