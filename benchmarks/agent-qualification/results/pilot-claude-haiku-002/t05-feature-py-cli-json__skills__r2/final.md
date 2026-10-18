`python -m inventory report <csv> --format json` now works. It prints a JSON array sorted by SKU, with `sku`, `name`, `quantity` (int), and `low_stock` (bool) on each object. The default text output is unchanged.

Changes:
- **`inventory/report.py`**: added `render_json(items, threshold)`. `low_stock` uses the same `quantity < threshold` rule as the text `LOW` flag.
- **`inventory/__main__.py`**: added `--format {text,json}`, defaulting to `text`.
- **`tests/test_report.py`**: added `test_json_report`, which checks the parsed output against the sample data.

Choices I made:
- `--format` is a choice flag with `text` as the default, so an unknown value is rejected by argparse.
- The JSON uses the default `ensure_ascii`, so non-ASCII names are escaped as `\uXXXX`. I did this so printing doesn't fail on consoles with a non-UTF-8 code page, such as Windows cp932. Say if you'd rather have raw UTF-8 characters.

Verification: `pytest` and `unittest discover` both pass (2 tests). I also ran the CLI in both formats and with an invalid format value. The changes are uncommitted in the working tree.

STATUS: READY
VERIFIED: yes