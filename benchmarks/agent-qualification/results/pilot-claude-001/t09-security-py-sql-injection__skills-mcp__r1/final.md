I found two SQL injection holes in the user directory module and fixed both. All 4 tests pass.

**What was wrong** (`directory/users.py`):
- **`search_users`:** it put `name_fragment` straight into the SQL string with an f-string.
- **`get_user_by_email`:** it joined `email` into the query by string concatenation. An input like `' OR '1'='1` would have returned a user.

**What I changed:**
- Both queries now use `?` placeholders with bound parameters.
- In `search_users` I also escape `%`, `_` and `\` in the search term. Without that, a search for `%` would match every user.
- I added two tests in `tests/test_users.py`. One checks that an injection-style email returns nothing. The other checks that an injection-style or wildcard search term returns nothing.

I left `set_role` and `db.py` alone. `set_role` was already parameterized and checks the role against an allowed list, and `db.py` only uses parameterized inserts.

I didn't look at who is allowed to call these functions. This module has no permission checks, so any access control has to live in whatever calls it.

I ran the tests with `python -m unittest tests.test_users`.

STATUS: READY
VERIFIED: yes