ROLES = {"viewer", "editor", "admin"}


def _escape_like(value):
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def search_users(conn, name_fragment):
    pattern = "%" + _escape_like(name_fragment.lower()) + "%"
    rows = conn.execute(
        "SELECT id, name, email, role FROM users WHERE lower(name) LIKE ? ESCAPE '\\' ORDER BY id",
        (pattern,),
    )
    return [dict(row) for row in rows]


def get_user_by_email(conn, email):
    row = conn.execute("SELECT id, name, email, role FROM users WHERE email = '" + email + "'").fetchone()
    return dict(row) if row else None


def set_role(conn, user_id, role):
    if role not in ROLES:
        raise ValueError(f"unknown role: {role}")
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    conn.commit()
