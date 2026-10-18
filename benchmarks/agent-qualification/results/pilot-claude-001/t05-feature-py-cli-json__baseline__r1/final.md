`python -m inventory report <csv> --format json` now prints a JSON array sorted by SKU. Each object has `sku`, `name`, `quantity` (int) and `low_stock` (bool). The default is still `text`, and its output is unchanged.

I ran the report on `data/stock.csv` in both formats and ran `tests.test_report`; both tests pass. The new test, `test_json_report`, compares the JSON output against the expected three records. The existing text test still passes.

`low_stock` uses the same rule as the `LOW` marker in the text output: quantity below `--threshold`, which defaults to 5. The changes are in `inventory/report.py` (new `render_json`), `inventory/__main__.py` and `tests/test_report.py`.

STATUS: READY
VERIFIED: yes