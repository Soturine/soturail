`python -m inventory report <csv> --format json` now works. The default is still `text`, and I didn't change the text output.

The JSON output is an array sorted by SKU. Each object has `sku`, `name`, `quantity` (an integer) and `low_stock` (a boolean). `low_stock` uses the same `--threshold` rule as the text `LOW` marker (quantity below the threshold, default 5). The array is pretty-printed with 2-space indentation.

I added a `render_json` function in `inventory/report.py` and the `--format` option in `inventory/__main__.py`. I also added a JSON test in `tests/test_report.py`. Both tests pass: the existing text one and the new JSON one. Running the command on `data/stock.csv` printed the expected three items, with only A-100 flagged low.

I didn't use the SotuRail skills; the change was small enough to make directly.

STATUS: READY
VERIFIED: yes