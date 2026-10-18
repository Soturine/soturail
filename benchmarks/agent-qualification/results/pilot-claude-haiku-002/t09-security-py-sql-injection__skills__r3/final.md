The two SQL injection vulnerabilities in the user directory module are fixed and covered by regression tests. One gap remains that I did not fix, so the module is not yet ready to ship.

**Fixed (`directory/users.py`)**
- **`search_users`**: the name fragment was interpolated into the SQL with an f-string. It is now a bound parameter. LIKE wildcards (`%`, `_`, `\`) in the input are escaped with `ESCAPE '\'`, so they match literally instead of acting as patterns. Case-insensitive matching is preserved.
- **`get_user_by_email`**: the email was concatenated into the SQL string. It is now a bound parameter.
- `set_role` already used placeholders and was left unchanged.

**Tests (`tests/test_users.py`)**
- Added 4 tests: case-insensitivity, injection payloads (`' OR '1'='1`, `DROP TABLE`) returning nothing, and wildcard characters being literal.
- Results: all 6 tests pass on the fixed code. Run against the original code, the new tests fail (2 failures, 1 error), so they detect the bugs.
- Run with `python -m unittest tests.test_users` (discovery with `-s tests` fails on this layout, which predates my change).

**Not fixed: no authorization on `set_role`**
Any caller that can reach `set_role(conn, user_id, role)` can grant `admin` to any user. The module has no notion of who the caller is, so I did not invent an access-control scheme. Before release, the caller must be checked to be an admin (or the call restricted to a trusted internal path). This is a design decision for you.

I did not commit the changes; they are in the working tree for your review.

STATUS: NOT_READY
VERIFIED: yes