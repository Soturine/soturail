import unittest

from csvtool.parse import parse_customers


class ParseTest(unittest.TestCase):
    def test_simple_rows(self):
        rows = parse_customers("nome,cidade\nAna,Recife\nBruno,Natal\n")
        self.assertEqual(rows, [{"nome": "Ana", "cidade": "Recife"}, {"nome": "Bruno", "cidade": "Natal"}])

    def test_wrong_field_count(self):
        with self.assertRaises(ValueError):
            parse_customers("a,b\n1,2,3\n")


if __name__ == "__main__":
    unittest.main()
