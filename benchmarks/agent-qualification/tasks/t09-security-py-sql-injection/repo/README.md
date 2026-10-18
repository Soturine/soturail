# directory

User directory backed by SQLite.

- `search_users(conn, name_fragment)` returns users whose name contains the fragment (case-insensitive), ordered by id.
- `get_user_by_email(conn, email)` returns one user dict or `None`.
- `set_role(conn, user_id, role)` sets a role; roles are `viewer`, `editor`, `admin`; anything else raises `ValueError`.
