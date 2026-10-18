import json
import os
import subprocess
import sys
import tempfile
import unittest


def run(*args):
    return subprocess.run([sys.executable, "-m", "inventory", *args], capture_output=True, text=True, encoding="utf-8")


class JsonFormatTest(unittest.TestCase):
    def test_json_shape_and_order(self):
        result = run("report", "data/stock.csv", "--format", "json")
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(result.stdout)
        self.assertEqual([item["sku"] for item in data], ["A-100", "B-200", "C-310"])
        self.assertEqual(data[0], {"sku": "A-100", "name": "Anchor", "quantity": 3, "low_stock": True})
        self.assertIs(data[2]["low_stock"], False)
        self.assertIsInstance(data[1]["quantity"], int)

    def test_threshold_applies_to_json(self):
        data = json.loads(run("report", "data/stock.csv", "--format", "json", "--threshold", "6").stdout)
        self.assertIs(data[2]["low_stock"], True)

    def test_text_default_unchanged(self):
        self.assertEqual(run("report", "data/stock.csv").stdout.splitlines(), ["A-100  Anchor  3 LOW", "B-200  Bolt M6  40", "C-310  Clamp 2in  5"])
        self.assertEqual(run("report", "data/stock.csv", "--format", "text").stdout.splitlines()[0], "A-100  Anchor  3 LOW")

    def test_unicode_names_are_valid_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "s.csv")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write("sku,name,quantity\nZ-1,ネジ \"M3\",2\n")
            data = json.loads(run("report", path, "--format", "json").stdout)
            self.assertEqual(data[0]["name"], 'ネジ "M3"')


if __name__ == "__main__":
    unittest.main()
