import unittest

from directory.db import connect, seed
from directory.users import get_user_by_email, search_users, set_role


class HiddenUsersTest(unittest.TestCase):
    def setUp(self):
        self.conn = connect()
        seed(self.conn, [("Ana Lima", "ana@x.io", "admin"), ("Bruno", "bruno@x.io", "viewer"), ("Conan O'Brien", "conan@x.io", "editor")])

    def test_search_injection_does_not_dump_table(self):
        result = search_users(self.conn, "zzz') OR 1=1 --")
        self.assertEqual(result, [])

    def test_search_union_injection(self):
        result = search_users(self.conn, "x%') UNION SELECT 1, sql, 3, 4 FROM sqlite_master --")
        self.assertEqual(result, [])

    def test_email_injection(self):
        self.assertIsNone(get_user_by_email(self.conn, "' OR '1'='1"))

    def test_apostrophes_work(self):
        self.assertEqual([u["name"] for u in search_users(self.conn, "o'brien")], ["Conan O'Brien"])

    def test_case_insensitive_search_kept(self):
        self.assertEqual([u["email"] for u in search_users(self.conn, "BRU")], ["bruno@x.io"])

    def test_get_by_email_kept(self):
        self.assertEqual(get_user_by_email(self.conn, "ana@x.io")["name"], "Ana Lima")

    def test_roles(self):
        set_role(self.conn, 2, "editor")
        self.assertEqual(get_user_by_email(self.conn, "bruno@x.io")["role"], "editor")
        with self.assertRaises(ValueError):
            set_role(self.conn, 2, "root")


if __name__ == "__main__":
    unittest.main()
