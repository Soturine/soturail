`python -m inventory report <csv> --format json` now prints a JSON array sorted by SKU. Each object has `sku`, `name`, `quantity` (integer) and `low_stock` (boolean). Both tests pass, and I ran the command on `data/stock.csv` to check the JSON output by eye.

- **Default output:** the default is `--format text`, so the existing text output is unchanged. The original text test still passes.
- **Low-stock rule:** `low_stock` uses the same rule as the text `LOW` marker: `quantity < --threshold`, with the threshold defaulting to 5.
- **Non-ASCII names:** JSON output is written with `ensure_ascii=False`, so non-ASCII product names appear as-is rather than as `\uXXXX` escapes.
- **Changes:** I added `render_json` in `inventory/report.py` and the `--format` option in `inventory/__main__.py`. I also added `test_json_report` in `tests/test_report.py`.

STATUS: READY
VERIFIED: yes