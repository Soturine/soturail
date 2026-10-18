I found and fixed two SQL injection vulnerabilities in `directory/users.py`. Both are confirmed fixed by the test suite and by re-running the attack payloads.

**Vulnerabilities fixed**
- **`get_user_by_email`** concatenated the email into the SQL string. Input `' OR '1'='1` returned the admin row. It now uses a bound `?` parameter. The same payload returns `None`.
- **`search_users`** interpolated the name fragment into an f-string. Input `x') OR 1=1 OR ('` returned every user. It now binds the pattern as a parameter. The same payload returns `[]`.

**Other changes**
- `search_users` now escapes `\`, `%` and `_` before binding, so those characters match literally. The old code let them act as LIKE wildcards. This is a behavior change: searching for `%` no longer matches everything. Say if you want the old wildcard behavior back.
- I added three regression tests to `tests/test_users.py`: two injection payloads and the literal-wildcard case.

**Verification**
- Before the change, the existing 2 tests passed and both injections were confirmed exploitable.
- After the change, `python -m unittest tests.test_users -v` runs 5 tests, all passing.
- Plain `python -m unittest discover -s tests` fails with an import error because `tests/` has no `__init__.py`. That was already true before my changes, so I left it alone. Run the tests by module name as above.

**Not changed, for you to decide**
- `set_role` has no authorization check. It is only safe if callers enforce who may change roles. This repo has no web or API layer that calls it, so I did not add an access-control model.
- `search_users` has no result limit. Any caller can pull the whole table in one query.

I did not run any SotuRail skills or touch the `.soturail/` data. The change is limited to the two files above, and nothing is committed.

STATUS: READY
VERIFIED: yes