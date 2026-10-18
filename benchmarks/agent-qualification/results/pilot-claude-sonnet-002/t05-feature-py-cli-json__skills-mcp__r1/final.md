`python -m inventory report <csv> --format json` now works. The default is `--format text`, and the text output is unchanged.

The JSON is an array of objects sorted by SKU, each with `sku`, `name`, `quantity` (integer) and `low_stock` (boolean). `low_stock` uses the same rule as the text report's `LOW` marker: quantity below `--threshold` (default 5). The output is pretty-printed with 2-space indentation, and non-ASCII characters are kept as-is rather than escaped.

I added `render_json` in `inventory/report.py` and the option in `inventory/__main__.py`. I also added `test_json_report` to `tests/test_report.py`. Both tests pass (the existing text one and the new JSON one), and I ran the JSON command on `data/stock.csv` and the output looked right.

STATUS: READY
VERIFIED: yes