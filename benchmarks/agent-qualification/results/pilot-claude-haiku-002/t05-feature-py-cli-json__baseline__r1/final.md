`python -m inventory report <csv> --format json` now works. Output is a JSON array sorted by SKU, with `sku`, `name`, `quantity` (int), and `low_stock` (bool). The default text output is unchanged.

Changes:
- **`inventory/report.py`**: added `render_json(items, threshold)`. `low_stock` uses the same `quantity < threshold` rule as the text output's ` LOW` flag.
- **`inventory/__main__.py`**: added `--format {text,json}` with `text` as the default. Any other value is rejected by argparse.
- **`tests/test_report.py`**: added `test_json_report`, which parses the JSON and checks the exact records for `data/stock.csv`.
- **`README.md`**: documented the new option and the JSON fields.

Verification: `python -m unittest discover -s tests -v` passes both tests. I also ran the CLI by hand in both formats and checked that an unknown format value fails with an error.

Choices I made that you may want to change:
- JSON is pretty-printed with 2-space indentation and non-ASCII characters are kept as-is (`ensure_ascii=False`).
- The `--threshold` option applies to JSON too, since `low_stock` depends on it.

Nothing is committed. The two untracked `__pycache__/` directories were already there before I started.

STATUS: READY
VERIFIED: yes