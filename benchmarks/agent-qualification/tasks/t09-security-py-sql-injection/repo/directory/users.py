ROLES = {"viewer", "editor", "admin"}


def search_users(conn, name_fragment):
    query = f"SELECT id, name, email, role FROM users WHERE lower(name) LIKE lower('%{name_fragment}%') ORDER BY id"
    return [dict(row) for row in conn.execute(query)]


def get_user_by_email(conn, email):
    row = conn.execute("SELECT id, name, email, role FROM users WHERE email = '" + email + "'").fetchone()
    return dict(row) if row else None


def set_role(conn, user_id, role):
    if role not in ROLES:
        raise ValueError(f"unknown role: {role}")
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    conn.commit()
