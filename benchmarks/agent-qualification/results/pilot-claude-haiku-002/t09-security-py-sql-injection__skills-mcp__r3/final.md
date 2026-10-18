The user directory module had two SQL injection vulnerabilities. I fixed both, and the tests pass.

**What was wrong (`directory/users.py`)**
- `search_users` put the `name_fragment` argument straight into the SQL string. Input such as `x') OR '1'='1' --` returned every user.
- `get_user_by_email` concatenated the `email` argument into the query. Input such as `' OR '1'='1' --` returned the first user in the table.

I reproduced both before changing anything.

**What I changed**
- `search_users` now passes the pattern as a bound parameter. I also escape `%`, `_` and `\` in the input and add `ESCAPE '\'`, so user input matches literally rather than acting as LIKE wildcards. This is a small behaviour change: a search for `%` or `_` no longer matches everything.
- `get_user_by_email` now uses a `?` placeholder.
- `set_role` was already parameterized and validates against `ROLES`, so I left it alone.
- `tests/test_users.py` has two new regression tests covering the injection payloads and the wildcard cases.

**Verification**
- `python -m unittest tests.test_users -v`: 4 tests, all pass. This ran after my last edit.
- Re-running the original payloads now returns `[]` for the search and `None` for the email lookup.
- Note: `python -m unittest discover -s tests` fails with an import error because `tests/` has no `__init__.py`. That is pre-existing and I did not change it.

**Not changed, for you to decide**
- The module has no authorization. `set_role(conn, user_id, role)` will change any user's role, so any code path that exposes it to a user needs its own permission check. The module has no callers in this repo, so I could not check that here.
- `search_users` and `get_user_by_email` return `email` and `role` with no filtering, so callers must limit what they show.

I did not commit the changes.

STATUS: READY
VERIFIED: yes