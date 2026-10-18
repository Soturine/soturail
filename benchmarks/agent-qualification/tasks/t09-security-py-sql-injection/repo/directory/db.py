import sqlite3


def connect(path=":memory:"):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, role TEXT)")
    return conn


def seed(conn, rows):
    conn.executemany("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", rows)
    conn.commit()
