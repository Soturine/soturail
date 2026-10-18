I fixed the SQL injection in the user directory module, and all 4 tests pass.

**Fixes in `directory/users.py`:**
- **`get_user_by_email`:** it built the query by string concatenation, so an input like `' OR '1'='1` returned a user. It now uses a `?` parameter.
- **`search_users`:** it put the search text into an f-string, with the same injection hole. It now uses a bound parameter. I also escape `%`, `_` and `\` in the search text, so a search for `%` no longer matches every user.
- **`set_role`:** it was already safe. It checks the role against an allowlist and uses parameters, so I left it alone.

**Tests:** I added two injection tests to `tests/test_users.py`. I did not run them against the old code to confirm they fail there. The suite passes with `python -m unittest tests.test_users`.

**Not covered:** the module has no authorization checks. Nothing stops any caller from running `set_role` to make a user an admin, so the code that calls it has to enforce that.

STATUS: READY
VERIFIED: yes