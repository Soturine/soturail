import unittest

from directory.db import connect, seed
from directory.users import get_user_by_email, search_users


class UsersTest(unittest.TestCase):
    def setUp(self):
        self.conn = connect()
        seed(self.conn, [("Ana Lima", "ana@x.io", "admin"), ("Bruno", "bruno@x.io", "viewer")])

    def test_search(self):
        self.assertEqual([u["name"] for u in search_users(self.conn, "an")], ["Ana Lima"])

    def test_get_by_email(self):
        self.assertEqual(get_user_by_email(self.conn, "bruno@x.io")["role"], "viewer")


if __name__ == "__main__":
    unittest.main()
