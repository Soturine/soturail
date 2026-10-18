import os
import tempfile
import unittest

from csvtool.importer import import_file
from csvtool.parse import parse_customers


class HiddenParseTest(unittest.TestCase):
    def test_quoted_comma(self):
        rows = parse_customers('nome,endereco\nAna,"Rua A, 10"\n')
        self.assertEqual(rows, [{"nome": "Ana", "endereco": "Rua A, 10"}])

    def test_escaped_quotes_and_comma(self):
        rows = parse_customers('nome,obs\n"Bruno ""Bê""","x, y"\n')
        self.assertEqual(rows[0]["nome"], 'Bruno "Bê"')
        self.assertEqual(rows[0]["obs"], "x, y")

    def test_empty_fields(self):
        rows = parse_customers("a,b,c\n1,,3\n")
        self.assertEqual(rows, [{"a": "1", "b": "", "c": "3"}])

    def test_quoted_header_and_blank_lines(self):
        rows = parse_customers('"nome","cidade, UF"\n\nCarla,"Natal, RN"\n\n')
        self.assertEqual(rows, [{"nome": "Carla", "cidade, UF": "Natal, RN"}])

    def test_field_count_still_validated(self):
        with self.assertRaises(ValueError):
            parse_customers('a,b\n"1,2",3,4\n')

    def test_import_file_utf8(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "c.csv")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write('nome,endereco\nJoão,"Av. B, 200"\n')
            self.assertEqual(import_file(path)[0]["endereco"], "Av. B, 200")


if __name__ == "__main__":
    unittest.main()
