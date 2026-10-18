import subprocess
import sys
import unittest


class ReportTest(unittest.TestCase):
    def test_text_report(self):
        out = subprocess.run([sys.executable, "-m", "inventory", "report", "data/stock.csv"], capture_output=True, text=True, check=True).stdout
        self.assertEqual(out.splitlines(), ["A-100  Anchor  3 LOW", "B-200  Bolt M6  40", "C-310  Clamp 2in  5"])


if __name__ == "__main__":
    unittest.main()
